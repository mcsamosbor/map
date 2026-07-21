<script lang="ts" setup>
import { PASSAGE_WIDTH, PART_SIZE, getPassagePosition, GAP } from "@/const/rendering";
import {
  BlockDirections,
  type BlockDirection,
  type FlightData,
  type FlightType,
} from "@/stores/blocks";
import type { ColorSource, Graphics } from "pixi.js";

const props = defineProps<{
  data?: FlightData;
  pos: [number, number];
  mainColor: ColorSource;
  direction: BlockDirection;
}>();
const emit = defineEmits<{
  (e: "click"): void;
}>();

const realDirection = () => BlockDirections.indexOf(props.direction) % 2;

const width = () => (realDirection() === 0 ? PASSAGE_WIDTH : PART_SIZE);
const height = () => (realDirection() === 0 ? PART_SIZE : PASSAGE_WIDTH);

const currentColor = () => props.mainColor;

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
  if (!props.data?.type) {
    const effectIndex = BlockDirections.indexOf(props.direction) % 2;

    switch (effectIndex) {
      case 0:
        resultWidth += GAP * 2;
        resultX -= GAP;
        break;
      case 1:
        resultHeight += GAP * 2;
        resultY -= GAP;
        break;
      default:
        break;
    }
  }

  graphics.clear().rect(resultX, resultY, resultWidth, resultHeight).fill(currentColor());
};
</script>
<template>
  <Container @click="emit('click')">
    <Graphics @effect="drawPassage"></Graphics>
    <Container></Container>
  </Container>
</template>
