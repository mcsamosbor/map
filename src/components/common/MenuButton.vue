<script setup lang="ts">
import Icon from "./Icon.vue";

defineProps<{
  iconName?: string;
  iconSize?: [number, number];
  active?: boolean;
  enabled?: boolean;
}>();
const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <button class="menu-button" :class="{ active: active, enabled: enabled }" @click="emit('click')">
    <slot><Icon v-if="iconName && iconSize" :name="iconName" :size="iconSize"></Icon></slot>
  </button>
</template>
<style>
.menu-button {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;

  width: 40px;
  height: 38px;
  background-color: #252525;
  color: #808080;
  fill: currentColor;

  border-radius: 10px;

  cursor: pointer;
}

.menu-button.enabled {
  background-color: #60a7d644;
  color: #60a7d6;
}

.menu-button.active {
  color: #5ca0cc;
}
</style>
