import { defineStore } from "pinia";
import type { BlockSearchResult } from "@/search";
import { searchBlocks } from "@/search";
import type { BlockType, SearchPlaceType } from "@/types/block";

export const useSearchStore = defineStore("search", {
  state: () => ({
    query: "",
    activeBlockTypes: new Set<BlockType>(),
    activePlaceTypes: new Set<SearchPlaceType>(),
    results: [] as BlockSearchResult[],
    hasSearched: false,
  }),

  getters: {
    isActive(state): boolean {
      return (
        state.query.trim() !== "" ||
        state.activeBlockTypes.size > 0 ||
        state.activePlaceTypes.size > 0
      );
    },
  },

  actions: {
    run(blocks: BlockSearchResult["block"][], layer: number) {
      this.results = searchBlocks(
        { blocks: blocks, layer: layer },
        {
          text: this.query.trim(),
          blockTypes: this.activeBlockTypes.size > 0 ? [...this.activeBlockTypes] : undefined,
          placeTypes: this.activePlaceTypes.size > 0 ? [...this.activePlaceTypes] : undefined,
        },
      );
      this.hasSearched = true;
    },

    toggleBlockType(type: BlockType) {
      const next = new Set(this.activeBlockTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      this.activeBlockTypes = next;
    },

    togglePlaceType(type: SearchPlaceType) {
      const next = new Set(this.activePlaceTypes);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      this.activePlaceTypes = next;
    },

    clearFilters() {
      this.activeBlockTypes = new Set();
      this.activePlaceTypes = new Set();
    },

    clearAll() {
      this.query = "";
      this.clearFilters();
      this.results = [];
      this.hasSearched = false;
    },
  },
});
