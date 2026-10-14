<script lang="ts" setup>
/**
 * Фильтр по тегам: чипсы-переключатели из словаря тегов.
 * Показывает предметы, у которых есть хотя бы один из выбранных тегов.
 */
defineProps<{ tags: string[] }>();

const selected = defineModel<string[]>({ default: () => [] });

const toggle = (tag: string) => {
  selected.value = selected.value.includes(tag)
    ? selected.value.filter((t) => t !== tag)
    : [...selected.value, tag];
};
</script>
<template>
  <div v-if="tags.length > 0" class="tag-filter">
    <button
      v-for="tag in tags"
      :key="tag"
      type="button"
      class="tag-chip"
      :class="{ active: selected.includes(tag) }"
      @click="toggle(tag)"
    >
      {{ tag }}
    </button>
  </div>
</template>
<style lang="scss" scoped>
.tag-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-chip {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3px 10px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-family: Roboto;
  font-size: 12px;
  font-weight: 600;
  color: var(--str-button-font);
  background-color: var(--bg-button-color);
  white-space: nowrap;

  &:hover {
    color: var(--str-button-font-active);
  }

  &.active {
    color: var(--str-button-font-active);
    background-color: var(--bg-button-color-enabled);
    border-color: var(--bg-icon-button-active);
  }
}
</style>
