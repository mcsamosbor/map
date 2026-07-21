<script lang="ts" setup>
import { nextValue, PassageTypes, type BlockData, type PassagePosition } from "@/stores/blocks";
import type { Graphics } from "pixi.js";
import { computed } from "vue";
import Flight from "./Flight.vue";
import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  blockTypeColors,
  colors,
  effectsPartPositions,
  floorsPartPositions,
  GAP,
  getPartPosition,
  getPassageCells,
  infoPartPosition,
  leftFlightPositions,
  namePartPosition,
  PART_SIZE,
  PASSAGE_WIDTH,
  passagePositions,
  placesPartPosition,
  professionsPartPosition,
  rightFlightPositions,
} from "@/const/rendering.ts";
import Passage from "./Passage.vue";
import Part from "./Part.vue";
import MiddleFlight from "./MiddleFlight.vue";
import { BoxShadowFilter } from "pixi-box-shadow";

const props = defineProps<{ block: BlockData; floor: number; x?: number; y?: number }>();
const emit = defineEmits<{
  (e: "click"): void;
}>();

const isVertical = () => props.block.direction === "left" || props.block.direction === "right";

const blockWidth = () => (isVertical() ? BLOCK_HEIGHT : BLOCK_WIDTH);
const blockHeight = () => (isVertical() ? BLOCK_WIDTH : BLOCK_HEIGHT);

const drawBg = (graphics: Graphics) => {
  graphics.clear().roundRect(0, 0, blockWidth(), blockHeight(), 10).fill("#FFFFFF");
};
const toPos = (x: number, y: number) => {
  return { x, y };
};
const vSum = (pos1: readonly [number, number], pos2: readonly [number, number]) => {
  return [pos1[0] + pos2[0], pos1[1] + pos2[1]] satisfies [number, number];
};
const mainColor = computed(() => colors[props.block.name.charAt(0)]?.main ?? "#767676");
const bgColor = computed(() => colors[props.block.name.charAt(0)]?.bg ?? "#A8A8A8");

const getPassageType = (pos: PassagePosition) => {
  return props.block.floors_data?.[props.floor]?.passages_data?.[pos] ?? "noway";
};
const changePassageType = (pos: PassagePosition) => {
  console.log(pos);
  props.block.floors_data ??= {};
  const floor = props.floor;
  props.block.floors_data[floor] ??= {};
  props.block.floors_data[floor].passages_data ??= {};
  props.block.floors_data[floor].passages_data[pos] = nextValue(PassageTypes, getPassageType(pos));
};

const drawRow = (graphics: Graphics) => {
  const x = isVertical() ? 2 * GAP + PART_SIZE : GAP;
  const y = isVertical() ? GAP : 2 * GAP + PART_SIZE;
  const width = isVertical() ? PASSAGE_WIDTH : BLOCK_WIDTH - 2 * GAP;
  const height = isVertical() ? BLOCK_WIDTH - 2 * GAP : PASSAGE_WIDTH;
  graphics.clear().rect(x, y, width, height).fill(bgColor.value);
};

const mainPartsShift = computed(() => {
  if (isVertical()) return [-1, 1] as const;
  else return [0, 0] as const;
});

const isDoubleFloor = (floorIdx: number) => {
  return props.block.floors_data?.[floorIdx]?.is_double ?? false;
};

const getSubFloor = (floor: number) => {
  if (isDoubleFloor(floor)) return 1;
  const prevFloor = floor + (floor > 0 ? -1 : 1);
  if (isDoubleFloor(prevFloor)) return 2;
};

const getDisplayFloor = (blockData: BlockData, floorIdx: number) => {
  if (floorIdx === 0) return floorIdx;
  const doubleFloors = Object.entries(blockData.floors_data ?? {}).reduce<number>(
    (prevCount: number, [floor, floorData]) => {
      const parsedFloor = parseInt(floor);
      const isCurrentFloorPositive = floorIdx > 0;
      const isParsedFloorPositive = parsedFloor > 0;
      if (isCurrentFloorPositive !== isParsedFloorPositive) return prevCount;
      const isNeededFloor = floorIdx > 0 ? parsedFloor < floorIdx : parsedFloor > floorIdx;
      if (floorData.is_double && isNeededFloor) {
        return prevCount + 1;
      }
      return prevCount;
    },
    0,
  );
  return floorIdx + (floorIdx > 0 ? -1 : 1) * doubleFloors;
};

const getFloorText = (floor: number) => {
  const subFloor = getSubFloor(floor);
  const subText = subFloor ? `/${subFloor}` : "";
  return `Эт. ${getDisplayFloor(props.block, floor)}${subText}`;
};

const boxShadowFilter = computed(
  () =>
    new BoxShadowFilter({
      boxShadow: `0 0 20px 20px ${blockTypeColors[props.block.type]}`,
      borderRadius: 10,
    }),
);

const textStyle = { fill: "white", fontSize: 36, fontWeight: "600", fontFamily: "Roboto" } as const;
</script>
<template>
  <Container :x="x" :y="y" @pointertap="emit('click')">
    <graphics @effect="drawBg">
      <Filter v-if="block.type !== 'residential'" :is="boxShadowFilter"></Filter>
    </graphics>
    <Flight
      v-bind="toPos(...getPartPosition(...leftFlightPositions[block.direction]))"
      :data="block.is_middle_flight || block.is_pipe ? undefined : block.left_flight"
      :color="mainColor"
    ></Flight>
    <Passage
      :bg-color="bgColor"
      :main-color="mainColor"
      :pos="passagePositions['up_left'][block.direction]"
      :direction="block.direction"
      :up="true"
      :left="true"
      :type="getPassageType('up_left')"
      @click="changePassageType('up_left')"
    ></Passage>
    <Passage
      :bg-color="bgColor"
      :main-color="mainColor"
      :direction="block.direction"
      :pos="passagePositions['up_right'][block.direction]"
      :up="true"
      :right="true"
      :type="getPassageType('up_right')"
      @click="changePassageType('up_right')"
    ></Passage>
    <Passage
      :bg-color="bgColor"
      :main-color="mainColor"
      :direction="block.direction"
      :pos="passagePositions['down_right'][block.direction]"
      :down="true"
      :right="true"
      :type="getPassageType('down_right')"
      @click="changePassageType('down_right')"
    ></Passage>
    <Passage
      :bg-color="bgColor"
      :main-color="mainColor"
      :direction="block.direction"
      :pos="passagePositions['down_left'][block.direction]"
      :down="true"
      :left="true"
      :type="getPassageType('down_left')"
      @click="changePassageType('down_left')"
    ></Passage>
    <MiddleFlight
      :main-color="mainColor"
      :direction="block.direction"
      :pos="getPassageCells([3, 0])[block.direction]"
      :data="block.is_middle_flight && !block.is_pipe ? block.middle_flight : undefined"
    ></MiddleFlight>
    <MiddleFlight
      :main-color="mainColor"
      :direction="block.direction"
      :pos="getPassageCells([3, 2])[block.direction]"
    ></MiddleFlight>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(namePartPosition, mainPartsShift)))"
      :color="mainColor"
    >
      <Container>
        <Text
          :text="block.name"
          :anchor="{ x: 0.5, y: 0.5 }"
          :x="PART_SIZE / 2"
          :y="PART_SIZE / 2 - (block.is_pipe ? 0 : 25)"
          :style="textStyle"
        ></Text>
        <Text
          v-if="!block.is_pipe"
          :text="getFloorText(floor)"
          :anchor="{ x: 0.5, y: 0.5 }"
          :x="PART_SIZE / 2"
          :y="PART_SIZE / 2 + 25"
          :style="textStyle"
        ></Text>
      </Container>
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(infoPartPosition, mainPartsShift)))"
      :color="mainColor"
    >
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(professionsPartPosition, mainPartsShift)))"
      :color="mainColor"
    >
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(placesPartPosition, mainPartsShift)))"
      :color="mainColor"
    >
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(floorsPartPositions[block.direction], [0, 0])))"
      :color="mainColor"
    >
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(effectsPartPositions[block.direction], [0, 0])))"
      :color="mainColor"
    >
    </Part>
    <Flight
      v-bind="toPos(...getPartPosition(...rightFlightPositions[block.direction]))"
      :data="block.is_middle_flight || block.is_pipe ? undefined : block.right_flight"
      :color="mainColor"
    ></Flight>
    <Graphics @effect="drawRow"></Graphics>
  </Container>
</template>
