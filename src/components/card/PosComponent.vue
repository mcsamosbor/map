<script setup lang="ts">
import ArrowInput from "./ArrowInput.vue";

const value = defineModel<number>();
const props = defineProps<{
  label: string;
  enabled?: boolean;
}>();
</script>

<template>
  <div class="pos-component">
    <span class="pos-label">{{ label }}: </span>
    <ArrowInput v-model.number="value" :enabled="enabled"></ArrowInput>
  </div>
</template>
<style lang="scss" scoped>
.pos-component {
  display: flex;
  gap: 5px;
}
.pos-label {
  font-family: Roboto;
  font-weight: 600;
  font-size: 18px;
  color: var(--str-button-font);
}
</style>
