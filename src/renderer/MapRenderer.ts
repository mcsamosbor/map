import {
  Application,
  Container,
  Graphics,
  GraphicsContext,
  type FederatedPointerEvent,
} from "pixi.js";
import { Viewport } from "pixi-viewport";
import { GAP, PART_SIZE, PASSAGE_WIDTH } from "@/const/rendering";
import { useBlocksStore } from "@/stores/blocks";
import { useCanvasContextStore } from "@/stores/canvasContext";
import { useTransitionsStore } from "@/stores/transitions";
import {
  PassagePositions,
  getMaxFloorSlot,
  getMinFloorSlot,
  isBlockVisible,
  validatePassage,
  type BlockUid,
  type PassagePosition,
  type PassageType,
} from "@/types/block";
import { getTransitionsCell, type TransitionId } from "@/types/transition";
import { NestedMap3 } from "@/utils";
import { BlockView, type BlockViewCallbacks } from "./BlockView";

export const viewportSize = 30000;

const gridSize = PART_SIZE + 2 * GAP + PASSAGE_WIDTH;

type TransitionType = "exists" | "creatable" | "deletable";

type possibleTransitionInfo = {
  blockId: BlockUid;
  floorIdx: number;
  layer: number;
  pos: PassagePosition;
  type: PassageType;
};

type existsTransitionInfo = {
  cell: [number, number];
  layer: number;
  ids: TransitionId[];
};

const transitionContexts: Record<TransitionType, GraphicsContext> = {
  creatable: new GraphicsContext()
    .rect(0, 0, PASSAGE_WIDTH, PASSAGE_WIDTH)
    .fill("00FF00")
    .stroke({ width: GAP, color: "#FFFFFF", alignment: 0 }),
  exists: new GraphicsContext()
    .rect(0, 0, PASSAGE_WIDTH, PASSAGE_WIDTH)
    .fill("#8E8E8E")
    .stroke({ width: GAP, color: "#FFFFFF", alignment: 0 }),
  deletable: new GraphicsContext()
    .rect(0, 0, PASSAGE_WIDTH, PASSAGE_WIDTH)
    .fill("#8E8E8E")
    .stroke({ width: GAP, color: "#00FF00", alignment: 0 }),
};

type TransitionNode = {
  graphics: Graphics;
};

/**
 * Императивный рендерер карты.
 *
 * Вместо декларативной сцены (vue3-pixi) создаёт Pixi-граф напрямую:
 *  - блоки рендерятся классами BlockView (переиспользуются между слоями);
 *  - статичная геометрия этажа кешируется в GraphicsContext;
 *  - при смене слоя переиспользуются существующие узлы, а не пересоздаются.
 */
export class MapRenderer {
  private readonly holder: HTMLElement;
  private readonly app: Application;
  private viewport!: Viewport;
  private readonly worldContainer: Container;

  private readonly blocksStore = useBlocksStore();
  private readonly transitionsStore = useTransitionsStore();
  private readonly canvasContext = useCanvasContextStore();

  private layer = 0;
  private readonly blockViews = new Map<BlockUid, BlockView>();
  private transitionNodes: TransitionNode[] = [];
  private allTransitionsData = new NestedMap3<number, number, number, possibleTransitionInfo[]>();

  private selectedView: BlockView | null = null;
  private blinkInterval: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  private readonly callbacks: BlockViewCallbacks = {
    onSelect: (blockId) => this.handleBlockSelect(blockId),
    onChangePassageType: (blockId, floor, pos) =>
      this.blocksStore.changePassageType(blockId, floor, pos),
    onChangeFenceType: (blockId, floor) => this.blocksStore.changeFenceType(blockId, floor),
    onChangeFlightStatus: (blockId, floor, flightPos) =>
      this.blocksStore.changeFlightStatus(blockId, floor, flightPos),
  };

  private constructor(holder: HTMLElement) {
    this.holder = holder;
    this.layer = this.blocksStore.layer;
    this.app = new Application();
    this.worldContainer = new Container();
  }

  static async create(holder: HTMLElement): Promise<MapRenderer> {
    const renderer = new MapRenderer(holder);
    await renderer.init();
    return renderer;
  }

  private async init() {
    await this.app.init({
      backgroundAlpha: 0,
      width: this.holder.clientWidth,
      height: this.holder.clientHeight,
      autoDensity: true,
      resolution: window.devicePixelRatio || 1,
      antialias: true,
    });
    this.holder.appendChild(this.app.canvas);

    // Viewport создаётся после инициализации Application: нужен renderer.events
    this.viewport = new Viewport({
      events: this.app.renderer.events,
      screenWidth: this.holder.clientWidth,
      screenHeight: this.holder.clientHeight,
      worldWidth: viewportSize,
      worldHeight: viewportSize,
    });

    this.app.stage.addChild(this.viewport);
    this.viewport.moveCenter(viewportSize / 2, viewportSize / 2);
    this.viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate()
      .clamp({ direction: "all" })
      .clampZoom({ minScale: 0.1, maxScale: 1 });
    this.setupViewportEvents();

    this.worldContainer.position.set(viewportSize / 2, viewportSize / 2);
    this.viewport.addChild(this.worldContainer);

    this.recomputeTransitionsData();
    this.syncBlocks();
    this.syncTransitions();
    this.setSelected(this.blocksStore.selectedBlockId);
    this.setEditing(this.blocksStore.isEditing);
  }

  private setupViewportEvents() {
    this.viewport.on("rightclick", (event: FederatedPointerEvent) => {
      if (event.target !== this.viewport) return;
      event.preventDefault();
      const viewportPos = event.getLocalPosition(this.viewport);
      const localPos = {
        x: viewportPos.x - viewportSize / 2,
        y: viewportPos.y - viewportSize / 2,
      };
      this.canvasContext.showContextMenu(localPos.x, localPos.y, event.screenX, event.screenY);
    });

    this.viewport.on("tap", (event: FederatedPointerEvent) => {
      if (event.target !== this.viewport) return;
      const localPos = event.getLocalPosition(this.viewport);
      this.canvasContext.showCross(localPos.x, localPos.y);
    });

    this.viewport.on("pointerdown", () => {
      this.canvasContext.hideAll();
    });
  }

  // ---- Публичное API (вызывается из Vue-компонента) ----

  moveTo(x: number, y: number) {
    this.viewport.moveCenter(x + viewportSize / 2, y + viewportSize / 2);
  }

  setLayer(layer: number) {
    if (this.destroyed) return;
    this.layer = layer;
    this.syncBlocks();
    this.syncTransitions();
    this.setSelected(this.blocksStore.selectedBlockId);
  }

  setData() {
    if (this.destroyed) return;
    this.recomputeTransitionsData();
    this.syncBlocks();
    this.syncTransitions();
  }

  setSelected(blockId: BlockUid | undefined) {
    if (this.destroyed) return;
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    if (this.selectedView) {
      this.selectedView.setSelected(false);
      this.selectedView = null;
    }
    if (blockId === undefined) return;
    const view = this.blockViews.get(blockId);
    if (!view || !view.root.visible) return;
    this.selectedView = view;
    view.setSelected(true);
    this.blinkInterval = setInterval(() => {
      view.toggleSelectionAlpha();
    }, 500);
  }

  setEditing(editing: boolean) {
    if (this.destroyed) return;
    for (const view of this.blockViews.values()) {
      if (!view.root.visible) continue;
      view.setEditing(editing);
    }
    this.syncTransitions();
  }

  resize(width: number, height: number) {
    if (this.destroyed) return;
    this.app.renderer.resize(width, height);
    this.viewport.resize(width, height);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    for (const view of this.blockViews.values()) {
      view.destroy();
    }
    this.blockViews.clear();
    for (const node of this.transitionNodes) {
      node.graphics.destroy();
    }
    this.transitionNodes = [];
    this.viewport.destroy({ children: true });
    this.app.destroy(true, { children: true, texture: true, context: true });
  }

  // ---- Синхронизация сцены ----

  private syncBlocks() {
    const layer = this.layer;
    const blocks = this.blocksStore.blocks;
    const blockIds = new Set<BlockUid>(blocks.map((block) => block.id));

    // Удаляем вью только для блоков, которых больше нет в данных
    for (const [id, view] of this.blockViews) {
      if (blockIds.has(id)) continue;
      if (this.selectedView === view) {
        this.selectedView = null;
        if (this.blinkInterval) {
          clearInterval(this.blinkInterval);
          this.blinkInterval = null;
        }
      }
      view.destroy();
      this.blockViews.delete(id);
    }

    // BlockView переиспользуются между слоями: просто показываем/прячем
    // и синхронизируем видимые. Это исключает пересоздание Text/Graphics,
    // которое было главным источником долгого flushJobs при смене слоя.
    for (const block of blocks) {
      const visible = isBlockVisible(block, layer);
      let view = this.blockViews.get(block.id);
      if (!view) {
        view = new BlockView(block, this.callbacks);
        this.blockViews.set(block.id, view);
        this.worldContainer.addChild(view.root);
      }
      view.root.visible = visible;
      if (visible) view.sync(block, layer);
    }

    // Скрываем выделение, если выбранный блок не виден на текущем слое
    if (this.selectedView && !this.selectedView.root.visible) {
      this.selectedView.setSelected(false);
      this.selectedView = null;
      if (this.blinkInterval) {
        clearInterval(this.blinkInterval);
        this.blinkInterval = null;
      }
    }
  }

  private syncTransitions() {
    for (const node of this.transitionNodes) {
      node.graphics.destroy();
    }
    this.transitionNodes = [];

    const editing = this.blocksStore.isEditing;

    // Сначала «создаваемые» переходы, затем существующие (они поверх)
    if (editing) {
      for (const [cellX, cellY, info] of this.computePossibleTransitions()) {
        this.addTransitionGraphics([cellX, cellY], "creatable", info);
      }
    }

    const exists = this.computeExistsTransitions();
    for (const transition of exists) {
      this.addTransitionGraphics(transition.cell, editing ? "deletable" : "exists", transition);
    }
  }

  private addTransitionGraphics(
    cell: [number, number],
    type: TransitionType,
    payload: possibleTransitionInfo[] | existsTransitionInfo,
  ) {
    const graphics = new Graphics(transitionContexts[type]);
    graphics.pivot.set(PASSAGE_WIDTH / 2, PASSAGE_WIDTH / 2);
    graphics.position.set(cell[0] * gridSize, cell[1] * gridSize);
    graphics.eventMode = "static";
    graphics.cursor = "pointer";
    graphics.on("pointertap", () => {
      if (type === "creatable") {
        this.createTransition(cell[0], cell[1], payload as possibleTransitionInfo[]);
      } else {
        this.deleteTransition(payload as existsTransitionInfo);
      }
    });
    this.worldContainer.addChild(graphics);
    this.transitionNodes.push({ graphics });
  }

  // ---- Вычисления переходов (порт из старого PixiMap.vue) ----

  private recomputeTransitionsData() {
    const allTransitions = new NestedMap3<number, number, number, possibleTransitionInfo[]>();
    const mappedTransitions = this.transitionsStore.mappedTransitions;
    for (const block of this.blocksStore.blocks) {
      const minFloorIdx = getMinFloorSlot(block);
      const maxFloorIdx = getMaxFloorSlot(block);
      for (let floor = minFloorIdx; floor <= maxFloorIdx; floor++) {
        const layer = block.layer + floor;
        for (const passagePosition of PassagePositions) {
          const passageType = validatePassage(
            block.floors_data?.[floor]?.passages_data?.[passagePosition],
            passagePosition,
          );
          const [transitionX, transitionY] = getTransitionsCell(block, passagePosition);
          if (passageType === "noway" || mappedTransitions.get(layer, transitionX, transitionY)) {
            continue;
          }
          let toLayer: number;
          if (passageType === "stairs_down") {
            toLayer = layer - 1;
          } else if (passageType === "stairs_up") {
            toLayer = layer + 1;
          } else {
            toLayer = layer;
          }
          const list = allTransitions.get(toLayer, transitionX, transitionY) ?? [];
          const data: possibleTransitionInfo = {
            blockId: block.id,
            floorIdx: floor,
            layer: toLayer,
            pos: passagePosition,
            type: passageType,
          };
          list.push(data);
          allTransitions.set(toLayer, transitionX, transitionY, list);
          if (passageType === "stairs_down" || passageType === "stairs_up") {
            const anotherList = allTransitions.get(layer, transitionX, transitionY) ?? [];
            anotherList.push(data);
            allTransitions.set(layer, transitionX, transitionY, anotherList);
          }
        }
      }
    }
    this.allTransitionsData = allTransitions;
  }

  private computePossibleTransitions() {
    const layer = this.layer;
    const layerTransitions = this.allTransitionsData.getInner(layer);
    const result = [...(layerTransitions?.entries() ?? [])].filter(([, , infos]) => {
      return !!infos.find((data1) => {
        const targetLayer = data1.layer;
        return !!infos.find((data2) => data2 !== data1 && data2.layer === targetLayer);
      });
    });
    return result;
  }

  private computeExistsTransitions() {
    const result = new Map<string, existsTransitionInfo>();
    for (const transition of this.transitionsStore.transitions) {
      const block = this.blocksStore.getBlock(transition.from_block_id);
      const block2 = this.blocksStore.getBlock(transition.to_block_id);
      if (!block || !block2) continue;
      const layer = block.layer + transition.from_floor;
      const layer2 = block2.layer + transition.to_floor;
      if (layer !== this.layer && layer2 !== this.layer) continue;
      const cell = getTransitionsCell(block, transition.from_position);
      const key = `${layer}_${cell[0]}_${cell[1]}`;
      const existing = result.get(key);
      if (existing) {
        existing.ids.push(transition.id);
      } else {
        result.set(key, { cell, layer, ids: [transition.id] });
      }
    }
    return [...result.values()];
  }

  private createTransition(cellX: number, cellY: number, info: possibleTransitionInfo[]) {
    if (!this.blocksStore.isEditing) return;
    const from = info[0];
    const to = info[1];
    if (!from || !to) return;
    this.transitionsStore.addTransition({
      from_block_id: from.blockId,
      from_floor: from.floorIdx,
      from_position: from.pos,
      to_block_id: to.blockId,
      to_floor: to.floorIdx,
      to_position: to.pos,
    });
  }

  private deleteTransition(transition: existsTransitionInfo) {
    if (!this.blocksStore.isEditing) return;
    transition.ids.forEach((id) => {
      this.transitionsStore.removeTransition(id);
    });
  }

  private handleBlockSelect(blockId: BlockUid) {
    const store = this.blocksStore;
    const previous = store.selectedBlockId;
    if (previous && previous !== blockId) {
      void store.flushBlock(previous);
    }
    store.selectedBlockId = blockId;
  }
}
