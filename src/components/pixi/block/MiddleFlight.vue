<script lang="ts" setup>
import { computed } from "vue";
import { PASSAGE_WIDTH, PART_SIZE, getPassagePosition, GAP, rIcon } from "@/const/rendering";
import { BlockDirections, type BlockDirection, type FlightData } from "@/types/block";
import type { ColorSource, Graphics } from "pixi.js";
import ladderIconRaw from "@/assets/icons/block/ladder.svg?raw";
import elevatorIconRaw from "@/assets/icons/block/elevator.svg?raw";
import stairsIconRaw from "@/assets/icons/block/stairs.svg?raw";
import FloorIcon from "./FloorIcon.vue";

// Преобразуем сырые SVG в готовые пути один раз на уровне модуля
const elevatorPath = rIcon(elevatorIconRaw);
const ladderPath = rIcon(ladderIconRaw);
const stairsPath = rIcon(stairsIconRaw);

const props = defineProps<{
  data?: FlightData;
  pos: [number, number];
  mainColor: ColorSource;
  direction: BlockDirection;
}>();

const emit = defineEmits<{
  (e: "click"): void;
}>();

// Индекс направления и признак вертикальности (один раз)
const directionIndex = computed(() => BlockDirections.indexOf(props.direction));
const isVertical = computed(() => directionIndex.value % 2 === 1);

// Размеры прохода
const passageWidth = computed(() => (isVertical.value ? PART_SIZE : PASSAGE_WIDTH));
const passageHeight = computed(() => (isVertical.value ? PASSAGE_WIDTH : PART_SIZE));

// Центр ячейки
const basePosition = computed(() => getPassagePosition(...props.pos));

// Смещения и добавки ширины/высоты для GAP (только когда data.type отсутствует)
const gapOffsetX = computed(() => (!props.data?.type && !isVertical.value ? -GAP : 0));
const gapOffsetY = computed(() => (!props.data?.type && isVertical.value ? -GAP : 0));
const gapWidthAdd = computed(() => (!props.data?.type && !isVertical.value ? GAP * 2 : 0));
const gapHeightAdd = computed(() => (!props.data?.type && isVertical.value ? GAP * 2 : 0));

// Положение и размеры контейнера
const containerX = computed(
  () => basePosition.value[0] - passageWidth.value / 2 + gapOffsetX.value,
);
const containerY = computed(
  () => basePosition.value[1] - passageHeight.value / 2 + gapOffsetY.value,
);
const containerW = computed(() => passageWidth.value + gapWidthAdd.value);
const containerH = computed(() => passageHeight.value + gapHeightAdd.value);

// Размер иконки
const soloIconSize = 40;
const duoIconSize = 40;
const iconSize = computed(() =>
  props.data?.type === "ladder_elevator" ? duoIconSize : soloIconSize,
);

// Вычисляемый массив иконок для отрисовки
const icons = computed(() => {
  if (!props.data) return [];

  const size = iconSize.value;
  const hw = containerW.value;
  const hh = containerH.value;
  const type = props.data.type;

  if (type === "elevator") {
    return [{ path: elevatorPath, x: hw / 2, y: hh / 2, size }];
  }

  if (type === "ladder_elevator") {
    const vertical = isVertical.value;
    const x1 = vertical ? hw / 3 - 5 : hw / 2;
    const y1 = vertical ? hh / 2 : hh / 3 - 5;
    const x2 = vertical ? (hw / 3) * 2 + 5 : hw / 2;
    const y2 = vertical ? hh / 2 : (hh / 3) * 2 + 5;
    return [
      { path: elevatorPath, x: x1, y: y1, size },
      { path: ladderPath, x: x2, y: y2, size },
    ];
  }

  // stairs (или любой другой неизвестный тип)
  return [{ path: stairsPath, x: hw / 2, y: hh / 2, size }];
});

// Отрисовка фона прохода (используется PixiJS)
const drawPassage = (graphics: Graphics) => {
  graphics.clear().rect(0, 0, containerW.value, containerH.value).fill(props.mainColor);
};
</script>

<template>
  <Container :x="containerX" :y="containerY" @click="emit('click')">
    <Graphics @effect="drawPassage" />
    <Container v-if="icons.length">
      <FloorIcon
        v-for="(icon, idx) in icons"
        :key="idx"
        :size="icon.size"
        :path="icon.path"
        :x="icon.x"
        :y="icon.y"
      />
    </Container>
  </Container>
</template>
