import { supabase } from "@/supabase";
import { defineStore } from "pinia";
import { useBlocksStore, type BlockData, type BlockUid, type PassagePosition } from "./blocks";
import { transitionPositions } from "@/const/rendering";
import { NestedMap3 } from "@/utils";

export type TransitionId = number;

export type DbTransitionRow = {
  id: TransitionId;
  from_block_id: BlockUid;
  to_block_id: BlockUid;
  from_floor: number;
  from_position: PassagePosition;
  to_floor: number;
  to_position: PassagePosition;
};

export type TransitionData = DbTransitionRow;

export const getTransitionsCell = (block: BlockData, passagePosition: PassagePosition) => {
  const blockX = block.position_x;
  const blockY = -block.position_y;
  const transitionPos = transitionPositions[passagePosition][block.direction];
  const transitionX = blockX * 2 + transitionPos[0];
  const transitionY = blockY * 2 + transitionPos[1];
  return [transitionX, transitionY] satisfies [number, number];
};

export const useTransitionsStore = defineStore("transitions", {
  state: () => {
    return {
      transitions: [] as TransitionData[],
      loading: false,
    };
  },
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
    addTransition(data: TransitionData) {
      this.transitions.push(data);
    },
    removeTransition(transitionId: TransitionId) {
      this.transitions = this.transitions.filter(({ id }) => id !== transitionId);
    },
    async fetchTransitions() {
      try {
        this.loading = true;
        const { data, error } = await supabase
          .from("transitions")
          .select(
            "id, from_block_id, to_block_id, from_floor, from_position, to_floor, to_position",
          )
          .order("id", { ascending: true });

        if (error) throw error;

        this.transitions = (data as DbTransitionRow[]).map((row) => ({
          ...row,
        }));
      } catch (err: any) {
        console.error("fetchBlocks error:", err);
      } finally {
        this.loading = false;
      }
    },
  },
});
