import { supabase } from "@/supabase";
import { defineStore } from "pinia";
import { type BlockData, type BlockUid, type PassagePosition } from "@/types/block";
import { transitionPositions } from "@/const/rendering";
import { NestedMap3 } from "@/utils";
import { useBlocksStore } from "./blocks";
import type { TransitionRepository } from "@/repository/transition/repo";
import { getTransitionsCell, type TransitionData, type TransitionId } from "@/types/transition";

export interface TransitionsStore {
  repository: TransitionRepository | null;
  transitions: TransitionData[];
  loading: boolean;
  error: string | null;
}

export const useTransitionsStore = defineStore("transitions", {
  state: (): TransitionsStore => ({
    repository: null,
    transitions: [],
    loading: false,
    error: null,
  }),

  getters: {
    mappedTransitions: (state) => {
      const map = new NestedMap3<number, number, number, TransitionData>();
      const blocksStore = useBlocksStore();
      for (const data of state.transitions) {
        const block = blocksStore.getBlock(data.from_block_id);
        if (!block) continue;
        const [cellX, cellY] = getTransitionsCell(block, data.from_position);
        const layer = block.layer + data.from_floor;
        map.set(layer, cellX, cellY, data);
      }
      return map;
    },
  },

  actions: {
    /**
     * Установить или сменить репозиторий.
     * При вызове:
     *  - отключает предыдущий репозиторий (если был)
     *  - очищает transitions и ошибки
     *  - инициализирует новый репозиторий, который загрузит данные
     */
    async setRepository(newRepo: TransitionRepository) {
      this.loading = true;
      this.error = null;

      // Отключаем старый репозиторий
      if (this.repository) {
        this.repository.destroy();
      }

      this.repository = newRepo;

      try {
        await this.repository.init(this);
      } catch (err: unknown) {
        if (err instanceof Error) {
          this.error = err.message;
        } else {
          this.error = "Неизвестная ошибка";
        }
      } finally {
        this.loading = false;
      }
    },

    /**
     * Вызвать при уничтожении стора (например, в onUnmounted).
     * Отключает текущий репозиторий и обнуляет ссылку.
     */
    destroyRepository() {
      if (this.repository) {
        this.repository.destroy();
        this.repository = null;
      }
    },

    // ---- Методы работы с данными ----

    async addTransition(data: Omit<TransitionData, "id">) {
      if (!this.repository) throw new Error("Repository not set");
      await this.repository.addTransition(data);
    },

    async removeTransition(transitionId: TransitionId) {
      if (!this.repository) throw new Error("Repository not set");
      await this.repository.removeTransition(transitionId);
    },
  },
});
