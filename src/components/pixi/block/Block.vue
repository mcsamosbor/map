<script setup lang="ts">
import { useBlocksStore, type BlockData } from "@/stores/blocks";
import Floor from "./Floor.vue";
import { computed, onMounted } from "vue";
import { CELL_SIZE, PADDING } from "@/const/rendering.ts";

const props = defineProps<{ block: BlockData }>();

const isVertical = () => props.block.direction === "left" || props.block.direction === "right";

const blockWidth = () => {
  return isVertical() ? CELL_SIZE : CELL_SIZE * 2;
};
const blockHeight = () => (isVertical() ? CELL_SIZE * 2 : CELL_SIZE);

const x = () => (props.block.position_x ?? 0) * CELL_SIZE;
const y = () => -(props.block.position_y ?? 0) * CELL_SIZE;

const blocksStore = useBlocksStore();

const floor = computed(() => blocksStore.layer - props.block.layer);

// TODO поправить с учетом двойных этажей
const isVisible = computed(() => {
  return floor.value >= props.block.min_floor && floor.value <= props.block.max_floor;
});

const selectBlock = () => {
  blocksStore.selectedBlockId = props.block.id;
};
</script>

<template>
  <Container v-if="isVisible" :x="x()" :y="y()">
    <Floor :block="block" :floor="floor" :x="PADDING" :y="PADDING" @click="selectBlock"></Floor>
  </Container>
</template>
