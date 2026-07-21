<script lang="ts" setup>
import { PASSAGE_WIDTH, PART_SIZE, getPassagePosition, GAP } from "@/const/rendering";
import { BlockDirections, type BlockDirection, type PassageType } from "@/stores/blocks";
import type { ColorSource, Graphics } from "pixi.js";

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

const drawPassage = (graphics: Graphics) => {
  const [x, y] = getPassagePosition(...props.pos);
  const w = width();
  const h = height();
  let resultX = x - w / 2;
  let resultY = y - h / 2;
  let resultWidth = w;
  let resultHeight = h;
  //   const rw =
  //     w +
  //     ((props.left || props.right) && props.type === "noway" && isVertical() ? GAP : 0);
  //   const rx = x - w / 2 + (props.right && props.type === "noway" ? -GAP : 0);
  //   const rh = h + (props.type === "normal" && (props.up || props.down) ? GAP : 0);
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

  graphics.clear().rect(resultX, resultY, resultWidth, resultHeight).fill(currentColor());
  graphics.alpha = isVertical() ? 1 : 0;
};
</script>
<template>
  <Container @click="emit('click')">
    <Graphics @effect="drawPassage"></Graphics>
    <Container></Container>
  </Container>
</template>
