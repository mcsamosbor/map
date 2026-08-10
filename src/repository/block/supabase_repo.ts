// repositories/SupabaseBlockRepository.ts
import { supabase } from "@/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { BlockRepository } from "./repo";
import type { BlockData, BlockUid, BlockRawData } from "@/types/block";
import type { BlocksStore } from "@/stores/blocks";

interface DbBlockRow {
  id: BlockUid;
  data: BlockRawData;
  position_x: number;
  position_y: number;
  layer: number;
  updated_at: string;
}

export class SupabaseBlockRepository implements BlockRepository {
  private store!: BlocksStore;
  private unsubscribeFn?: () => void;

  async init(store: BlocksStore): Promise<void> {
    this.store = store;
    console.log("init supabase");
    const { data, error } = await supabase
      .from("blocks")
      .select("id, data, position_x, position_y, layer")
      .order("id", { ascending: true });
    console.log(data);
    if (error) throw error;

    this.store.blocks = (data as DbBlockRow[]).map((row) => ({
      id: row.id,
      ...row.data,
      position_x: row.position_x ?? 0,
      position_y: row.position_y ?? 0,
      layer: row.layer ?? 0,
      direction: row.data.direction ?? "up",
    }));

    const channel = supabase
      .channel("blocks-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blocks" },
        (payload: RealtimePostgresChangesPayload<DbBlockRow>) => {
          this.handleRealtimePayload(payload);
        },
      )
      .subscribe();

    this.unsubscribeFn = () => {
      supabase.removeChannel(channel);
    };
  }

  destroy(): void {
    this.unsubscribeFn?.();
  }

  private handleRealtimePayload(payload: RealtimePostgresChangesPayload<DbBlockRow>) {
    const { eventType, new: newRow, old } = payload;

    // Если блок локально изменён (правки ещё не отправлены на сервер) —
    // игнорируем realtime-UPDATE, иначе серверные данные затрут локальные правки.
    if (eventType === "UPDATE" && newRow && this.store.editedBlocks.has(newRow.id)) {
      return;
    }

    switch (eventType) {
      case "INSERT":
        if (newRow) {
          const newBlock: BlockData = {
            id: newRow.id,
            ...newRow.data,
            position_x: newRow.position_x ?? 0,
            position_y: newRow.position_y ?? 0,
            layer: newRow.layer ?? 0,
          };
          this.store.blocks.push(newBlock);
        }
        break;
      case "UPDATE":
        if (newRow) {
          const updatedBlock: BlockData = {
            id: newRow.id,
            ...newRow.data,
            position_x: newRow.position_x ?? 0,
            position_y: newRow.position_y ?? 0,
            layer: newRow.layer ?? 0,
          };
          const index = this.store.blocks.findIndex((b) => b.id === updatedBlock.id);
          if (index !== -1) {
            this.store.blocks[index] = updatedBlock;
          } else {
            this.store.blocks.push(updatedBlock);
          }
        }
        break;
      case "DELETE":
        if (old) {
          // Блок удалён на сервере — убираем и из буфера локальных изменений
          old.id && this.store.editedBlocks.delete(old.id);
          this.store.blocks = this.store.blocks.filter((b) => b.id !== old.id);
        }
        break;
    }
  }

  async addBlock(block: Omit<BlockData, "id">): Promise<BlockData> {
    const { data, error } = await supabase
      .from("blocks")
      .insert({
        data: block,
        position_x: block.position_x,
        position_y: block.position_y,
        layer: block.layer,
      })
      .select("id, data, position_x, position_y, layer")
      .single();

    if (error) throw error;
    return { id: data.id, ...data.data } as BlockData;
  }

  async updateBlock(block: BlockData): Promise<void> {
    const { id, ...dataWithoutId } = block;
    const { error } = await supabase
      .from("blocks")
      .update({
        data: dataWithoutId,
        position_x: block.position_x,
        position_y: block.position_y,
        layer: block.layer,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  }

  async deleteBlock(id: BlockUid): Promise<void> {
    const { error } = await supabase.from("blocks").delete().eq("id", id);
    if (error) throw error;
  }
}
