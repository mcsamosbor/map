<template>
  <div
    ref="selectRef"
    class="custom-select"
    :class="{ 'is-open': isOpen, 'is-disabled': !enabled }"
  >
    <!-- Триггер (поле ввода) -->
    <div class="select-trigger" @click="toggle">
      <span class="select-value">{{ selectedLabel || placeholder }}</span>
      <span v-if="enabled" class="select-arrow" :class="{ 'is-open': isOpen }"></span>
    </div>

    <!-- Выпадающий список с анимацией -->
    <Transition name="fade">
      <ul v-if="isOpen" class="select-options">
        <li
          v-for="option in options"
          :key="option.value"
          class="select-option"
          :class="{ 'is-selected': option.value === model }"
          @click="selectOption(option)"
        >
          {{ option.label }}
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";

/**
 * Тип для опции селекта
 */
export interface SelectOption {
  label: string;
  value: string | number;
}

/**
 * Свойства компонента
 */
const props = defineProps<{
  /** Список опций */
  options: SelectOption[];
  /** Включён ли компонент (редактируемость) */
  enabled?: boolean;
  /** Плейсхолдер, когда ничего не выбрано */
  placeholder?: string;
}>();

/**
 * Двусторонняя привязка значения через v-model
 */
const model = defineModel<string | number>();

/**
 * Состояние открытости списка
 */
const isOpen = ref(false);

/**
 * Ссылка на корневой элемент для обработки кликов снаружи
 */
const selectRef = ref<HTMLElement | null>(null);

/**
 * Вычисляемое отображаемое значение (лейбл выбранной опции)
 */
const selectedLabel = computed(() => {
  const found = props.options.find((opt) => opt.value === model.value);
  return found ? found.label : "";
});

/**
 * Переключение открытия/закрытия списка
 */
const toggle = () => {
  if (!props.enabled) return;
  isOpen.value = !isOpen.value;
};

/**
 * Выбор опции
 */
const selectOption = (option: SelectOption) => {
  if (!props.enabled) return;
  model.value = option.value;
  isOpen.value = false;
};

/**
 * Закрытие списка при клике вне компонента
 */
const handleClickOutside = (event: MouseEvent) => {
  if (selectRef.value && !selectRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});
</script>

<style scoped lang="scss">
.custom-select {
  position: relative;
  width: 200px; /* при необходимости переопределить */
  font-family: inherit;
  user-select: none;

  .select-trigger {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    // border: 1px solid #ccc;
    border-radius: 4px;
    cursor: pointer;
    background-color: var(--bg-button-color-enabled, #f0f0f0);
    color: var(--str-button-font-active, #333);
    transition:
      background-color 0.2s,
      border-color 0.2s;
  }

  .select-value {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .select-arrow {
    display: inline-block;
    width: 0;
    height: 0;
    margin-left: 8px;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid currentColor;
    transition: transform 0.3s;

    &.is-open {
      transform: rotate(180deg);
    }
  }

  /* Состояние disabled */
  &.is-disabled {
    .select-trigger {
      background-color: transparent;
      color: var(--str-button-font, #999);
      border-color: #ddd;
      cursor: not-allowed;
    }
  }

  /* Выпадающий список */
  .select-options {
    position: absolute;
    top: calc(100% + 2px);
    left: 0;
    right: 0;
    margin: 0;
    padding: 0;
    list-style: none;
    background: var(--bg-button-color-enabled, #f0f0f0);
    // border: 1px solid #ccc;
    border-radius: 4px;
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .select-option {
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: #60a7d627;
    }

    &.is-selected {
      background: #6093d644;
      font-weight: 500;
      color: var(--str-button-font-active);
    }
  }

  /* Анимация появления/исчезновения */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.25s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
}
</style>
