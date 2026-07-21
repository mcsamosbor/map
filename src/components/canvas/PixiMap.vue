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
          <Block v-for="block in store.blocks" :block="block"></Block>
        </Container>

        <Graphics :width="100" :height="50"></Graphics>
        <Sprite></Sprite>
      </Viewport>
    </Application>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, useTemplateRef, computed } from "vue";
import { Viewport as PIXIViewport } from "pixi-viewport";
import { useBlocksStore } from "@/stores/blocks";
import { initDevtools } from "@pixi/devtools";
import { Application } from "vue3-pixi";
import Block from "../pixi/block/Block.vue";

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
  console.log(canvasHolder.value);
  observer.observe(canvasHolder.value!);
  initDevtools({ app: appRef.value?.app! });

  updateAppSizes();
});
</script>

<style scoped>
.pixi-map {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
}
</style>
