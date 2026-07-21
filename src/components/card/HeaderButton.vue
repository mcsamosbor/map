<script setup lang="ts">
import Button from "./Button.vue";

const props = defineProps<{
  name: string;
  size: [number, number];
  active?: boolean;
  enabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <div class="header-button">
    <Button
      :name="name"
      :size="size"
      :active="active"
      :enabled="enabled"
      @click="emit('click')"
    ></Button>
  </div>
</template>
<style lang="scss" scoped>
.header-button {
  width: 44px;
  height: 44px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 3px 2px;
}
</style>
