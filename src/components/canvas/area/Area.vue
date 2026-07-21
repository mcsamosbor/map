<template>
  <div
    ref="containerRef"
    class="canvas-container"
    @mousedown="(e) => onMouseDown(e, containerRef!)"
    @wheel="(e) => onWheel(e, containerRef!)"
    @touchstart="(e) => onTouchStart(e, containerRef!)"
    @touchmove="(e) => onTouchMove(e, containerRef!)"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <div class="canvas-content" :style="contentStyle">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { usePanZoom } from "@/composables/usePanZoom";

// Опции (можно передать через пропсы)
const props = defineProps<{
  minScale?: number;
  maxScale?: number;
  step?: number;
}>();

const containerRef = ref<HTMLElement | null>(null);

const {
  offsetX,
  offsetY,
  scale,
  onMouseDown,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  zoomIn,
  zoomOut,
  resetView,
} = usePanZoom({
  minScale: props.minScale ?? 0.1,
  maxScale: props.maxScale ?? 5,
  step: props.step ?? 0.05,
});

const contentStyle = computed(() => ({
  transform: `translate(${offsetX.value}px, ${offsetY.value}px) scale(${scale.value})`,
  transformOrigin: "0 0",
}));

// Экспонируем методы для родителя
defineExpose({
  zoomIn,
  zoomOut,
  resetView,
  offsetX,
  offsetY,
  scale,
});
</script>

<style scoped lang="scss">
.canvas-container {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  cursor: grab;
  user-select: none;
  touch-action: none; // отключаем стандартные жесты браузера

  &:active {
    cursor: grabbing;
  }

  .canvas-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform-origin: 0 0;
    will-change: transform;
    pointer-events: none; // события мыши проходят сквозь к дочерним элементам

    > * {
      pointer-events: auto; // восстанавливаем кликабельность для вложенных компонентов
    }
  }
}
</style>
