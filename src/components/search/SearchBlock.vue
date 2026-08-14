<script setup lang="ts">
import { ref, computed, watch } from "vue";
import Icon from "@/components/common/Icon.vue";
import { useBlocksStore } from "@/stores/blocks";
import { useSearchStore } from "@/stores/search";
import { PLACE_SEARCH_VARIANTS, type SearchPlaceType } from "@/search";
import { BlockTypes, type BlockType } from "@/types/block";

const blocksStore = useBlocksStore();
const searchStore = useSearchStore();

const debounceTimer = ref<number | null>(null);

const isActive = computed(() => searchStore.isActive);

// Иконки-кнопки типов блоков (sprite-id по имени файла)
const blockTypeButtons = BlockTypes.map((type) => ({
  type,
  iconName: type,
  label: type,
}));

// Кнопки всех мест (по порядку из PLACE_SEARCH_VARIANTS)
const placeTypeList = Object.keys(PLACE_SEARCH_VARIANTS) as SearchPlaceType[];

const search = () => {
  if (debounceTimer.value !== null) {
    window.clearTimeout(debounceTimer.value);
    debounceTimer.value = null;
  }
  searchStore.run(blocksStore.blocks, blocksStore.layer);
};

// Поиск с debounce при вводе текста
watch(
  () => searchStore.query,
  () => {
    if (debounceTimer.value !== null) window.clearTimeout(debounceTimer.value);
    debounceTimer.value = window.setTimeout(search, 200);
  },
);

function toggleBlockType(type: BlockType) {
  searchStore.toggleBlockType(type);
  search();
}

function togglePlaceType(type: SearchPlaceType) {
  searchStore.togglePlaceType(type);
  search();
}

function clearAll() {
  searchStore.clearAll();
}
</script>

<template>
  <div class="search-block">
    <div class="search-inputs">
      <input
        v-model="searchStore.query"
        class="search-input"
        type="text"
        placeholder="Поиск блока, места или этажа..."
      />
      <button v-if="isActive" class="clear-button" @click="clearAll">✕</button>
    </div>

    <div class="filters">
      <div class="filter-row">
        <span class="filter-label">Блок:</span>
        <button
          v-for="btn in blockTypeButtons"
          :key="btn.type"
          class="filter-button"
          :class="{ active: searchStore.activeBlockTypes.has(btn.type) }"
          @click="toggleBlockType(btn.type)"
        >
          <Icon :name="btn.iconName" :size="[24, 24]" />
          <!-- <span>{{ btn.label }}</span> -->
        </button>
      </div>
      <div class="filter-row places">
        <span class="filter-label">Место:</span>
        <button
          v-for="type in placeTypeList"
          :key="type"
          class="filter-button"
          :class="{ active: searchStore.activePlaceTypes.has(type) }"
          @click="togglePlaceType(type)"
        >
          <Icon :name="type" :size="[24, 24]" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.search-inputs {
  display: flex;
  flex-direction: row;
  gap: 8px;
  align-items: center;
}

.search-input {
  background-color: var(--bg-button-color);
  border: none;
  border-radius: 5px;
  color: var(--str-button-font);
  padding: 8px 10px;
  outline: none;
  font-family: Roboto;
  font-size: 14px;
  flex: 1;
  &::placeholder {
    color: var(--str-button-font);
    opacity: 0.6;
  }
  &:focus {
    outline: 1px solid var(--accent-color, #4a9eff);
  }
}

.clear-button {
  background: none;
  border: none;
  color: var(--str-button-font);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 6px;
  border-radius: 50%;
  &:hover {
    background-color: var(--bg-button-color);
  }
}

.filters {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.filter-label {
  font-family: Roboto;
  font-size: 12px;
  color: var(--str-button-font);
  opacity: 0.7;
  margin-right: 2px;
}

.filter-button {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 40px;
  height: 38px;
  padding: 3px 6px;
  border-radius: 10px;
  border: 1px solid transparent;
  background-color: var(--bg-button-color);
  color: var(--str-button-font);
  cursor: pointer;
  font-family: Roboto;
  font-size: 12px;
  &.active {
    border-color: var(--accent-color, #4a9eff);
    background-color: color-mix(in srgb, var(--accent-color, #4a9eff) 20%, transparent);
  }
  &:hover {
    opacity: 0.85;
  }
}
</style>
