<script setup lang="ts">
import type { FlightType } from "@/stores/blocks.ts";
import Icon from "../common/Icon.vue";
const props = defineProps<{
  type: FlightType;
  enabled?: boolean;
}>();
const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>

<template>
  <div class="flight-description" :class="{ editing: enabled }">
    <Icon
      v-if="type === 'ladder_elevator'"
      name="ladder"
      :size="[18, 18]"
      @click="emit('click')"
    ></Icon>
    <Icon
      v-if="type === 'elevator' || type === 'ladder_elevator'"
      name="elevator"
      :size="[18, 18]"
      @click="emit('click')"
    ></Icon>
    <Icon v-if="type === 'stairs'" name="stairs" :size="[18, 18]" @click="emit('click')"></Icon>
  </div>
</template>
<style lang="scss" scoped>
.flight-description {
  display: contents;
  color: var(--str-button-font);
  pointer-events: none;
  &.editing {
    color: var(--str-button-font-active);
    cursor: pointer;
    pointer-events: unset;
  }
}
</style>
