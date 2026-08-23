<script setup lang="ts">
import type { CommentTreeNode } from "@/types/comment";
import CommentNode from "./CommentNode.vue";

defineProps<{ roots: CommentTreeNode[] }>();
</script>

<template>
  <div class="comment-thread">
    <CommentNode v-for="node in roots" :key="node.comment.id" :node="node" />
  </div>
</template>

<style lang="scss" scoped>
.comment-thread {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
