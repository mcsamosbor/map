import type { ShopItemsStore } from "@/stores/shopItems";
import type { ItemData, ItemId } from "@/types/item";

export interface ShopItemsRepository {
  init(store: ShopItemsStore): Promise<void>;
  destroy(): void;
  addItem(item: ItemData): Promise<void>;
  updateItem(item: ItemData): Promise<void>;
  deleteItem(id: ItemId): Promise<void>;
}
