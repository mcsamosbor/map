<script lang="ts" setup>
import { PART_SIZE } from "@/const/rendering";
import type { FlightStatus, FlightType } from "@/stores/blocks";
import type { ColorSource, Graphics } from "pixi.js";

const props = defineProps<{
  color: ColorSource;
  x: number;
  y: number;
}>();

const drawBg = (graphics: Graphics) => {
  graphics.clear().rect(0, 0, PART_SIZE, PART_SIZE).fill(props.color);
};
</script>
<template>
  <Container :x="x" :y="y">
    <graphics @effect="drawBg"></graphics>
    <slot></slot>
  </Container>
</template>
