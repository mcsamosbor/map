<template>
  <label class="checkbox-circle" :class="{ 'is-disabled': !enabled, mini: mini }">
    <input type="checkbox" :checked="model" :disabled="!enabled" @change="handleChange" />
    <span class="outer-circle" :class="{ 'is-enabled': enabled }">
      <span v-if="model" class="inner-circle" :class="{ 'is-enabled': enabled }"></span>
    </span>
  </label>
</template>

<script setup lang="ts">
// Модель для v-model (двусторонняя привязка)
const model = defineModel<boolean>({ default: false });

// Свойство enabled – опциональное, по умолчанию false (чекбокс неактивен)
const props = withDefaults(
  defineProps<{
    enabled?: boolean;
    mini?: boolean;
  }>(),
  {
    enabled: false,
  },
);

// Обработчик изменения состояния
function handleChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (props.enabled) {
    model.value = target.checked;
  }
}
</script>

<style scoped lang="scss">
.checkbox-circle {
  display: inline-block;
  cursor: pointer;
  user-select: none;
  position: relative;
  display: flex;
  height: min-content;

  // Скрываем нативный чекбокс
  input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
    pointer-events: none;
  }

  // Внешнее кольцо
  .outer-circle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid var(--str-button-font);
    transition: border-color 0.2s ease;

    &.is-enabled {
      border-color: var(--str-button-font-active);
    }
  }

  // Внутренний шарик
  .inner-circle {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: var(--str-button-font);
    transition:
      background-color 0.2s ease,
      transform 0.2s ease;

    &.is-enabled {
      background-color: var(--str-button-font-active);
    }
  }

  &.mini {
    .outer-circle {
      width: 18px;
      height: 18px;
    }
    .inner-circle {
      width: 8px;
      height: 8px;
    }
  }

  // Состояние "неактивен" – отключаем курсор и фиксируем цвета
  &.is-disabled {
    cursor: default;

    .outer-circle {
      border-color: var(--str-button-font);
    }

    .inner-circle {
      background-color: var(--str-button-font);
    }
  }
}
</style>
