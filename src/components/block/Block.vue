<script lang="ts" setup>
import { useBlocksStore, type BlockData } from "@/stores/blocks.ts";
import Floor from "./Floor.vue";
import { computed, ref } from "vue";

const props = defineProps<{
  data: BlockData;
}>();

const x = () => (props.data.position_x ?? 0) * 380;
const y = () => -(props.data.position_y ?? 0) * 380;

const blocksStore = useBlocksStore();
const currentFloor = computed(() => blocksStore.layer - props.data.layer);
const selectBlock = () => {
  blocksStore.selectedBlockId = props.data.id;
};
</script>
<template>
  <div
    class="block"
    v-bind:rotation="data.direction"
    :style="{ left: `${x()}px`, top: `${y()}px` }"
    @click="selectBlock"
  >
    <Floor :id="data.id" :floor="currentFloor"></Floor>
  </div>
</template>
<style lang="scss" scoped>
.block {
  width: calc(var(--cell-size) * 2);
  height: calc(var(--cell-size));

  position: absolute;
  padding: 25px;
  box-sizing: border-box;

  display: flex;
  align-items: center;
  justify-content: center;

  --main-color: green;
  --extra-color: aquamarine;
}

.block[rotation="right"] {
  transform-origin: 25% 50%;
  rotate: 90deg;
}
.block[rotation="down"] {
  rotate: 180deg;
  transform-origin: 50% 50%;
}
.block[rotation="left"] {
  rotate: 270deg;
  transform-origin: 50% 100%;
}
</style>
