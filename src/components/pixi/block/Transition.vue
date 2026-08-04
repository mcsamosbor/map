<script lang="ts" setup>
import { GAP, PART_SIZE, PASSAGE_WIDTH } from "@/const/rendering";
import type { Graphics } from "pixi.js";

const props = defineProps<{ cell: [number, number]; type: TransitionType }>();
const emit = defineEmits<{
  (e: "click"): void;
}>();

const drawTransition = (graphics: Graphics) => {
  const fillColor = props.type === "creatable" ? "00FF00" : "#8E8E8E";
  const strokeColor = props.type === "deletable" ? "#00FF00" : "#FFFFFF";
  graphics.clear().rect(0, 0, PASSAGE_WIDTH, PASSAGE_WIDTH).fill({ color: fillColor }).stroke({
    width: GAP,
    color: strokeColor,
    alignment: 0,
  });
};

type TransitionType = "exists" | "creatable" | "deletable";
</script>
<template>
  <Graphics
    :x="cell[0] * (PART_SIZE + 2 * GAP + PASSAGE_WIDTH)"
    :y="cell[1] * (PART_SIZE + 2 * GAP + PASSAGE_WIDTH)"
    @effect="drawTransition"
    :pivot-x="25"
    :pivot-y="25"
    @pointertap="emit('click')"
  ></Graphics>
</template>
