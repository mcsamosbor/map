import { transitionPositions } from "@/const/rendering";
import type { BlockUid, PassagePosition, BlockData } from "./block";

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
