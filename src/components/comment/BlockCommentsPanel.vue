<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useAuthorization } from "@/stores/authorization";
import { useCommentsStore } from "@/stores/comments";
import type { BlockUid } from "@/types/block";
import { getTemporaryExpiry } from "@/utils/comments";
import CommentInput from "./CommentInput.vue";
import CommentThread from "./CommentThread.vue";

const props = defineProps<{ blockId: BlockUid | null | undefined }>();

const authorization = useAuthorization();
const commentsStore = useCommentsStore();

const loading = ref(false);
const tree = computed(() =>
  props.blockId == null ? [] : commentsStore.blockCommentsTree(props.blockId),
);

watch(
  () => props.blockId,
  async (blockId) => {
    if (blockId == null) return;
    loading.value = true;
    try {
      await commentsStore.loadBlockComments(blockId);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

const submitBlockComment = async (text: string, isTemporary: boolean) => {
  if (props.blockId == null) return;
  try {
    await commentsStore.addComment({
      text,
      block_id: props.blockId,
      parent_id: null,
      expires_at: isTemporary ? getTemporaryExpiry() : null,
    });
  } catch (err) {
    console.error("Не удалось создать комментарий:", err);
  }
};
</script>

<template>
  <div v-if="blockId" class="block-comments-panel">
    <div class="panel-header">
      <span class="panel-title">Комментарии блока</span>
    </div>
    <div v-if="authorization.logged" class="panel-input">
      <CommentInput placeholder="Комментарий к блоку..." @submit="submitBlockComment" />
    </div>
    <div class="panel-content">
      <div v-if="loading" class="comments-loading">Загрузка...</div>
      <CommentThread v-else-if="tree.length" :roots="tree" />
      <div v-else class="comments-empty">Пока нет комментариев</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.block-comments-panel {
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

  .comments-loading,
  .comments-empty {
    font-size: 12px;
    color: var(--str-button-font);
    opacity: 0.6;
  }
}
</style>
