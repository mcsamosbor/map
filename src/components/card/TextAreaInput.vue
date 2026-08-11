<script lang="ts" setup>
const value = defineModel<string | undefined>();
defineProps<{
  enabled?: boolean;
}>();
const emit = defineEmits<{
  (e: "blur"): void;
}>();
</script>
<template>
  <div class="textarea-input" :class="{ enabled: enabled }">
    <textarea v-model="value" :disabled="!enabled" rows="4" @blur="emit('blur')"></textarea>
  </div>
</template>
<style lang="scss" scoped>
.textarea-input {
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--str-button-font);
  background-color: var(--bg-button-color);
  border-radius: 2px;
  font-family: Roboto;
  font-weight: 600;

  &.enabled {
    color: var(--str-button-font-active);
  }

  textarea {
    all: unset;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: left;
    width: 100%;
    height: 100%;
    resize: none;
  }
}
</style>
