import type { ShopItemsRepository } from "@/repository/shop_items/repo";
import type { ShopItemsStore } from "@/stores/shopItems";
import { supabase } from "@/supabase";
import type { ItemData, ItemId } from "@/types/item";

interface DbShopItemRow {
  id: string;
  name: string;
  count: number;
  price: number;
  icon: string | null;
  tags: string[] | null;
}

const toItemData = (row: DbShopItemRow): ItemData => ({
  id: row.id,
  name: row.name,
  count: row.count,
  price: row.price,
  icon: row.icon ?? undefined,
  tags: row.tags ?? [],
});

const toDbRow = (item: ItemData) => ({
  id: item.id,
  name: item.name,
  count: item.count,
  price: item.price,
  icon: item.icon ?? null,
  tags: item.tags,
  updated_at: new Date().toISOString(),
});

export class SupabaseShopItemsRepository implements ShopItemsRepository {
  private store?: ShopItemsStore;
  private channel: ReturnType<typeof supabase.channel> | null = null;

  async init(store: ShopItemsStore): Promise<void> {
    this.store = store;
    await this.reload();

    // Подписка на изменения справочника другими редакторами.
    // Пока есть локальные неотправленные правки — не перезаписываем их.
    this.channel = supabase
      .channel("shop_items_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "shop_items" }, () => {
        if (!this.store || this.store.hasPendingChanges) return;
        void this.reload().catch(() => undefined);
      })
      .subscribe();
  }

  destroy(): void {
    void this.channel?.unsubscribe();
    this.channel = null;
  }

  private async reload(): Promise<void> {
    if (!this.store) throw new Error("ShopItemsStore is not set");
    const { data, error } = await supabase
      .from("shop_items")
      .select("id, name, count, price, icon, tags")
      .order("id");
    if (error) throw error;
    const rows = (data ?? []) as unknown as DbShopItemRow[];
    this.store.items = rows.map(toItemData);
  }

  async addItem(item: ItemData): Promise<void> {
    const { error } = await supabase.from("shop_items").insert(toDbRow(item));
    if (error) throw error;
  }

  async updateItem(item: ItemData): Promise<void> {
    const { error } = await supabase.from("shop_items").upsert(toDbRow(item), { onConflict: "id" });
    if (error) throw error;
  }

  async deleteItem(id: ItemId): Promise<void> {
    const { error } = await supabase.from("shop_items").delete().eq("id", id);
    if (error) throw error;
  }
}
