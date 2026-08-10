import type { TransitionData, TransitionId } from "@/types/transition";
import type { TransitionsStore } from "@/stores/transitions";

export interface TransitionRepository {
  /**
   * Инициализация: загружает данные и (опционально) подписывается на обновления.
   * Входной параметр store используется для прямой записи в store.transitions.
   */
  init(store: TransitionsStore): Promise<void>;

  /** Отписка от realtime-канала (если используется) */
  destroy(): void;

  /**
   * Добавить новый переход.
   * Возвращает созданный переход (с реальным id из БД/хранилища).
   */
  addTransition(data: Omit<TransitionData, "id">): Promise<TransitionData>;

  /** Удалить переход по id */
  removeTransition(transitionId: TransitionId): Promise<void>;
}
