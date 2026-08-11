import { PostgrestError } from "@supabase/supabase-js";
import { defineStore } from "pinia";
import {
  type PassagePosition,
  type BlockData,
  type BlockUid,
  PassageTypes,
  FenceTypes,
} from "@/types/block";
import type { BlockRepository } from "@/repository/block/repo";
import { nextValue } from "@/utils";

export interface BlocksStore {
  blocks: BlockData[];
  layer: number;
  isEditing: boolean;
  loading: boolean;
  error: string | null;
  editedBlocks: Set<BlockUid>;
  selectedBlockId: BlockUid | undefined;
  // методы не включаем в интерфейс для репозитория
}

export const useBlocksStore = defineStore("blocks", {
  state: () => {
    return {
      repository: null as null | BlockRepository,
      blocks: [] as BlockData[],
      layer: 0,
      isEditing: false,
      loading: false,
      error: null as null | string,
      editedBlocks: new Set<BlockUid>(),
      selectedBlockId: undefined as BlockUid | undefined,
    };
  },
  getters: {
    getBlock: (state) => {
      return (blockId: BlockUid) => {
        return state.blocks.find((block) => block.id === blockId);
      };
    },
    selectedBlock: (state) => state.blocks.find((block) => block.id === state.selectedBlockId),
  },
  actions: {
    async setRepository(newRepo: BlockRepository) {
      this.loading = true;
      this.error = null;

      // Отключаем старый репозиторий
      if (this.repository) {
        this.repository.destroy();
      }

      // Сбрасываем состояние редактирования
      this.editedBlocks.clear();
      this.isEditing = false;

      this.repository = newRepo;

      try {
        await this.repository.init(this); // передаём сам стор
      } catch (err) {
        if (err instanceof PostgrestError) {
          this.error = err.message;
        }
      } finally {
        this.loading = false;
      }
    },
    startEditing() {},
    async endEditing() {
      if (!this.repository) return;
      const promises: Promise<void>[] = [];
      for (const id of this.editedBlocks) {
        const block = this.getBlock(id);
        if (!block) continue;
        promises.push(this.repository.updateBlock(block));
      }
      await Promise.all(promises);
      this.editedBlocks.clear();
    },
    /**
     * Пометить блок как изменённый (локально, без отправки на сервер).
     * Используется при редактировании карточки блока.
     */
    markBlockEdited(blockId: BlockUid) {
      this.editedBlocks.add(blockId);
    },
    /**
     * Отправить изменения конкретного блока на сервер.
     * Вызывается при выключении редактирования карточки, смене выбранного
     * блока или закрытии карточки.
     */
    async flushBlock(blockId: BlockUid) {
      if (!this.repository) return;
      if (!this.editedBlocks.has(blockId)) return;
      const block = this.getBlock(blockId);
      if (!block) return;
      await this.repository.updateBlock(block);
      this.editedBlocks.delete(blockId);
    },
    async toggleEditing() {
      this.isEditing = !this.isEditing;
      if (this.isEditing) {
        this.startEditing();
      } else {
        await this.endEditing();
      }
    },
    changePassageType(blockId: BlockUid, floorIndex: number, position: PassagePosition) {
      if (!this.isEditing) return;
      const block_data = this.blocks.find((block) => block.id === blockId);
      if (!block_data) return;
      const floor = floorIndex;
      block_data.floors_data ??= {};
      const currentType = block_data.floors_data[floor]?.passages_data?.[position] ?? "noway";

      block_data.floors_data[floor] ??= {};
      block_data.floors_data[floor].passages_data ??= {};
      const passagesData = block_data.floors_data[floor].passages_data;
      const newType = nextValue(PassageTypes, currentType);
      passagesData[position] = newType;
      this.editedBlocks.add(blockId);
    },
    changeFenceType(blockId: BlockUid, floorIndex: number) {
      if (!this.isEditing) return;
      const block_data = this.blocks.find((block) => block.id === blockId);
      if (!block_data) return;
      const floor = floorIndex;
      block_data.floors_data ??= {};
      const currentType = block_data.floors_data[floor]?.fence_type ?? "missing";

      block_data.floors_data[floor] ??= {};
      const newType = nextValue(FenceTypes, currentType);
      block_data.floors_data[floor].fence_type = newType;
      this.editedBlocks.add(blockId);
    },
    async addBlock(block: Omit<BlockData, "id">) {
      if (!this.repository) throw new Error("Repository not set");
      return this.repository.addBlock(block);
    },
    async updateBlock(block: BlockData) {
      if (!this.repository) throw new Error("Repository not set");
      await this.repository.updateBlock(block);
    },
    async deleteBlock(id: BlockUid) {
      if (!this.repository) throw new Error("Repository not set");
      await this.repository.deleteBlock(id);
    },
  },
});
