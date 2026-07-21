<script lang="ts" setup>
import { useBlocksStore } from "@/stores/blocks";
import Slider from "./slider/Slider.vue";
import PixiMap from "./PixiMap.vue";

const store = useBlocksStore();

// let unsubscribe: (() => void) | null = null;

// onMounted(async () => {
//   await store.fetchBlocks();
//   unsubscribe = store.subscribeToBlocks();
// });

// onUnmounted(() => {
//   if (unsubscribe) unsubscribe();
// });
</script>
<template>
  <div class="canvas">
    <div v-if="store.loading">Loading</div>
    <PixiMap></PixiMap>
    <div class="slider">
      <Slider v-model="store.layer" :min="-15" :max="15" :step="1"></Slider>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.canvas {
  flex: 1;
  display: flex;
  width: 100%;
  position: relative;
}

.slider {
  position: absolute;
  height: 100%;
  right: 0px;
  top: 0px;
}
</style>
