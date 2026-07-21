<template>
  <v-group ref="groupRef" :config="groupConfig" @dragmove="onDragMove">
    <slot />
  </v-group>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import type { Group } from "konva/lib/Group";
import type { GroupConfig } from "konva/lib/Group";
import type { Stage } from "konva/lib/Stage";

// ---- Пропсы ----
interface Props {
  stageRef: Stage | null; // ссылка на Stage от родителя
  initialTransform?: { x: number; y: number; scale: number };
}

const props = withDefaults(defineProps<Props>(), {
  initialTransform: () => ({ x: 0, y: 0, scale: 1 }),
});

// ---- Состояние трансформации (реактивное) ----
const transform = reactive({
  x: props.initialTransform.x,
  y: props.initialTransform.y,
  scale: props.initialTransform.scale,
});

// ---- Ссылка на группу (нужна для проверки попадания) ----
const groupRef = ref<Group | null>(null);

// ---- Конфиг группы ----
const groupConfig = computed<GroupConfig>(() => ({
  x: transform.x,
  y: transform.y,
  scaleX: transform.scale,
  scaleY: transform.scale,
  draggable: true,
}));

// ---- Синхронизация позиции при перетаскивании ----
const onDragMove = (e: any) => {
  const node = e.target;
  transform.x = node.x();
  transform.y = node.y();
};

// ---- Обработчик колесика мыши (зум) ----
const onWheel = (e: WheelEvent) => {
  const stage = props.stageRef;
  const group = groupRef.value?.getNode();
  if (!stage || !group) return;

  // Проверяем, находится ли мышь над группой Area
  const rect = group.getClientRect();
  const pointer = stage.getPointerPosition();
  if (!pointer) return;
  if (
    pointer.x < rect.x ||
    pointer.x > rect.x + rect.width ||
    pointer.y < rect.y ||
    pointer.y > rect.y + rect.height
  ) {
    return; // зум только когда мышь внутри Area
  }

  e.preventDefault();
  const scaleBy = 1.1;
  const oldScale = transform.scale;
  const newScale = e.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
  const clampedScale = Math.max(0.1, Math.min(5, newScale));

  // Расчёт смещения для зума относительно курсора
  const oldX = transform.x;
  const oldY = transform.y;
  const mousePointTo = {
    x: (pointer.x - oldX) / oldScale,
    y: (pointer.y - oldY) / oldScale,
  };

  transform.scale = clampedScale;
  transform.x = pointer.x - mousePointTo.x * clampedScale;
  transform.y = pointer.y - mousePointTo.y * clampedScale;
};

// ---- Подписка на wheel событие Stage (внутри Area!) ----
let wheelHandler: ((e: WheelEvent) => void) | null = null;

onMounted(() => {
  const stage = props.stageRef;
  if (stage) {
    wheelHandler = onWheel;
    stage.on("wheel", wheelHandler);
  }
});

onUnmounted(() => {
  const stage = props.stageRef;
  if (stage && wheelHandler) {
    stage.off("wheel", wheelHandler);
    wheelHandler = null;
  }
});
</script>
