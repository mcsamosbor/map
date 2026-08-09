<template>
  <div ref="canvasHolder" class="pixi-map" @contextmenu.prevent>
    <!-- qwe -->
    <Application
      v-if="canvasHolder"
      key="app"
      ref="appRef"
      :background-alpha="0"
      :width="1080"
      :height="720"
      :auto-density="true"
      :resolution="resolution"
      :antialias="true"
      :resize-to="canvasHolder"
    >
      <Viewport
        @vue:mounted="onViewportMounted"
        :events="appRef!.app.renderer.events"
        :screen-width="appWidth"
        :screen-height="appHeight"
        :world-width="viewportSize"
        :world-height="viewportSize"
      >
        <Container v-if="!store.loading" :x="viewportSize / 2" :y="viewportSize / 2">
          <Block v-for="block in visibleBlocks" :block="block" :key="`block_${block.id}`"></Block>
          <template v-if="store.isEditing"
            ><BlockTransition
              v-for="[cellX, cellY, info] in possibleTransitions"
              :key="`possible_transition_${cellX}_${cellY}`"
              :cell="[cellX, cellY]"
              @click="createTransition(cellX, cellY, info)"
              :type="'creatable'"
            ></BlockTransition
          ></template>

          <BlockTransition
            v-for="transition in existsTransitions"
            :key="`transition_${transition.cell[0]}_${transition.cell[1]}`"
            :type="store.isEditing ? 'deletable' : 'exists'"
            :cell="transition.cell"
            @click="deleteTransition(transition)"
          ></BlockTransition>
        </Container>
      </Viewport>
    </Application>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, useTemplateRef, computed } from "vue";
import { Viewport as PIXIViewport } from "pixi-viewport";
import {
  displayFloorToIndex,
  PassagePositions,
  validatePassage,
  type BlockData,
  type BlockUid,
  type PassagePosition,
  type PassageType,
} from "@/types/block";
import { Application } from "vue3-pixi";
import Block from "../pixi/block/DisplayBlock.vue";
import BlockTransition from "../pixi/block/Transition.vue";
import { useTransitionsStore } from "@/stores/transitions.ts";
import { NestedMap3 } from "@/utils.ts";
import { useBlocksStore } from "@/stores/blocks";
import { getTransitionsCell } from "@/types/transition.ts";
import { useCanvasContextStore } from "@/stores/canvasContext.ts";

const canvasHolder = useTemplateRef("canvasHolder");

const appWidth = ref(400);
const appHeight = ref(300);

const resolution = computed(() => window.devicePixelRatio || 1);

const store = useBlocksStore();

const appRef = ref<Application>();

const viewportSize = 30000;

const updateAppSizes = () => {
  appWidth.value = canvasHolder.value!.clientWidth;
  appHeight.value = canvasHolder.value!.clientHeight;
};

const observer = new ResizeObserver(() => {
  updateAppSizes();
});

const canvasContext = useCanvasContextStore();

const onViewportMounted = (viewport: { el: PIXIViewport }) => {
  const pixiviewport = viewport.el;
  pixiviewport.moveCenter(viewportSize / 2, viewportSize / 2);
  pixiviewport
    .drag()
    .pinch()
    .wheel()
    .decelerate()
    .clamp({ direction: "all" })
    .clampZoom({ minScale: 0.1, maxScale: 1 });

  pixiviewport.on("rightclick", (event) => {
    if (event.target !== pixiviewport) return;
    event.preventDefault();
    const viewportPos = event.getLocalPosition(pixiviewport);
    const localPos = { x: viewportPos.x - viewportSize / 2, y: viewportPos.y - viewportSize / 2 };
    canvasContext.showContextMenu(localPos.x, localPos.y, event.screenX, event.screenY);
  });
  pixiviewport.on("tap", (event) => {
    if (event.target !== pixiviewport) return;
    const localPos = event.getLocalPosition(pixiviewport);
    canvasContext.showCross(localPos.x, localPos.y);
    if (canvasContext.isTouchDevice) {
      // На мобильных показываем крестик и активируем раздвижное меню
      // Здесь же можно триггернуть раздвижное меню через тот же стор
    } else {
      // На десктопе обычный левый клик можно игнорировать или сделать то же,
      // что и правый? По вашему заданию только ПКМ. Оставим пустым.
    }
  });
  pixiviewport.on("pointerdown", () => {
    canvasContext.hideAll();
  });
};

onMounted(() => {
  observer.observe(canvasHolder.value!);

  updateAppSizes();
});

const visibleBlocks = computed(() => {
  return store.blocks.filter((block) => {
    const floor = store.layer - block.layer;
    return floor >= (block.min_floor ?? 0) && floor <= (block.max_floor ?? 0); // TODO fix to use real floor indexes
  });
});

type possibleTransitionInfo = {
  blockId: BlockUid;
  floorIdx: number;
  layer: number;
  pos: PassagePosition;
  type: PassageType;
};

const allTransitionsData = computed(() => {
  const allTransitons = new NestedMap3<number, number, number, possibleTransitionInfo[]>(); // layer, x, y,
  const blocks = store.blocks;
  for (const block of blocks) {
    const minDisplayFloor = block.min_floor ?? 0;
    const maxDisplayFloor = block.max_floor ?? 0;
    const minFloorIdx = displayFloorToIndex(minDisplayFloor, block);
    const maxFloorIdx = displayFloorToIndex(maxDisplayFloor, block);
    for (let floor = minFloorIdx; floor <= maxFloorIdx; floor++) {
      const layer = block.layer + floor;
      for (const passagePosition of PassagePositions) {
        const floors_data = block.floors_data?.[floor];
        const passageType = validatePassage(
          floors_data?.passages_data?.[passagePosition],
          passagePosition,
        );
        const [transitionX, transitionY] = getTransitionsCell(block, passagePosition);
        if (
          passageType !== "noway" &&
          !transitionsStore.mappedTransitions.get(layer, transitionX, transitionY)
        ) {
          let toLayer: number;
          if (passageType === "stairs_down") {
            toLayer = layer - 1;
          } else if (passageType === "stairs_up") {
            toLayer = layer + 1;
          } else {
            toLayer = layer;
          }
          const list = allTransitons.get(toLayer, transitionX, transitionY) ?? [];
          const data = {
            blockId: block.id,
            floorIdx: floor,
            layer: toLayer,
            pos: passagePosition,
            type: passageType,
          };
          list.push(data);
          allTransitons.set(toLayer, transitionX, transitionY, list);
          if (passageType === "stairs_down" || passageType === "stairs_up") {
            const anotherList = allTransitons.get(layer, transitionX, transitionY) ?? [];
            anotherList.push(data);
            allTransitons.set(layer, transitionX, transitionY, anotherList);
          }
        }
      }
    }
  }
  return allTransitons;
});

const possibleTransitions = computed(() => {
  const layer = store.layer;
  const allTransitions = allTransitionsData.value;
  const layerTransitions = allTransitions.getInner(layer);
  const result = [...(layerTransitions?.entries() ?? [])].filter(([, , infos]) => {
    return !!infos.find((data1) => {
      const layer = data1.layer;
      return !!infos.find((data2) => {
        if (data2 === data1) return;
        return data2.layer === layer;
      });
    });
  });
  return result;
});

const transitionsStore = useTransitionsStore();

const existsTransitions = computed(() => {
  const exists = transitionsStore.transitions
    .map((transition) => {
      const block = store.getBlock(transition.from_block_id);
      const block2 = store.getBlock(transition.to_block_id);
      if (!block || !block2) return;
      const position = transition.from_position;
      const floor = transition.from_floor;
      const layer = block.layer + floor;
      const floor2 = transition.to_floor;
      const layer2 = block2.layer + floor2;
      if (layer !== store.layer && layer2 !== store.layer) return;
      const cell = getTransitionsCell(block, position);
      return {
        block,
        position,
        cell,
      };
    })
    .filter((item) => item !== undefined);
  return exists;
});

const createTransition = (cellX: number, cellY: number, info: possibleTransitionInfo[]) => {
  if (!store.isEditing) return;
  const from = info[0];
  const to = info[1];
  if (!from || !to) return;
  transitionsStore.addTransition({
    from_block_id: from.blockId,
    from_floor: from.floorIdx,
    from_position: from.pos,
    to_block_id: to.blockId,
    to_floor: to.floorIdx,
    to_position: to.pos,
  });
};

const deleteTransition = (transition: {
  block: BlockData;
  position: PassagePosition;
  cell: [number, number];
}) => {
  if (!store.isEditing) return;
  const layer = store.layer;
  const [x, y] = transition.cell;
  const id = transitionsStore.mappedTransitions.get(layer, x, y)?.id;
  if (!id) {
    console.warn("Didnt find transition: ", transition);
    return;
  }
  transitionsStore.removeTransition(id);
};
</script>

<style scoped>
.pixi-map {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
}
</style>
