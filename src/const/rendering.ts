import type { BlockDirection, BlockType, PassagePosition } from "@/stores/blocks";
import { type ColorSource } from "pixi.js";

export const CELL_SIZE = 380;
export const PART_SIZE = 120;
export const PASSAGE_WIDTH = 50;
export const GAP = 10;
export const PADDING = 25;
export const BLOCK_WIDTH = CELL_SIZE * 2 - 2 * PADDING;
export const BLOCK_HEIGHT = CELL_SIZE - 2 * PADDING;

export const getFloorSizes = (direction: BlockDirection) => {
  if (direction === "up" || direction === "down") {
    return [BLOCK_WIDTH, BLOCK_HEIGHT] as const;
  }
  return [BLOCK_HEIGHT, BLOCK_WIDTH] as const;
};

export const leftFlightPositions: { [dir in BlockDirection]: [number, number] } = {
  up: [0, 0],
  right: [1, 0],
  down: [3, 1],
  left: [0, 3],
} as const;
export const rightFlightPositions: { [dir in BlockDirection]: [number, number] } = {
  up: [3, 0],
  right: [1, 3],
  down: [0, 1],
  left: [0, 0],
} as const;

export const floorsPartPositions = {
  up: [0, 1],
  right: [0, 0],
  down: [3, 0],
  left: [1, 3],
} as const;

export const effectsPartPositions: { [dir in BlockDirection]: [number, number] } = {
  up: [3, 1],
  right: [0, 3],
  down: [0, 0],
  left: [1, 0],
} as const;

export const namePartPosition = [1, 0] as const;
export const infoPartPosition = [2, 0] as const;
export const professionsPartPosition = [1, 1] as const;
export const placesPartPosition = [2, 1] as const;

const zero_PassagePositions = {
  up: [0, 0],
  right: [2, 0],
  down: [6, 3],
  left: [0, 6],
} as const;

export const getPassageCells = (up: [number, number]) => {
  return {
    up,
    right: [
      zero_PassagePositions.right[0] - up[1],
      zero_PassagePositions.right[1] + up[0],
    ] satisfies [number, number],
    down: [
      zero_PassagePositions.down[0] - up[0],
      zero_PassagePositions.down[1] - up[1] - 1,
    ] satisfies [number, number],
    left: [zero_PassagePositions.left[0] + up[1], zero_PassagePositions.left[1] - up[0]] satisfies [
      number,
      number,
    ],
  };
};

export const passagePositions: {
  [pos in PassagePosition]: { [dir in BlockDirection]: [number, number] };
} = {
  up_left: getPassageCells([1, 0]),
  up_right: getPassageCells([5, 0]),
  down_right: getPassageCells([5, 2]),
  down_left: getPassageCells([1, 2]),
  left: getPassageCells([0, 1]),
  right: getPassageCells([5, 1]),
};

export const getPartPosition = (cellX: number, cellY: number): [number, number] => {
  const containerPadding = GAP;
  const gridSize = PART_SIZE + PASSAGE_WIDTH + 2 * GAP;
  return [containerPadding + cellX * gridSize, containerPadding + cellY * gridSize];
};
export const getPassagePosition = (cellX: number, cellY: number): [number, number] => {
  const containerPadding = GAP + PART_SIZE / 2;
  const gridSize = PART_SIZE / 2 + GAP + PASSAGE_WIDTH / 2;
  return [containerPadding + cellX * gridSize, containerPadding + cellY * gridSize];
};

export const isVertical = (direction: BlockDirection) => {
  return direction === "up" || direction === "down";
};

export const blockTypeColors: { [type in BlockType]: ColorSource } = {
  residential: "#00000000",
  frozen: "#0051FF",
  infected: "#FF0000",
  destroyed: "#EEFF00",
};

export const colors: { [letter: string]: { bg: ColorSource; main: ColorSource } } = {
  А: { bg: "#BD9EFF", main: "#9A76E7" },
  Б: { bg: "#FF9E9E", main: "#EB6B6B" },
  В: { bg: "#EAB27F", main: "#C1844D" },
  Г: { bg: "#BDC9E6", main: "#889DCF" },
  Д: { bg: "#8A609D", main: "#64367A" },
  Е: { bg: "#E4C1AD", main: "#CB9B7F" },
  Ж: { bg: "#79C0B4", main: "#4EAD9D" },
  З: { bg: "#9EE2FF", main: "#6AC3E9" },
  И: { bg: "#968F66", main: "#7D7843" },
  К: { bg: "#FA9B48", main: "#E3861B" },
  Л: { bg: "#9EA2FF", main: "#8388F4" },
  М: { bg: "#E69EFF", main: "#CD73ED" },
  Н: { bg: "#FF9ED8", main: "#E96EB7" },
  О: { bg: "#C09786", main: "#AA7762" },
  П: { bg: "#6E6E6E", main: "#585858" },
  Р: { bg: "#93AF6E", main: "#789A4E" },
  С: { bg: "#575FA8", main: "#353E87" },
  Т: { bg: "#6D949C", main: "#457681" },
  У: { bg: "#B5C35D", main: "#95A62D" },
  Ф: { bg: "#D4BACA", main: "#C696B3" },
  Х: { bg: "#D74851", main: "#BE2630" },
  Ц: { bg: "#65BD9D", main: "#43A682" },
  Ч: { bg: "#D99A4F", main: "#C38030" },
  Ш: { bg: "#A37A55", main: "#926237" },
  Щ: { bg: "#31D02E", main: "#07B903" },
  Ы: { bg: "#6C58BB", main: "#4832A1" },
  Ю: { bg: "#CD6597", main: "#B53974" },
  Э: { bg: "#689666", main: "#527D43" },
  Я: { bg: "#966666", main: "#7D4343" },
};
