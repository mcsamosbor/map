<script setup lang="ts">
import { type BlockData } from "@/types/block";
import Floor from "./BlockFloor.vue";
import { computed } from "vue";
import { CELL_SIZE, PADDING } from "@/const/rendering";
import { useBlocksStore } from "@/stores/blocks";

const props = defineProps<{ block: BlockData }>();

const x = () => (props.block.position_x ?? 0) * CELL_SIZE;
const y = () => -(props.block.position_y ?? 0) * CELL_SIZE;

const blocksStore = useBlocksStore();

const floor = computed(() => blocksStore.layer - (props.block.layer ?? 0));

const selectBlock = () => {
  blocksStore.selectedBlockId = props.block.id;
};
</script>

<template>
  <Container :x="x()" :y="y()">
    <Floor :block="block" :floor="floor" :x="PADDING" :y="PADDING" @click="selectBlock"></Floor>
  </Container>
</template>
