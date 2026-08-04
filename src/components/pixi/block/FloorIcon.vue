<script lang="ts" setup>
import { getIconContext } from "@/iconCache";
import type { Graphics } from "pixi.js";

const props = defineProps<{ size: number; path: string; x?: number; y?: number }>();

const drawIcon = (graphics: Graphics) => {
  graphics.context = getIconContext(props.path);
  graphics.setSize(props.size);
};
</script>
<template>
  <Container :pivot="[size / 2, size / 2]" :width="size" :height="size" :x="x ?? 0" :y="y ?? 0">
    <Graphics @effect="drawIcon"></Graphics>
  </Container>
</template>
