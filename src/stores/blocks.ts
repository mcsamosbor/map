import { supabase } from "@/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { defineStore } from "pinia";
import { generateBlocks } from "./blocks_mock";

export const nextValue = <T>(list: readonly T[], currentValue: T) => {
  const currentIndex = list.indexOf(currentValue) ?? -1;
  const nextIndex = (currentIndex + 1) % list.length;
  return list[nextIndex]!;
};

export const BlockDirections = ["up", "right", "down", "left"] as const;
export type BlockDirection = (typeof BlockDirections)[number];

export const BlockTypes = ["residential", "frozen", "infected", "destroyed"] as const;
export type BlockType = (typeof BlockTypes)[number];

export const FlightTypes = ["stairs", "elevator", "ladder_elevator"] as const;
export const FlightStatuses = ["free", "blocked"] as const;
export type FlightType = (typeof FlightTypes)[number];
export type FlightStatus = (typeof FlightStatuses)[number];
export type FlightData = {
  type: FlightType;
  status?: FlightStatus;
};

export const ProfessionPlaces = ["liquidator", "repairman", "cleaner", "plumber"] as const;
export const InfrastructurePlaces = ["generator", "board", "mail"] as const;
export const PlaceTypes = [
  "theatre",
  "hospital",
  "party",
  "gym",
  "laundry",
  "postal",
  "overview",
  "racing",
  "hockey",
  "spleef",
  "pool",
  "warehouse",
  "shower",
  "toilet",
  "gallery",
] as const;

export type PlaceType =
  | (typeof ProfessionPlaces)[number]
  | (typeof PlaceTypes)[number]
  | (typeof InfrastructurePlaces)[number];

export type PlaceData = {
  floor: number;
  type: PlaceType;
};

export type BlockUid = number;

export const PassagePositions = [
  "up_left",
  "up_right",
  "right",
  "down_right",
  "down_left",
  "left",
] as const;
export type PassagePosition = (typeof PassagePositions)[number];
export const PassageTypes = ["noway", "normal", "stairs_up", "stairs_down"] as const;
export type PassageType = (typeof PassageTypes)[number];
export type PassagesData = { [position in PassagePosition]?: PassageType } | undefined;

export const FenceTypes = ["missing", "hole", "solid"] as const;
export type FenceType = (typeof FenceTypes)[number];

export type BlockRawData = {
  // id: BlockUid,
  name: string;
  direction: BlockDirection;
  type: BlockType;
  position_x: number;
  position_y: number;
  layer: number;

  min_floor: number;
  max_floor: number;

  left_flight?: FlightData;
  right_flight?: FlightData;
  middle_flight?: FlightData;
  is_middle_flight: boolean;

  has_balcony: boolean;
  has_roof: boolean;
  flood_floor: number | null;
  is_pipe: boolean;

  places: PlaceData[];

  floors_data?: {
    [floor_idx: number]: {
      passages_data?: PassagesData;
      fence_type?: FenceType;
      is_double?: boolean;
      flight_statuses?: {
        left_flight?: FlightStatus;
        right_flight?: FlightStatus;
        middle_flight?: FlightStatus;
      };
    };
  };
};

export type BlockData = {
  id: BlockUid;
} & BlockRawData;

interface DbBlockRow {
  id: BlockUid;
  data: BlockRawData; // в data лежит объект Block (без id, но id у нас дублируется)
  position_x: number;
  position_y: number;
  layer: number;
  updated_at: string;
}

export const useBlocksStore = defineStore("blocks", {
  state: () => {
    return {
      blocks: generateBlocks(500) as BlockData[],
      layer: 0,
      isEditing: false,
      loading: false,
      error: null,
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
    startEditing() {},
    async endEditing() {
      // отправить инфу об измененных блоках
      const promises = [];
      for (const id of this.editedBlocks) {
        const block = this.getBlock(id);
        if (!block) continue;
        promises.push(this.updateBlock(block));
      }
      this.editedBlocks.clear();
      return Promise.all(promises);
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
    async fetchBlocks() {
      this.loading = true;
      this.error = null;
      console.log("Loading blocks");
      try {
        const { data, error } = await supabase
          .from("blocks")
          .select("id, data, position_x, position_y, layer")
          .order("id", { ascending: true });

        if (error) throw error;

        // Превращаем строки БД в Block[], подставляя id в data
        this.blocks = (data as DbBlockRow[]).map((row) => ({
          id: row.id,

          ...row.data,
          position_x: row.position_x ?? 0,
          position_y: row.position_y ?? 0,
          layer: row.layer ?? 0,
          passages_data: { [0]: { up_left: "normal" } },
        }));
      } catch (err: any) {
        this.error = err.message;
        console.error("fetchBlocks error:", err);
      } finally {
        this.loading = false;
      }
      console.log("Loaded");
    },
    subscribeToBlocks() {
      const channel = supabase
        .channel("blocks-changes")
        .on(
          "postgres_changes",
          {
            event: "*", // INSERT, UPDATE, DELETE
            schema: "public",
            table: "blocks",
          },
          (payload: RealtimePostgresChangesPayload<DbBlockRow>) => {
            this.handleRealtimePayload(payload);
          },
        )
        .subscribe();

      // Возвращаем функцию отписки, чтобы использовать в onUnmounted
      return () => {
        supabase.removeChannel(channel);
      };
    },
    handleRealtimePayload(payload: RealtimePostgresChangesPayload<DbBlockRow>) {
      const { eventType, new: newRow, old } = payload;

      switch (eventType) {
        case "INSERT": {
          if (newRow) {
            const newBlock: BlockData = {
              id: newRow.id,
              ...newRow.data,
            };
            this.blocks.push(newBlock);
          }
          break;
        }
        case "UPDATE": {
          if (newRow) {
            const updatedBlock: BlockData = {
              id: newRow.id,
              ...newRow.data,
            };
            const index = this.blocks.findIndex((b) => b.id === updatedBlock.id);
            if (index !== -1) {
              this.blocks[index] = updatedBlock;
            } else {
              // может случиться, если блок не был загружен ранее (например, только что вставлен)
              this.blocks.push(updatedBlock);
            }
          }
          break;
        }
        case "DELETE": {
          if (old) {
            const oldId = old.id;
            this.blocks = this.blocks.filter((b) => b.id !== oldId);
          }
          break;
        }
      }
    },
    // Пример обновления блока (вызывать после локального редактирования)
    async updateBlock(updatedBlock: BlockData) {
      const { id, ...dataWithoutId } = updatedBlock;
      const { error } = await supabase
        .from("blocks")
        .update({
          data: dataWithoutId,
          position_x: updatedBlock.position_x,
          position_y: updatedBlock.position_y,
          layer: updatedBlock.layer,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("updateBlock error:", error);
        throw error;
      }
      // Не нужно обновлять локально, т.к. прилетит UPDATE через realtime
    },

    // Добавление нового блока
    async addBlock(blockWithoutId: Omit<BlockData, "id">) {
      const { data, error } = await supabase
        .from("blocks")
        .insert({
          data: blockWithoutId,
          position_x: blockWithoutId.position_x,
          position_y: blockWithoutId.position_y,
          layer: blockWithoutId.layer,
        })
        .select("id, data, position_x, position_y, layer")
        .single();

      if (error) throw error;
      // Блок добавится через realtime, но можно и сразу добавить локально
      // Возвращаем созданный блок для оптимистичного обновления
      return {
        id: data.id,
        ...data.data,
      } as BlockData;
    },

    // Удаление блока
    async deleteBlock(id: BlockUid) {
      const { error } = await supabase.from("blocks").delete().eq("id", id);
      if (error) throw error;
    },
  },
});
