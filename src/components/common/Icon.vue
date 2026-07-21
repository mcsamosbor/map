<script lang="ts" setup>
import type { StyleValue } from "vue";

const props = defineProps<{ name: string; size: [number, number]; style?: StyleValue }>();
const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>
<template>
  <div class="icon" :style="style" @click="emit('click')">
    <svg :width="size[0]" :height="size[1]">
      <use :xlink:href="`/__spritemap#sprite-${name}`"></use>
    </svg>
  </div>
</template>
<style lang="scss" scoped>
.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  fill: currentColor;
}
</style>
