import type { ShopItemsRepository } from "@/repository/shop_items/repo";
import type { ShopItemsStore } from "@/stores/shopItems";
import type { ItemData, ItemId } from "@/types/item";

/**
 * Локальный тестовый репозиторий.
 *
 * В mock-режиме стор — единственный источник истины: он сам применяет
 * правки к `items`, а `flushItems()` лишь имитирует отправку на сервер,
 * поэтому add/update/delete ничего не делают.
 */
export class MockShopItemsRepository implements ShopItemsRepository {
  async init(store: ShopItemsStore): Promise<void> {
    // Моковых данных нет — справочник пустой, его заполняют картографы.
    store.items = [];
  }

  destroy(): void {}

  async addItem(_item: ItemData): Promise<void> {}

  async updateItem(_item: ItemData): Promise<void> {}

  async deleteItem(_id: ItemId): Promise<void> {}
}
