<script setup lang="ts">
import { CELL_SIZE } from "@/const/rendering";
import { useBlocksStore } from "@/stores/blocks";
import { useCanvasContextStore } from "@/stores/canvasContext";

const canvasContext = useCanvasContextStore();

const blocksStore = useBlocksStore();
const handleCreateBlock = () => {
  if (!canvasContext.worldPos) return;
  const posX = Math.floor(canvasContext.worldPos.x / CELL_SIZE);
  const posY = -Math.floor(canvasContext.worldPos.y / CELL_SIZE);
  const newBlock = blocksStore.addBlock({
    position_x: posX,
    position_y: posY,
    layer: blocksStore.layer,
    name: "N-00",
    direction: "up",
    places: [],
  });
  console.log(newBlock);
};
</script>
<template>
  <div
    v-if="canvasContext.screenPos"
    class="context-menu"
    :style="{
      top: `${canvasContext.screenPos.y + 5}px`,
      left: `${canvasContext.screenPos.x + 5}px`,
    }"
  >
    <button @click="handleCreateBlock">Создать блок</button>
  </div>
</template>
<style lang="scss" scoped>
.context-menu {
  position: fixed;
  display: flex;
  flex-direction: column;
  padding: 10px;
  border-radius: 5px;

  background-color: var(--bg-panel-background);
}
</style>
