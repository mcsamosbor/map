<template>
  <div ref="canvasHolder" class="pixi-map">
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
        <Container :x="viewportSize / 2" :y="viewportSize / 2">
          <Block v-for="block in visibleBlocks" :block="block" :key="`block_${block.id}`"></Block>
          <BlockTransition
            v-if="store.isEditing"
            v-for="{ cell: [cellX, cellY], info } in possibleTransitions"
            :key="`possible_transition_${cellX}_${cellY}`"
            :cell="[cellX, cellY]"
            @click="createTransition(cellX, cellY, info)"
            :type="'creatable'"
          ></BlockTransition>
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
  PassagePositions,
  useBlocksStore,
  validatePassage,
  type BlockData,
  type BlockUid,
  type PassagePosition,
  type PassageType,
} from "@/stores/blocks";
import { Application } from "vue3-pixi";
import Block from "../pixi/block/Block.vue";
import { transitionPositions } from "@/const/rendering.ts";
import BlockTransition from "../pixi/block/Transition.vue";
import { getTransitionsCell, useTransitionsStore } from "@/stores/transitions.ts";
import { NestedMap2 } from "@/utils.ts";

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

const onViewportMounted = (viewport: any) => {
  const pixiviewport = viewport.el as PIXIViewport;
  pixiviewport.moveCenter(viewportSize / 2, viewportSize / 2);
  pixiviewport
    .drag()
    .pinch()
    .wheel()
    .decelerate()
    .clamp({ direction: "all" })
    .clampZoom({ minScale: 0.1, maxScale: 1 });
};

onMounted(() => {
  observer.observe(canvasHolder.value!);

  updateAppSizes();
});

const visibleBlocks = computed(() => {
  return store.blocks.filter((block) => {
    const floor = store.layer - block.layer;
    return floor >= block.min_floor && floor <= block.max_floor;
  });
});

type transitionCellInfo = {
  blockId: BlockUid;
  floor: number;
  pos: PassagePosition;
  type: PassageType;
};

const possibleTransitions = computed(() => {
  const transitionsInfo = new NestedMap2<number, number, transitionCellInfo[]>();
  for (const block of visibleBlocks.value) {
    const floor = store.layer - block.layer;
    const floors_data = block.floors_data?.[floor];
    if (floors_data) {
      for (const passagePosition of PassagePositions) {
        const passageType = validatePassage(
          floors_data.passages_data?.[passagePosition],
          passagePosition,
        );
        if (passageType !== "noway") {
          const blockId = block.id;
          const blockX = block.position_x;
          const blockY = -block.position_y;
          const transitionPos = transitionPositions[passagePosition][block.direction];
          const transitionX = blockX * 2 + transitionPos[0];
          const transitionY = blockY * 2 + transitionPos[1];
          const list = transitionsInfo.get(transitionX, transitionY) ?? [];
          list.push({ blockId, floor, pos: passagePosition, type: passageType });
          transitionsInfo.set(transitionX, transitionY, list);
        }
      }
    }
  }
  const filtered: { cell: [number, number]; info: transitionCellInfo[] }[] = [];

  for (const [cellX, cellY, item] of transitionsInfo) {
    if (item.length < 2) continue;

    const layer = store.layer;
    if (transitionsStore.mappedTransitions.get(layer, cellX, cellY)) continue;

    filtered.push({ cell: [cellX, cellY], info: item });
  }

  return filtered;
});

const transitionsStore = useTransitionsStore();

const existsTransitions = computed(() => {
  return transitionsStore.transitions
    .map((transition) => {
      const block = store.getBlock(transition.from_block_id);
      if (!block) return;
      const position = transition.from_position;
      const cell = getTransitionsCell(block, position);
      return {
        block,
        position,
        cell,
      };
    })
    .filter((item) => item !== undefined);
});

const createTransition = (cellX: number, cellY: number, info: transitionCellInfo[]) => {
  if (!store.isEditing) return;
  const from = info[0];
  const to = info[1];
  if (!from || !to) return;
  transitionsStore.addTransition({
    id: Math.floor(Math.random() * 100000),
    from_block_id: from.blockId,
    from_floor: from.floor,
    from_position: from.pos,
    to_block_id: to.blockId,
    to_floor: to.floor,
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
