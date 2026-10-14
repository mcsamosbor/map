import { PostgrestError } from "@supabase/supabase-js";
import { defineStore } from "pinia";
import type { ShopItemsRepository } from "@/repository/shop_items/repo";
import type { ItemData, ItemId, NewItemData } from "@/types/item";

/** Интерфейс стора для репозиториев (по аналогии с BlocksStore/CommentsStore). */
export interface ShopItemsStore {
  items: ItemData[];
  loading: boolean;
  error: string | null;
  /** Есть ли локальные неотправленные правки (пока не вызван flushItems). */
  readonly hasPendingChanges: boolean;
}

/** Генератор id нового предмета (uuid, с запасным вариантом для http). */
const generateItemId = (): ItemId =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const useShopItemsStore = defineStore("shopItems", {
  state: () => ({
    repository: null as ShopItemsRepository | null,
    items: [] as ItemData[],
    loading: false,
    error: null as string | null,
    /** Добавленные локально предметы, которых ещё нет на сервере. */
    newIds: new Set<ItemId>(),
    /** Изменённые локально предметы. */
    editedIds: new Set<ItemId>(),
    /** Удалённые локально предметы (их уже нет в `items`). */
    deletedIds: new Set<ItemId>(),
  }),
  getters: {
    getItem:
      (state) =>
      (id: ItemId): ItemData | undefined =>
        state.items.find((item) => item.id === id),
    /** Словарь тегов: уникальные теги всех предметов по алфавиту. */
    allTags(state): string[] {
      const tags = new Set<string>();
      for (const item of state.items) {
        for (const tag of item.tags) tags.add(tag);
      }
      return [...tags].sort((a, b) => a.localeCompare(b, "ru"));
    },
    hasPendingChanges(state): boolean {
      return state.newIds.size > 0 || state.editedIds.size > 0 || state.deletedIds.size > 0;
    },
  },
  actions: {
    async setRepository(newRepo: ShopItemsRepository) {
      this.loading = true;
      this.error = null;

      // Отключаем старый репозиторий
      if (this.repository) {
        this.repository.destroy();
      }

      // Сбрасываем неотправленные правки при переключении источника данных
      this.newIds.clear();
      this.editedIds.clear();
      this.deletedIds.clear();

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
    destroyRepository() {
      this.repository?.destroy();
      this.repository = null;
    },
    /**
     * Добавить новый предмет в справочник (id генерируется).
     * Отправка на сервер происходит в `flushItems()` (при выключении
     * глобального редактирования).
     */
    addItem(data: NewItemData): ItemData {
      const item: ItemData = { id: generateItemId(), ...data, tags: [...data.tags] };
      this.items.push(item);
      this.newIds.add(item.id);
      return item;
    },
    /**
     * Локально изменить предмет в справочнике.
     * Отправка на сервер происходит в `flushItems()` (при выключении
     * глобального редактирования).
     */
    changeItem(item: ItemData) {
      const index = this.items.findIndex((i) => i.id === item.id);
      if (index === -1) return;
      this.items[index] = { ...item, tags: [...item.tags] };
      // Новый предмет и так будет целиком отправлен при flushItems.
      if (!this.newIds.has(item.id)) this.editedIds.add(item.id);
    },
    /**
     * Локально удалить предмет из справочника. Блоки хранят только id, поэтому
     * удалённый предмет просто исчезает из их магазинов.
     */
    deleteItem(id: ItemId) {
      const index = this.items.findIndex((i) => i.id === id);
      if (index === -1) return;
      this.items.splice(index, 1);
      // Ещё не отправленный новый предмет просто исчезает.
      if (this.newIds.delete(id)) return;
      this.editedIds.delete(id);
      this.deletedIds.add(id);
    },
    /** Отправить накопленные изменения справочника на сервер. */
    async flushItems() {
      if (!this.repository) return;
      try {
        const promises: Promise<void>[] = [];
        for (const id of this.newIds) {
          const item = this.items.find((i) => i.id === id);
          if (item) promises.push(this.repository.addItem(item));
        }
        for (const id of this.editedIds) {
          const item = this.items.find((i) => i.id === id);
          if (item) promises.push(this.repository.updateItem(item));
        }
        for (const id of this.deletedIds) {
          promises.push(this.repository.deleteItem(id));
        }
        await Promise.all(promises);
        this.newIds.clear();
        this.editedIds.clear();
        this.deletedIds.clear();
      } catch (err) {
        // Правки остаются в очереди — их можно отправить повторным flushItems.
        this.error = err instanceof Error ? err.message : String(err);
      }
    },
  },
});
