<script setup lang="ts">
import Icon from "@/components/common/Icon.vue";
import { useBlocksStore } from "@/stores/blocks";
import { useSearchStore } from "@/stores/search";
import { useCanvasContextStore } from "@/stores/canvasContext";
import { getBlockSearchPlaceTypes, type BlockSearchResult } from "@/search";

const blocksStore = useBlocksStore();
const searchStore = useSearchStore();
const canvasContext = useCanvasContextStore();

function focusResult(result: BlockSearchResult) {
  const block = result.block;
  canvasContext.focusBlock(block.position_x, block.position_y, block.id);
  // Глобальный слой = базовый слой блока + физический слот этажа из результата
  blocksStore.layer = block.layer + result.floorSlot;
}
</script>

<template>
  <div v-if="searchStore.isActive" class="search-results-panel">
    <div v-if="searchStore.results.length === 0" class="no-results">Ничего не найдено</div>
    <div v-else class="search-results">
      <div
        v-for="result in searchStore.results"
        :key="result.block.id"
        class="result-item"
        @click="focusResult(result)"
      >
        <div class="result-top">
          <Icon
            :name="result.block.type ?? 'residential'"
            :size="[20, 20]"
            class="block-type-icon"
          />
          <span class="result-name">{{ result.block.name }}</span>
          <span class="result-floor">{{ result.displayFloor }}</span>
        </div>
        <div class="result-places">
          <Icon
            v-for="type in getBlockSearchPlaceTypes(result.block)"
            :key="type"
            :name="type"
            :size="[18, 18]"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-results-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 10px;
  background-color: var(--bg-panel-background);
  padding: 10px;
  box-sizing: border-box;
  overflow-y: auto;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.no-results {
  font-family: Roboto;
  font-size: 13px;
  color: var(--str-button-font);
  opacity: 0.7;
  text-align: center;
  padding: 10px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 6px;
  background-color: var(--bg-button-color);
  cursor: pointer;
  &:hover {
    filter: brightness(1.2);
  }
  color: var(--str-button-font);
}

.result-top {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

.block-type-icon {
  flex-shrink: 0;
}

.result-name {
  font-family: Roboto;
  font-weight: 600;
  font-size: 20px;
  color: var(--str-button-font);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-floor {
  font-family: Roboto;
  font-size: 12px;
  color: var(--str-button-font);
  opacity: 0.8;
  background-color: color-mix(in srgb, var(--bg-panel-background) 60%, transparent);
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.result-places {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 28px;
  opacity: 0.85;
}
</style>
