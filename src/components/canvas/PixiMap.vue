<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from "vue";
import { MapRenderer } from "@/renderer/MapRenderer";
import { useBlocksStore } from "@/stores/blocks";
import { useTransitionsStore } from "@/stores/transitions";

const canvasHolder = useTemplateRef("canvasHolder");

const blocksStore = useBlocksStore();
const transitionsStore = useTransitionsStore();

let renderer: MapRenderer | null = null;
let observer: ResizeObserver | null = null;

const onResize = () => {
  if (!renderer || !canvasHolder.value) return;
  renderer.resize(canvasHolder.value.clientWidth, canvasHolder.value.clientHeight);
};

onMounted(async () => {
  const holder = canvasHolder.value;
  if (!holder) return;

  observer = new ResizeObserver(onResize);
  observer.observe(holder);

  renderer = await MapRenderer.create(holder);
  onResize();
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
  renderer?.destroy();
  renderer = null;
});

watch(
  () => blocksStore.layer,
  (layer) => renderer?.setLayer(layer),
);

watch(
  () => blocksStore.isEditing,
  (editing) => renderer?.setEditing(editing),
);

watch(
  () => blocksStore.selectedBlockId,
  (blockId) => renderer?.setSelected(blockId),
);

watch([() => blocksStore.blocks, () => transitionsStore.transitions], () => renderer?.setData(), {
  deep: true,
});
</script>

<template>
  <div ref="canvasHolder" class="pixi-map" @contextmenu.prevent></div>
</template>

<style scoped>
.pixi-map {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
}
</style>
