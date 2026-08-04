// repositories/BlockRepository.ts
import type { BlockData, BlockUid } from "@/types/block";
import type { BlocksStore } from "@/stores/blocks"; // тип стора (см. ниже)

export interface BlockRepository {
  /** Инициализация: загрузка данных и подписка на обновления */
  init(store: BlocksStore): Promise<void>;
  /** Отписка от realtime-канала и очистка */
  destroy(): void;
  /** Создать новый блок */
  addBlock(block: Omit<BlockData, "id">): Promise<BlockData>;
  /** Обновить существующий блок */
  updateBlock(block: BlockData): Promise<void>;
  /** Удалить блок */
  deleteBlock(id: BlockUid): Promise<void>;
}
