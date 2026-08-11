<script lang="ts" setup>
import { computed } from "vue";
import { BLOCK_HEIGHT, BLOCK_WIDTH, PASSAGE_WIDTH } from "@/const/rendering";
import type { BlockDirection, FenceType } from "@/types/block";
import type { Graphics } from "pixi.js";

const props = defineProps<{
  type: FenceType;
  direction: BlockDirection;
}>();

const emit = defineEmits<{
  (e: "click"): void;
}>();

const isVertical = () => props.direction === "left" || props.direction === "right";

// Центр блока
const centerX = computed(() => (isVertical() ? BLOCK_HEIGHT / 2 : BLOCK_WIDTH / 2));
const centerY = computed(() => (isVertical() ? BLOCK_WIDTH / 2 : BLOCK_HEIGHT / 2));

// Решётка поперёк центрального перехода: толщина 10, длина PASSAGE_WIDTH
const thickness = 10;
const length = PASSAGE_WIDTH;

// Бар перпендикулярен центральному проходу:
// up/down — проход горизонтальный → бар вертикальный (ширина=thickness, высота=length)
// left/right — проход вертикальный → бар горизонтальный (ширина=length, высота=thickness)
const fenceWidth = computed(() => (isVertical() ? length : thickness));
const fenceHeight = computed(() => (isVertical() ? thickness : length));

const fenceX = computed(() => centerX.value - fenceWidth.value / 2);
const fenceY = computed(() => centerY.value - fenceHeight.value / 2);

// Для hole: как solid, но без средней трети по длине
const holeSegments = computed(() => {
  const third = length / 3;
  if (isVertical()) {
    // Горизонтальный бар: вырезаем среднюю треть по X
    return [
      { x: fenceX.value, y: fenceY.value, w: third, h: fenceHeight.value },
      { x: fenceX.value + 2 * third, y: fenceY.value, w: third, h: fenceHeight.value },
    ];
  }
  // Вертикальный бар: вырезаем среднюю треть по Y
  return [
    { x: fenceX.value, y: fenceY.value, w: fenceWidth.value, h: third },
    { x: fenceX.value, y: fenceY.value + 2 * third, w: fenceWidth.value, h: third },
  ];
});

const drawFence = (graphics: Graphics) => {
  graphics.clear().alpha = 1;
  if (props.type === "solid") {
    graphics.rect(fenceX.value, fenceY.value, fenceWidth.value, fenceHeight.value).fill("#FFFFFF");
  } else if (props.type === "hole") {
    for (const seg of holeSegments.value) {
      graphics.rect(seg.x, seg.y, seg.w, seg.h).fill("#FFFFFF");
    }
  }
};

// Невидимая область клика PASSAGE_WIDTH × PASSAGE_WIDTH в центре блока
const clickX = computed(() => centerX.value - PASSAGE_WIDTH / 2);
const clickY = computed(() => centerY.value - PASSAGE_WIDTH / 2);

const drawClickArea = (graphics: Graphics) => {
  graphics.alpha = 0;
  graphics.rect(clickX.value, clickY.value, PASSAGE_WIDTH, PASSAGE_WIDTH).fill("#FFFFFF");
};
</script>

<template>
  <Container @click="emit('click')">
    <Graphics @effect="drawClickArea"></Graphics>
    <Graphics v-if="type !== 'missing'" @effect="drawFence"></Graphics>
  </Container>
</template>
