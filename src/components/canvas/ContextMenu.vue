<script setup lang="ts">
import { ref } from "vue";
import { CELL_SIZE } from "@/const/rendering";
import { useAuthorization } from "@/stores/authorization";
import { useBlocksStore } from "@/stores/blocks";
import { useCanvasContextStore } from "@/stores/canvasContext";
import { useCommentsStore } from "@/stores/comments";
import { getTemporaryExpiry } from "@/utils/comments";
import CommentInput from "../comment/CommentInput.vue";

const canvasContext = useCanvasContextStore();

const blocksStore = useBlocksStore();
const authorization = useAuthorization();
const commentsStore = useCommentsStore();

const commentMode = ref(false);

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

const submitMapComment = async (text: string, isTemporary: boolean) => {
  const pos = canvasContext.worldPos;
  if (!pos) return;
  try {
    await commentsStore.addComment({
      text,
      block_id: null,
      map_x: pos.x / CELL_SIZE,
      map_y: pos.y / CELL_SIZE,
      layer: blocksStore.layer,
      parent_id: null,
      expires_at: isTemporary ? getTemporaryExpiry() : null,
    });
    commentMode.value = false;
    canvasContext.hideAll();
  } catch (err) {
    console.error("Не удалось создать комментарий:", err);
  }
};
</script>
<template>
  <div
    v-if="canvasContext.screenPos && authorization.logged"
    class="context-menu"
    :style="{
      top: `${canvasContext.screenPos.y + 5}px`,
      left: `${canvasContext.screenPos.x + 5}px`,
    }"
  >
    <button @click="handleCreateBlock">Создать блок</button>
    <button @click="commentMode = !commentMode">Комментарий</button>
    <div v-if="commentMode" class="menu-comment">
      <CommentInput
        placeholder="Комментарий в этой точке карты..."
        @submit="submitMapComment"
        @cancel="commentMode = false"
      />
    </div>
  </div>
</template>
<style lang="scss" scoped>
.context-menu {
  position: fixed;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 5px;

  background-color: var(--bg-panel-background);
  z-index: 40;
  font-family: Roboto;

  button {
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    color: var(--str-button-font);
    font-family: Roboto;
    font-size: 13px;
    padding: 4px 6px;
    border-radius: 4px;

    &:hover {
      background-color: var(--bg-icon-button);
      color: var(--str-button-font-active);
    }
  }

  .menu-comment {
    min-width: 240px;
    border-top: 1px solid var(--bg-icon-button);
    padding-top: 6px;
  }
}
</style>
