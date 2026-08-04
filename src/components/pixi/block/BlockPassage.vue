<script lang="ts" setup>
import { PASSAGE_WIDTH, PART_SIZE, getPassagePosition, GAP, rIcon } from "@/const/rendering";
import { BlockDirections, type BlockDirection, type PassageType } from "@/types/block";
import type { ColorSource, Graphics } from "pixi.js";
import Icon from "./FloorIcon.vue";
import StairsIcon from "@/assets/icons/block/stairs.svg?raw";
import { computed } from "vue";
const stairsIcon = rIcon(StairsIcon);

const props = defineProps<{
  type: PassageType;
  pos: [number, number];
  up?: boolean;
  right?: boolean;
  down?: boolean;
  left?: boolean;
  mainColor: ColorSource;
  bgColor: ColorSource;
  direction: BlockDirection;
}>();
const emit = defineEmits<{
  (e: "click"): void;
}>();

const isVertical = () => props.up || props.down;

const realDirection = () => ((isVertical() ? 0 : 1) + BlockDirections.indexOf(props.direction)) % 2;

const width = () => (realDirection() === 0 ? PASSAGE_WIDTH : PART_SIZE);
const height = () => (realDirection() === 0 ? PART_SIZE : PASSAGE_WIDTH);

const currentColor = () => (props.type === "noway" ? props.mainColor : props.bgColor);

const getNowayShift = () => {
  const { left, right } = props;
  if (left) return 3;
  if (right) return 1;
  if (right) return 1;
  if (left) return 3;
  return 0;
};
const getNormalShift = () => {
  const { up, down } = props;
  if (up) return 0;
  if (down) return 2;
  return 0;
};

const transformations = computed(() => {
  const [x, y] = getPassagePosition(...props.pos);
  const w = width();
  const h = height();
  let resultX = x - w / 2;
  let resultY = y - h / 2;
  let resultWidth = w;
  let resultHeight = h;
  const effectIndex =
    ((props.type === "noway" ? getNowayShift() : getNormalShift()) +
      BlockDirections.indexOf(props.direction)) %
    4;

  switch (effectIndex) {
    case 0:
      resultHeight += GAP;
      break;
    case 1:
      resultWidth += GAP;
      resultX -= GAP;
      break;
    case 2:
      resultHeight += GAP;
      resultY -= GAP;
      break;
    case 3:
      resultWidth += GAP;
    default:
      break;
  }
  return { x: resultX, y: resultY, width: resultWidth, height: resultHeight };
});

const center = computed(() => {
  const t = transformations.value;
  return { x: t.x + t.width / 2, y: t.y + t.height / 2 };
});

const drawPassage = (graphics: Graphics) => {
  const { x, y, width, height } = transformations.value;

  graphics.clear().rect(x, y, width, height).fill(currentColor());
  graphics.alpha = isVertical() ? 1 : 0;
};

const hasStairs = () => {
  return props.type === "stairs_down" || props.type === "stairs_up";
};

const textStyle = { fill: "white", fontSize: 26, fontWeight: "600", fontFamily: "Roboto" } as const;

const shift = computed(() =>
  props.direction === "down" || props.direction === "up" ? { x: 0, y: 20 } : { x: 20, y: 0 },
);
</script>
<template>
  <Container @click="emit('click')">
    <Graphics @effect="drawPassage"></Graphics>
    <Container v-if="hasStairs()">
      <Icon
        :path="rIcon(stairsIcon)"
        :size="30"
        :x="center.x + shift.x"
        :y="center.y + shift.y"
      ></Icon>
      <Text
        :style="textStyle"
        :text="props.type === 'stairs_down' ? '-1' : '+1'"
        :x="center.x - shift.x"
        :y="center.y - shift.y"
        :anchor="0.5"
      ></Text>
    </Container>
  </Container>
</template>
