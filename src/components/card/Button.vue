<script setup lang="ts">
import type { StyleValue } from "vue";
import Icon from "../common/Icon.vue";

const props = defineProps<{
  name: string;
  size: [number, number];
  active?: boolean;
  enabled?: boolean;
  iconStyle?: StyleValue;
}>();

const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <button
    class="block-card-button"
    :class="{ active: active, enabled: enabled }"
    @click="emit('click')"
  >
    <Icon :name="name" :size="size" :style="iconStyle"></Icon>
  </button>
</template>
<style lang="scss" scoped>
.block-card-button {
  all: unset;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  cursor: pointer;
  border-radius: 2px;

  color: var(--str-button-font);

  &.active {
    color: var(--str-button-font-active);
  }

  background-color: var(--bg-button-color);
}

.block-card-button.enabled {
  background-color: var(--bg-button-color-enabled);
}
</style>
