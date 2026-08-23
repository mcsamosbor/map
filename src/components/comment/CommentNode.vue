<script setup lang="ts">
import { computed, ref } from "vue";
import { useAuthorization } from "@/stores/authorization";
import { useCommentsStore } from "@/stores/comments";
import { isCommentTemporary, type CommentTreeNode } from "@/types/comment";
import { formatCommentDate, getTemporaryExpiry } from "@/utils/comments";
import CommentInput from "./CommentInput.vue";
import CommentThread from "./CommentThread.vue";

const props = defineProps<{ node: CommentTreeNode }>();

const authorization = useAuthorization();
const commentsStore = useCommentsStore();

const replyOpen = ref(false);
const isTemporary = computed(() => isCommentTemporary(props.node.comment));

const canDelete = computed(
  () =>
    authorization.logged &&
    (authorization.user?.id === props.node.comment.author_id ||
      authorization.hasAnyRole(["moderator", "admin"])),
);

const initials = computed(() => {
  const name = props.node.comment.author_name.trim();
  const parts = name.split(/\s+/);
  return ((parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "")).toUpperCase();
});

const submitReply = async (text: string, isTemp: boolean) => {
  try {
    await commentsStore.addComment({
      text,
      parent_id: props.node.comment.id,
      expires_at: isTemp ? getTemporaryExpiry() : null,
    });
    replyOpen.value = false;
  } catch (err) {
    console.error("Не удалось создать ответ:", err);
  }
};

const remove = async () => {
  if (!window.confirm("Удалить комментарий?")) return;
  try {
    await commentsStore.deleteComment(props.node.comment.id);
  } catch (err) {
    console.error("Не удалось удалить комментарий:", err);
  }
};
</script>

<template>
  <div class="comment-node">
    <div class="comment-card">
      <div v-if="node.comment.author_avatar_url" class="avatar">
        <img :src="node.comment.author_avatar_url" alt="" class="avatar-img" />
      </div>
      <div v-else class="avatar avatar-placeholder">{{ initials }}</div>

      <div class="comment-body">
        <div class="comment-header">
          <span class="author">{{ node.comment.author_name }}</span>
          <span class="time">{{ formatCommentDate(node.comment.created_at) }}</span>
          <span v-if="isTemporary" class="badge badge-temporary">временный</span>
        </div>
        <div class="comment-text">{{ node.comment.text }}</div>
        <div class="comment-actions">
          <button
            v-if="authorization.logged"
            type="button"
            class="action"
            @click="replyOpen = !replyOpen"
          >
            Ответить
          </button>
          <button v-if="canDelete" type="button" class="action danger" @click="remove">
            Удалить
          </button>
        </div>
        <CommentInput
          v-if="replyOpen"
          placeholder="Ответ..."
          @submit="submitReply"
          @cancel="replyOpen = false"
        />
      </div>
    </div>

    <div v-if="node.children.length" class="children">
      <CommentThread :roots="node.children" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comment-node {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-family: Roboto;
}

.comment-card {
  display: flex;
  flex-direction: row;
  gap: 8px;
  padding: 8px;
  border-radius: 8px;
  background-color: var(--bg-panel-background);

  .avatar {
    flex: 0 0 28px;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;

    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    &.avatar-placeholder {
      background-color: var(--bg-icon-button);
      color: var(--str-button-font);
      font-size: 11px;
      font-weight: 600;
    }
  }

  .comment-body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;
  }

  .comment-header {
    display: flex;
    flex-direction: row;
    align-items: baseline;
    gap: 6px;
    flex-wrap: wrap;

    .author {
      font-weight: 600;
      color: var(--str-button-font-active);
      font-size: 13px;
    }

    .time {
      font-size: 11px;
      color: var(--str-button-font);
      opacity: 0.7;
    }

    .badge {
      font-size: 10px;
      padding: 1px 5px;
      border-radius: 4px;
      text-transform: lowercase;

      &.badge-temporary {
        background-color: #ffc107;
        color: #3a2e00;
      }
    }
  }

  .comment-text {
    font-size: 14px;
    color: var(--str-button-font);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .comment-actions {
    display: flex;
    flex-direction: row;
    gap: 10px;

    .action {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      font-family: Roboto;
      font-size: 11px;
      color: var(--str-button-font);
      opacity: 0.8;

      &:hover {
        opacity: 1;
        color: var(--str-button-font-active);
      }

      &.danger:hover {
        color: #ff6b6b;
      }
    }
  }
}

.children {
  display: flex;
  flex-direction: column;
  gap: 6px;
  // margin-left: 16px;
  padding-left: 4px;
  border-left: 1px solid var(--bg-icon-button);
}
</style>
