<template>
  <!-- Контейнер с шириной 50px и padding: 10px -->
  <div class="slider-wrapper">
    <!-- Основной слайдер -->
    <div ref="containerRef" class="slider" @pointerdown="onContainerPointerDown">
      <!-- Риски (Слоты) -->
      <div class="slider__slots">
        <div v-for="(val, index) in slots" :key="index" class="slider__slot" />
      </div>

      <!-- Рельс (Бар) -->
      <div ref="barRef" class="slider__bar">
        <!-- Ползунок -->
        <div
          ref="thumbRef"
          class="slider__thumb"
          :style="{ '--percent': percent }"
          @pointerdown="onThumbPointerDown"
        >
          <span>{{ modelValue }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
  }>(),
  {
    min: -1,
    max: 1,
    step: 1,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
}>();

// --- Refs ---
const containerRef = ref<HTMLElement | null>(null);
const barRef = ref<HTMLElement | null>(null);
const thumbRef = ref<HTMLElement | null>(null);

// --- State ---
const isDragging = ref(false);

// --- Computed ---
const slots = computed(() => {
  const slots: number[] = [];
  let val = props.min;
  while (val <= props.max + props.step / 1000) {
    slots.push(val);
    val += props.step;
  }
  return slots;
});

// Передаём процент от 0 до 1 в CSS (для точного совмещения с рисками)
const percent = computed(() => {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return 1 - (props.modelValue - props.min) / range;
});

// --- Drag Logic ---
const updateValueFromEvent = (event: PointerEvent) => {
  if (!barRef.value) return;

  const rect = barRef.value.getBoundingClientRect();
  const styles = getComputedStyle(barRef.value);
  const paddingTop = parseFloat(styles.paddingTop) || 11.5;
  const paddingBottom = parseFloat(styles.paddingBottom) || 11.5;

  // Вычисляем длину активной области (исключая padding)
  const activeHeight = rect.height - paddingTop - paddingBottom;

  // Смещение от верхней границы контентной области
  let offsetY = event.clientY - rect.top - paddingTop;
  offsetY = Math.max(0, Math.min(activeHeight, offsetY));

  // Переводим offset в значение
  const rawPercent = activeHeight > 0 ? offsetY / activeHeight : 0;
  // Инвертируем, чтобы движение мыши вниз давало уменьшение значения
  const invertedPercent = 1 - rawPercent;
  // И используем invertedPercent в расчете newValue:
  let newValue = props.min + invertedPercent * (props.max - props.min);

  // Округляем до шага
  newValue = Math.round(newValue / props.step) * props.step;
  newValue = Math.max(props.min, Math.min(props.max, newValue));

  if (newValue !== props.modelValue) {
    emit("update:modelValue", newValue);
  }
};

const startDragging = (event: PointerEvent) => {
  isDragging.value = true;
  containerRef.value?.setPointerCapture(event.pointerId);
  updateValueFromEvent(event);
};

const onContainerPointerDown = (event: PointerEvent) => {
  // Если кликнули по пустой области бара или контейнеру
  startDragging(event);
};

const onThumbPointerDown = (event: PointerEvent) => {
  event.stopPropagation();
  startDragging(event);
};

const onPointerMove = (event: PointerEvent) => {
  if (!isDragging.value) return;
  event.preventDefault();
  updateValueFromEvent(event);
};

const stopDragging = (event: PointerEvent) => {
  if (isDragging.value) {
    isDragging.value = false;
    containerRef.value?.releasePointerCapture(event.pointerId);
  }
};

watch(isDragging, (isDragging) => {
  document.body.style.cursor = isDragging ? "grabbing" : "";
});

// --- Lifecycle ---
onMounted(() => {
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", stopDragging);
  window.addEventListener("pointercancel", stopDragging);
});

onBeforeUnmount(() => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerup", stopDragging);
  window.removeEventListener("pointercancel", stopDragging);
});
</script>

<style scoped lang="scss">
// Переменные из стилей
$bg-thumb: #d9d9d9;
$border-color: #6c757d;
$bar-bg: #d9d9d9;
$slot-height: 3px;
$slot-width: 13px;
$pad-y: 11.5px;

// Обёртка (по запросу: ширина 50px + padding 10px)
.slider-wrapper {
  width: 50px;
  padding: 10px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%; // Убедитесь, что у родителя задана высота
}

// Основной слайдер
.slider {
  display: flex;
  flex-direction: row;
  gap: 10px;
  touch-action: none;
  height: 100%;
  width: 100%;
}

// Риски
.slider__slots {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-top: $pad-y;
  padding-bottom: $pad-y;
  pointer-events: none;
}

.slider__slot {
  width: $slot-width;
  height: $slot-height;
  background-color: $border-color;
  box-shadow: 0 4px 4px rgba(0, 0, 0, 0.7);
}

// Рельс
.slider__bar {
  position: relative;
  height: 100%;
  width: 11px;
  background-color: $bar-bg;
  border-radius: 5px;
  display: flex;
  justify-content: center;
  padding-top: $pad-y;
  padding-bottom: $pad-y;
  box-sizing: border-box;

  // Задаём CSS-переменную, чтобы использовать её в calc()
  --pad-y: #{$pad-y};

  // Внутренняя рамка рельса
  &::before {
    content: "";
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    border: 3px solid $border-color;
    border-radius: 5px;
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
}

// Ползунок
.slider__thumb {
  position: absolute;
  left: 50%;
  width: 27px;
  height: 27px;
  border-radius: 50%;
  background-color: $bg-thumb;
  border: 3px solid $border-color;

  translate: -50% -50%;

  // Формула точного соответствия рискам:
  // Отступ сверху + процент * (общая высота - 2 отступа)
  top: calc(var(--pad-y) + var(--percent) * (100% - 2 * var(--pad-y)));

  font-family: "Roboto", sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: black;

  user-select: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}
</style>
