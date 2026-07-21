<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from "vue";

const props = withDefaults(
  defineProps<{
    stages?: number[];
    modelValue?: number;
    stage?: number;
  }>(),
  {
    stages: () => [15, 50, 100],
    modelValue: 15,
    stage: 0,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
  (e: "update:stage", value: number): void;
  (e: "change", value: number): void;
}>();

const sortedStages = computed(() => [...props.stages].sort((a, b) => a - b));

const currentHeightPercent = ref<number>(
  props.modelValue ?? sortedStages.value[props.stage] ?? sortedStages.value[0],
);

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== undefined && newVal !== currentHeightPercent.value) {
      currentHeightPercent.value = newVal;
    }
  },
);
watch(
  () => props.stage,
  (newStage) => {
    if (newStage !== undefined && sortedStages.value[newStage] !== undefined) {
      const newHeight = sortedStages.value[newStage];
      if (newHeight !== currentHeightPercent.value) {
        currentHeightPercent.value = newHeight;
      }
    }
  },
);

const footerHeight = computed(() => `${currentHeightPercent.value}%`);

function findClosestStage(heightPercent: number): number {
  return sortedStages.value.reduce((prev, curr) =>
    Math.abs(curr - heightPercent) < Math.abs(prev - heightPercent) ? curr : prev,
  );
}

const footerRef = ref<HTMLElement | null>(null);
let isDragging = false;
let startY = 0;
let startHeightPercent = 0;

// Глобальные обработчики
function onGlobalPointerMove(e: PointerEvent) {
  if (!isDragging) return;
  e.preventDefault();
  const deltaY = startY - e.clientY;
  const deltaPercent = (deltaY / window.innerHeight) * 100;
  let newHeight = startHeightPercent + deltaPercent;
  newHeight = Math.min(100, Math.max(sortedStages.value[0]!, newHeight));
  currentHeightPercent.value = newHeight;
}

function onGlobalPointerUp(e: PointerEvent) {
  if (!isDragging) return;
  isDragging = false;
  // Восстанавливаем transition
  if (footerRef.value) footerRef.value.style.transition = "";
  // Прилипание к стадии
  const closestHeight = findClosestStage(currentHeightPercent.value);
  if (closestHeight !== currentHeightPercent.value) {
    currentHeightPercent.value = closestHeight;
  }
  const stageIndex = sortedStages.value.findIndex((s) => s === closestHeight);
  emit("update:modelValue", closestHeight);
  if (stageIndex !== -1) emit("update:stage", stageIndex);
  emit("change", closestHeight);
  // Снимаем глобальные слушатели
  document.removeEventListener("pointermove", onGlobalPointerMove);
  document.removeEventListener("pointerup", onGlobalPointerUp);
  // Освобождаем захват, если он был
  const target = e.target as HTMLElement;
  if (target && target.hasPointerCapture && target.hasPointerCapture(e.pointerId)) {
    target.releasePointerCapture(e.pointerId);
  }
}

function onDragStart(e: PointerEvent) {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  if (!target || !footerRef.value) return;
  // Захватываем указатель, чтобы получать события даже за пределами элемента
  target.setPointerCapture(e.pointerId);

  isDragging = true;
  startY = e.clientY;
  startHeightPercent = currentHeightPercent.value;
  if (footerRef.value) footerRef.value.style.transition = "none";

  // Добавляем глобальные слушатели
  document.addEventListener("pointermove", onGlobalPointerMove);
  document.addEventListener("pointerup", onGlobalPointerUp);
}

// Убираем слушатели при размонтировании (на всякий случай)
onUnmounted(() => {
  document.removeEventListener("pointermove", onGlobalPointerMove);
  document.removeEventListener("pointerup", onGlobalPointerUp);
});
</script>

<template>
  <div ref="footerRef" class="expandable-footer" :style="{ height: footerHeight }">
    <div class="handler" @pointerdown="onDragStart">
      <div class="line"></div>
      <div class="line"></div>
    </div>
    <div class="footer-content">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="scss">
/* стили без изменений */
.expandable-footer {
  width: 100%;
  background-color: #121212;
  border-radius: 20px 20px 0 0;
  transition: height 0.2s ease-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  padding-top: 8px;
  position: relative;
  overflow-y: auto;
  .handler {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: 40px;
    height: 24px;
    cursor: grab;
    touch-action: none;
    flex-shrink: 0;
    .line {
      width: 32px;
      height: 4px;
      background-color: #888;
      border-radius: 2px;
    }
  }
  .footer-content {
    width: 100%;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
}
</style>
