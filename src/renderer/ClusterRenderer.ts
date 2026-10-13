import { Container, Graphics, GraphicsContext, Text, TextStyle } from "pixi.js";
import {
  CELL_SIZE,
  CLUSTER_FRAME_STROKE,
  CLUSTER_LINK_FONT,
  CLUSTER_LINK_STROKE,
  CLUSTER_PADDING,
  CLUSTER_TITLE_FONT,
  CLUSTER_TITLE_HEIGHT,
  GAP,
  PASSAGE_WIDTH,
  TRANSITION_CELL_SIZE,
  getBlockSizes,
} from "@/const/rendering";
import type { BlockData, BlockUid } from "@/types/block";
import {
  clusterNodeKey,
  computeBlockClusters,
  computeClusterLinks,
  type BlockCluster,
  type ClusterLink,
  type ClusterNodeKey,
} from "@/types/cluster";
import { getTransitionsCell, type TransitionData } from "@/types/transition";
import { BlockView, type BlockViewCallbacks } from "./BlockView";
import {
  layoutClusters,
  routeClusterLink,
  type ClusterLinkRoute,
  type ClusterPanelRect,
} from "./clusterLayout";

const titleTextStyle = new TextStyle({
  fill: "white",
  fontSize: CLUSTER_TITLE_FONT,
  fontWeight: "600",
  fontFamily: "Roboto",
});

const linkTextStyle = new TextStyle({
  fill: "white",
  fontSize: CLUSTER_LINK_FONT,
  fontWeight: "600",
  fontFamily: "Roboto",
  align: "center",
});

/** Серый маркер существующего перехода (как в режиме слоёв). */
const transitionExistsContext = new GraphicsContext()
  .rect(0, 0, PASSAGE_WIDTH, PASSAGE_WIDTH)
  .fill("#8E8E8E")
  .stroke({ width: GAP, color: "#FFFFFF", alignment: 0 });

type ClusterBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

/**
 * Границы контента кластера в «мировых» координатах (тех же, что блоки
 * и переходы в режиме слоёв): блоки по position_x/position_y, переходы —
 * по клеткам `getTransitionsCell`.
 */
const computeClusterBounds = (
  cluster: BlockCluster,
  blockById: Map<BlockUid, BlockData>,
  transitionById: Map<number, TransitionData>,
): ClusterBounds => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const extend = (x0: number, y0: number, x1: number, y1: number) => {
    minX = Math.min(minX, x0);
    minY = Math.min(minY, y0);
    maxX = Math.max(maxX, x1);
    maxY = Math.max(maxY, y1);
  };

  for (const node of cluster.nodes) {
    const block = blockById.get(node.blockId);
    if (!block) continue;
    const [width, height] = getBlockSizes(block.direction);
    const x = (block.position_x ?? 0) * CELL_SIZE;
    const y = -(block.position_y ?? 0) * CELL_SIZE;
    extend(x, y, x + width, y + height);
  }

  for (const transitionId of cluster.transitionIds) {
    const transition = transitionById.get(transitionId);
    const fromBlock = transition && blockById.get(transition.from_block_id);
    if (!transition || !fromBlock) continue;
    const [cellX, cellY] = getTransitionsCell(fromBlock, transition.from_position);
    const cx = cellX * TRANSITION_CELL_SIZE;
    const cy = cellY * TRANSITION_CELL_SIZE;
    const half = (PASSAGE_WIDTH + GAP) / 2;
    extend(cx - half, cy - half, cx + half, cy + half);
  }

  if (minX === Infinity) {
    return { minX: 0, minY: 0, maxX: CELL_SIZE, maxY: CELL_SIZE };
  }
  return { minX, minY, maxX, maxY };
};

/**
 * Рендер кластерного вида карты.
 *
 * Поле из панелей кластеров: каждая панель («Слой N») содержит блоки
 * кластера (готовые `BlockView`, внешний вид не меняется) и внутренние
 * переходы; между панелями рисуются линии связей с подписями переходных
 * блоков («Переходной блок: N (Этажи X <=> Y)»).
 */
export class ClusterRenderer {
  readonly root: Container;

  private readonly callbacks: BlockViewCallbacks;
  /** View блоков по ключу «блок + слой»: блок может быть в нескольких кластерах. */
  private readonly views = new Map<ClusterNodeKey, BlockView>();
  /** Мировые центры блоков — для фокусировки камеры из поиска. */
  private readonly viewWorldCenters = new Map<ClusterNodeKey, { x: number; y: number }>();

  private selectedBlockId: BlockUid | undefined;
  private blinkInterval: ReturnType<typeof setInterval> | null = null;

  constructor(callbacks: BlockViewCallbacks) {
    this.callbacks = callbacks;
    this.root = new Container();
    // "passive": сам контейнер не кликабельный, но дети (блоки) — да.
    // Нельзя "none" — в Pixi v8 он отсекает всё поддерево от hit-testing.
    this.root.eventMode = "passive";
  }

  /** Пересобрать поле кластеров (вызывается при смене данных или режима). */
  sync(blocks: BlockData[], transitions: TransitionData[]) {
    const clusters = computeBlockClusters(blocks, transitions);
    const links = computeClusterLinks(clusters, blocks);

    const blockById = new Map<BlockUid, BlockData>();
    for (const block of blocks) blockById.set(block.id, block);
    const transitionById = new Map<number, TransitionData>();
    for (const transition of transitions) transitionById.set(transition.id, transition);

    const bounds = clusters.map((cluster) =>
      computeClusterBounds(cluster, blockById, transitionById),
    );
    const panelSizes = bounds.map((bound) => ({
      width: bound.maxX - bound.minX + 2 * CLUSTER_PADDING,
      height: bound.maxY - bound.minY + CLUSTER_TITLE_HEIGHT + CLUSTER_PADDING,
    }));
    const rects = layoutClusters(
      panelSizes,
      links.map((link) => ({ from: link.fromCluster, to: link.toCluster })),
    );

    // Панели пересобираются целиком (данные меняются редко), а BlockView
    // переиспользуются по ключу «блок + слой».
    for (const view of this.views.values()) {
      view.root.removeFromParent();
    }
    for (const child of this.root.removeChildren()) {
      child.destroy({ children: true });
    }
    this.viewWorldCenters.clear();

    const routes = this.buildLinkRoutes(links, rects);
    // Линии связей — под панелями, чтобы не перекрывать кластеры
    this.buildLinkLines(links, routes);

    const usedKeys = new Set<ClusterNodeKey>();
    clusters.forEach((cluster, index) => {
      const bound = bounds[index]!;
      const rect = rects[index]!;
      this.buildPanel(cluster, rect, bound, blockById, transitionById, usedKeys);
    });
    // Подписи связей — поверх панелей (для читаемости)
    this.buildLinkLabels(links, routes);

    for (const [key, view] of this.views) {
      if (usedKeys.has(key)) continue;
      view.destroy();
      this.views.delete(key);
    }

    this.applySelection();
  }

  /** Собрать панель кластера: рамка, заголовок, блоки и внутренние переходы. */
  private buildPanel(
    cluster: BlockCluster,
    rect: ClusterPanelRect,
    bound: ClusterBounds,
    blockById: Map<BlockUid, BlockData>,
    transitionById: Map<number, TransitionData>,
    usedKeys: Set<ClusterNodeKey>,
  ) {
    const panel = new Container();
    panel.position.set(rect.x, rect.y);
    // "passive": клики проходят к блокам внутри панели (см. комментарий в конструкторе)
    panel.eventMode = "passive";

    const frame = new Graphics()
      .rect(
        CLUSTER_FRAME_STROKE / 2,
        CLUSTER_FRAME_STROKE / 2,
        rect.width - CLUSTER_FRAME_STROKE,
        rect.height - CLUSTER_FRAME_STROKE,
      )
      .stroke({ width: CLUSTER_FRAME_STROKE, color: "#FFFFFF", alignment: 0 });
    frame.eventMode = "none";
    panel.addChild(frame);

    const title = new Text({ text: `Слой ${cluster.layer}`, style: titleTextStyle });
    title.anchor.set(0, 0.5);
    title.position.set(CLUSTER_PADDING, CLUSTER_TITLE_HEIGHT / 2);
    title.eventMode = "none";
    panel.addChild(title);

    // Контент в «мировых» координатах (как в режиме слоёв), смещённый в панель
    const content = new Container();
    content.position.set(CLUSTER_PADDING - bound.minX, CLUSTER_TITLE_HEIGHT - bound.minY);
    content.eventMode = "passive";
    panel.addChild(content);

    for (const node of cluster.nodes) {
      const block = blockById.get(node.blockId);
      if (!block) continue;
      const key = clusterNodeKey(node.blockId, node.layer);
      usedKeys.add(key);
      let view = this.views.get(key);
      if (!view) {
        view = new BlockView(block, this.callbacks);
        this.views.set(key, view);
      }
      view.root.visible = true;
      view.sync(block, node.layer);
      content.addChild(view.root);

      const [width, height] = getBlockSizes(block.direction);
      this.viewWorldCenters.set(key, {
        x: rect.x + content.x + view.root.x + width / 2,
        y: rect.y + content.y + view.root.y + height / 2,
      });
    }

    // Внутренние переходы кластера (серые маркеры, как в режиме слоёв)
    const drawnCells = new Set<string>();
    for (const transitionId of cluster.transitionIds) {
      const transition = transitionById.get(transitionId);
      const fromBlock = transition && blockById.get(transition.from_block_id);
      if (!transition || !fromBlock) continue;
      const [cellX, cellY] = getTransitionsCell(fromBlock, transition.from_position);
      const cellKey = `${cellX}_${cellY}`;
      if (drawnCells.has(cellKey)) continue;
      drawnCells.add(cellKey);
      const graphics = new Graphics(transitionExistsContext);
      graphics.pivot.set(PASSAGE_WIDTH / 2, PASSAGE_WIDTH / 2);
      graphics.position.set(cellX * TRANSITION_CELL_SIZE, cellY * TRANSITION_CELL_SIZE);
      graphics.eventMode = "none";
      content.addChild(graphics);
    }

    this.root.addChild(panel);
  }

  /** Маршруты линий связей (ломаные, обходящие панели по возможности). */
  private buildLinkRoutes(
    links: ClusterLink[],
    rects: ClusterPanelRect[],
  ): (ClusterLinkRoute | null)[] {
    return links.map((link) => {
      const fromRect = rects[link.fromCluster];
      const toRect = rects[link.toCluster];
      if (!fromRect || !toRect) return null;
      return routeClusterLink(fromRect, toRect, rects);
    });
  }

  /** Ломаные линии связей — рисуются под панелями кластеров. */
  private buildLinkLines(links: ClusterLink[], routes: (ClusterLinkRoute | null)[]) {
    links.forEach((link, index) => {
      const route = routes[index];
      if (!route || route.points.length < 2) return;
      const graphics = new Graphics();
      graphics.moveTo(route.points[0]!.x, route.points[0]!.y);
      for (let i = 1; i < route.points.length; i++) {
        graphics.lineTo(route.points[i]!.x, route.points[i]!.y);
      }
      graphics.stroke({ width: CLUSTER_LINK_STROKE, color: "#FFFFFF" });
      graphics.eventMode = "none";
      this.root.addChild(graphics);
    });
  }

  /** Подписи переходных блоков на середине маршрутов — поверх панелей. */
  private buildLinkLabels(links: ClusterLink[], routes: (ClusterLinkRoute | null)[]) {
    links.forEach((link, index) => {
      const route = routes[index];
      if (!route) return;
      const label = new Text({
        text: `Переходной блок:\n${link.blockName} (Этажи ${link.fromFloor} <=> ${link.toFloor})`,
        style: linkTextStyle,
      });
      label.anchor.set(0.5, 1);
      label.position.set(route.label.x, route.label.y - CLUSTER_LINK_STROKE);
      label.eventMode = "none";
      this.root.addChild(label);
    });
  }

  /** Выделить блок (во всех кластерах, где он показан). */
  setSelected(blockId: BlockUid | undefined) {
    this.selectedBlockId = blockId;
    this.applySelection();
  }

  private applySelection() {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    for (const view of this.views.values()) {
      view.setSelected(false);
    }
    if (this.selectedBlockId === undefined) return;
    const selected: BlockView[] = [];
    for (const view of this.views.values()) {
      if (view.blockId !== this.selectedBlockId) continue;
      view.setSelected(true);
      selected.push(view);
    }
    if (selected.length === 0) return;
    this.blinkInterval = setInterval(() => {
      for (const view of selected) {
        view.toggleSelectionAlpha();
      }
    }, 500);
  }

  /** Мировая позиция центра блока (первый попавшийся кластер) для фокуса камеры. */
  getBlockCenter(blockId: BlockUid): { x: number; y: number } | null {
    const prefix = `${blockId}:`;
    for (const [key, center] of this.viewWorldCenters) {
      if (key.startsWith(prefix)) return center;
    }
    return null;
  }

  destroy() {
    if (this.blinkInterval) {
      clearInterval(this.blinkInterval);
      this.blinkInterval = null;
    }
    for (const view of this.views.values()) {
      view.destroy();
    }
    this.views.clear();
    this.viewWorldCenters.clear();
    this.root.destroy({ children: true });
  }
}
