<template>
  <button
    type="button"
    class="floor-height-button"
    :class="{ 'is-enabled': enabled, 'is-extended': model > 1 }"
    :disabled="!enabled"
    :aria-label="`Подэтажей: ${model}`"
    :title="hint"
    @click="cycle"
  >
    {{ model }}
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { FloorHeights, type FloorHeight } from "@/types/block";
import { nextValue } from "@/utils";

// Модель для v-model: высота отображаемого этажа (1 | 2 | 3)
const model = defineModel<FloorHeight>({ default: 1 });

const props = withDefaults(
  defineProps<{
    enabled?: boolean;
  }>(),
  {
    enabled: false,
  },
);

const hint = computed(() => {
  switch (model.value) {
    case 2:
      return "Двойной этаж: подэтажи N/1 и N/2";
    case 3:
      return "Тройной этаж: подэтажи N/1, N/2 и N/3";
    default:
      return "Обычный этаж (один уровень)";
  }
});

// Цикл 1 → 2 → 3 → 1
const cycle = () => {
  if (!props.enabled) return;
  model.value = nextValue(FloorHeights, model.value);
};
</script>

<style lang="scss" scoped>
.floor-height-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 50%;
  border: 3px solid var(--str-button-font);
  background-color: transparent;
  color: var(--str-button-font);
  font-family: Roboto;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  cursor: default;
  user-select: none;
  transition:
    border-color 0.2s ease,
    color 0.2s ease,
    background-color 0.2s ease;

  &.is-enabled {
    cursor: pointer;
    border-color: var(--str-button-font-active);
    color: var(--str-button-font-active);

    &:hover {
      background-color: color-mix(in srgb, var(--str-button-font-active) 14%, transparent);
    }
  }

  &.is-extended {
    background-color: color-mix(in srgb, var(--str-button-font) 16%, transparent);

    &.is-enabled {
      background-color: color-mix(in srgb, var(--str-button-font-active) 16%, transparent);
      color: var(--str-button-font-active);
    }
  }
}
</style>
