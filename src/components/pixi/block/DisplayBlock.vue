<script setup lang="ts">
import { type BlockData } from "@/types/block";
import Floor from "./BlockFloor.vue";
import { computed, onUnmounted, ref, watch } from "vue";
import { CELL_SIZE, isVertical, PADDING } from "@/const/rendering";
import { useBlocksStore } from "@/stores/blocks";
import type { Graphics } from "pixi.js";

const props = defineProps<{ block: BlockData }>();

const x = () => (props.block.position_x ?? 0) * CELL_SIZE;
const y = () => -(props.block.position_y ?? 0) * CELL_SIZE;

const blocksStore = useBlocksStore();

const floor = computed(() => blocksStore.layer - (props.block.layer ?? 0));

const selectBlock = async () => {
  // Смена выделенного блока — отправляем изменения предыдущего блока на сервер
  if (blocksStore.selectedBlockId && blocksStore.selectedBlockId !== props.block.id) {
    await blocksStore.flushBlock(blocksStore.selectedBlockId);
  }
  blocksStore.selectedBlockId = props.block.id;
};

const isSelected = () => {
  return blocksStore.selectedBlockId === props.block.id;
};

const alpha = ref(1);
let intervalId: ReturnType<typeof setInterval> | null = null;

const blockWidth = computed(() => (isVertical(props.block.direction) ? 1 : 2) * CELL_SIZE);
const blockHeight = computed(() => (isVertical(props.block.direction) ? 2 : 1) * CELL_SIZE);

watch(
  isSelected,
  (selected) => {
    console.log(selected);
    if (selected) {
      intervalId = setInterval(() => {
        alpha.value = alpha.value === 1 ? 0.3 : 1;
      }, 500);
    } else {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      alpha.value = 1;
    }
  },
  { immediate: false },
);

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});

function drawBorder(g: Graphics) {
  g.clear();
  g.roundRect(0, 0, blockWidth.value, blockHeight.value, 10).stroke({ width: 10, color: 0x00ffff });
}
</script>

<template>
  <Container :x="x()" :y="y()">
    <Graphics v-if="isSelected()" :alpha="alpha" event-mode="none" @effect="drawBorder" />
    <Floor :block="block" :floor="floor" :x="PADDING" :y="PADDING" @click="selectBlock"></Floor>
  </Container>
</template>
