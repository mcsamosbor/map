<script setup lang="ts">
import { computed } from "vue";
import { useCommentsStore } from "@/stores/comments";
import { getTemporaryExpiry } from "@/utils/comments";
import CommentInput from "./CommentInput.vue";
import CommentThread from "./CommentThread.vue";

const commentsStore = useCommentsStore();

const roots = computed(() => commentsStore.openThreadRoots);
const treeFor = commentsStore.threadTreeFor;

const submitReply = async (text: string, isTemporary: boolean) => {
  // Ответ создаётся от имени самого старого рута облачка (якоря).
  const rootId = commentsStore.openThreadRootIds[0];
  if (rootId === undefined) return;
  try {
    await commentsStore.addComment({
      text,
      parent_id: rootId,
      expires_at: isTemporary ? getTemporaryExpiry() : null,
    });
  } catch (err) {
    console.error("Не удалось создать ответ:", err);
  }
};
</script>

<template>
  <div v-if="roots.length" class="thread-panel">
    <div class="panel-header">
      <span class="panel-title">
        Комментарии на карте<span v-if="roots.length > 1"> ({{ roots.length }})</span>
      </span>
      <button type="button" class="panel-close" @click="commentsStore.closeThread()">×</button>
    </div>
    <div class="panel-input">
      <CommentInput placeholder="Ответить..." @submit="submitReply" />
    </div>
    <div class="panel-content">
      <section v-for="root in roots" :key="root.id" class="thread-section">
        <CommentThread :roots="treeFor(root.id)" />
      </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.thread-panel {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  max-height: 45dvh;
  border-radius: 10px;
  background-color: var(--bg-panel-background);
  overflow: hidden;
  font-family: Roboto;
}

.panel-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;

  .panel-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--str-button-font-active);
  }

  .panel-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 20px;
    line-height: 1;
    color: var(--str-button-font);
  }
}

.panel-input {
  flex: none;
  padding: 10px 12px;
}

.panel-content {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  overflow-y: auto;
  scrollbar-width: none;
}

.thread-section + .thread-section {
  border-top: 1px solid var(--bg-icon-button);
  padding-top: 10px;
}
</style>
