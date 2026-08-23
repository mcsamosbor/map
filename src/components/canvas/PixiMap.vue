<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef, watch } from "vue";
import { MapRenderer } from "@/renderer/MapRenderer";
import { useBlocksStore } from "@/stores/blocks";
import { useCommentsStore } from "@/stores/comments";
import { useTransitionsStore } from "@/stores/transitions";
import { useCanvasContextStore } from "@/stores/canvasContext";

const canvasHolder = useTemplateRef("canvasHolder");

const blocksStore = useBlocksStore();
const transitionsStore = useTransitionsStore();
const commentsStore = useCommentsStore();
const canvasStore = useCanvasContextStore();

let observer: ResizeObserver | null = null;

const onResize = () => {
  if (!canvasStore.mapRenderer || !canvasHolder.value) return;
  canvasStore.mapRenderer.resize(canvasHolder.value.clientWidth, canvasHolder.value.clientHeight);
};

onMounted(async () => {
  const holder = canvasHolder.value;
  if (!holder) return;

  observer = new ResizeObserver(onResize);
  observer.observe(holder);

  canvasStore.mapRenderer = await MapRenderer.create(holder);
  onResize();

  // Первичная загрузка маркеров комментариев (если репозиторий уже установлен).
  void commentsStore.loadMapRoots(blocksStore.layer);
});

onUnmounted(() => {
  observer?.disconnect();
  observer = null;
  canvasStore.mapRenderer?.destroy();
  canvasStore.mapRenderer = null;
});

watch(
  () => blocksStore.layer,
  (layer) => {
    canvasStore.mapRenderer?.setLayer(layer);
    void commentsStore.loadMapRoots(layer);
  },
);

watch(
  () => blocksStore.isEditing,
  (editing) => canvasStore.mapRenderer?.setEditing(editing),
);

watch(
  () => blocksStore.selectedBlockId,
  (blockId) => canvasStore.mapRenderer?.setSelected(blockId),
);

watch(
  [() => blocksStore.blocks, () => transitionsStore.transitions],
  () => canvasStore.mapRenderer?.setData(),
  {
    deep: true,
  },
);

watch(
  () => commentsStore.mapRoots,
  () => canvasStore.mapRenderer?.setCommentMarkers(),
  {
    deep: true,
  },
);
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
