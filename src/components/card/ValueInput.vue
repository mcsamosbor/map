<script lang="ts" setup generic="T">
const value = defineModel<T>();
const props = defineProps<{
  enabled?: boolean;
}>();
const emit = defineEmits<{
  (e: "blur"): void;
}>();
</script>
<template>
  <div class="value-input" :class="{ enabled: enabled }">
    <input v-model="value" :disabled="!enabled" @blur="emit('blur')" />
  </div>
</template>
<style lang="scss" scoped>
.value-input {
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

  input {
    all: unset;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    width: 100%;
    height: 100%;
  }
}
</style>
