import { defineStore } from "pinia";
import { NestedMap3 } from "@/utils";
import { useBlocksStore } from "./blocks";
import type { TransitionRepository } from "@/repository/transition/repo";
import { getTransitionsCell, type TransitionData, type TransitionId } from "@/types/transition";

export interface TransitionsStore {
  repository: TransitionRepository | null;
  transitions: TransitionData[];
  loading: boolean;
  error: string | null;
  editedTransitions: Set<TransitionId>;
  newTransitions: TransitionData[];
}

export const useTransitionsStore = defineStore("transitions", {
  state: (): TransitionsStore => ({
    repository: null,
    transitions: [],
    loading: false,
    error: null,
    editedTransitions: new Set<TransitionId>(),
    newTransitions: [] as TransitionData[],
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

      // Сбрасываем буфер несохранённых изменений
      this.editedTransitions.clear();
      this.newTransitions = [];

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

    /**
     * Добавить переход локально (буферизация).
     * Изменение отправится на сервер при вызове flushPending().
     * Возвращает созданный локально переход (с временным id).
     */
    addTransition(data: Omit<TransitionData, "id">) {
      // Временный отрицательный id, уникальный в рамках текущей сессии.
      const tempId: TransitionId = -this.newTransitions.length - 1;
      const tempTransition: TransitionData = {
        ...data,
        id: tempId,
      };
      this.newTransitions.push(tempTransition);
      this.transitions.push(tempTransition);
      this.editedTransitions.add(tempId);
      return tempTransition;
    },

    /**
     * Удалить переход локально (буферизация).
     * Переход сразу убирается с карты.
     * Если переход ещё не был отправлен на сервер — просто убираем его из буфера,
     * иначе помечаем на удаление (отправится при flushPending()).
     */
    removeTransition(transitionId: TransitionId) {
      // Убираем переход с карты сразу, чтобы удаление было видно локально
      this.transitions = this.transitions.filter((t) => t.id !== transitionId);

      if (this.newTransitions.some((t) => t.id === transitionId)) {
        // Новый переход, ещё не отправленный на сервер — просто убираем из буфера
        this.newTransitions = this.newTransitions.filter((t) => t.id !== transitionId);
        this.editedTransitions.delete(transitionId);
      } else {
        // Существующий переход — помечаем на удаление (отправится при flushPending())
        this.editedTransitions.add(transitionId);
      }
    },

    /**
     * Отправить все накопленные изменения переходов на сервер.
     * Вызывается при выключении режима редактирования.
     */
    async flushPending(): Promise<void> {
      if (!this.repository) return;

      // 1. Удаляем переходы, помеченные на удаление (существующие на сервере)
      const deletions: Promise<void>[] = [];
      for (const id of this.editedTransitions) {
        if (!this.newTransitions.some((t) => t.id === id)) {
          deletions.push(this.repository.removeTransition(id));
        }
      }
      await Promise.all(deletions);

      // 2. Отправляем создание новых переходов и заменяем temp-переходы на сохранённые
      const additions = this.newTransitions.map((t) =>
        this.repository!.addTransition(t).then((saved) => {
          const idx = this.transitions.findIndex((tr) => tr.id === t.id);
          if (idx !== -1) {
            this.transitions[idx] = saved;
          }
        }),
      );
      await Promise.all(additions);

      this.editedTransitions.clear();
      this.newTransitions = [];
    },

    /**
     * Сбросить буфер переходов без отправки на сервер.
     * Используется при смене репозитория.
     */
    resetPending(): void {
      this.editedTransitions.clear();
      this.newTransitions = [];
    },
  },
});
