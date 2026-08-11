<script lang="ts" setup>
import { IsSafePlace, type BlockData, type PassagePosition, type PlaceType } from "@/types/block";
import type { Graphics } from "pixi.js";
import { computed, shallowRef, watch } from "vue";
import Flight from "./BlockFlight.vue";
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
import Passage from "./BlockPassage.vue";
import Part from "./FloorPart.vue";
import MiddleFlight from "./MiddleFlight.vue";
import Fence from "./BlockFence.vue";
import { BoxShadowFilter } from "pixi-box-shadow";
import Icon from "./FloorIcon.vue";

import liquidatorIcon from "@/assets/icons/block/liquidator.svg?raw";
import repairmanIcon from "@/assets/icons/block/repairman.svg?raw";
import cleanerIcon from "@/assets/icons/block/cleaner.svg?raw";
import plumberIcon from "@/assets/icons/block/plumber.svg?raw";
import safeIcon from "@/assets/icons/block/safe.svg?raw";
import hospitalIcon from "@/assets/icons/block/hospital.svg?raw";
import theatreIcon from "@/assets/icons/block/theatre.svg?raw";
import partyIcon from "@/assets/icons/block/party.svg?raw";
import circleUpIcon from "@/assets/icons/block/circle_up.svg?raw";
import circleDownIcon from "@/assets/icons/block/circle_down.svg?raw";
import roofIcon from "@/assets/icons/block/roof.svg?raw";
import floodIcon from "@/assets/icons/block/flood.svg?raw";
import generatorIcon from "@/assets/icons/block/generator.svg?raw";
import boardIcon from "@/assets/icons/block/card/board.svg?raw";
import { useBlocksStore } from "@/stores/blocks";

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

const getFenceType = () => {
  return props.block.floors_data?.[props.floor]?.fence_type ?? "missing";
};

const blocksStore = useBlocksStore();

const changePassageType = (pos: PassagePosition) => {
  if (!blocksStore.isEditing) return;
  const floor = props.floor;
  blocksStore.changePassageType(props.block.id, floor, pos);
};

const changeFenceType = () => {
  if (!blocksStore.isEditing) return;
  const floor = props.floor;
  blocksStore.changeFenceType(props.block.id, floor);
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

const boxShadowFilter = shallowRef(
  new BoxShadowFilter({
    boxShadow: `0 0 20px 20px ${blockTypeColors[props.block.type ?? "residential"]}`,
    borderRadius: 10,
  }),
);

watch(
  () => props.block.type,
  (newType) => {
    const color = blockTypeColors[newType ?? "residential"];
    boxShadowFilter.value.boxShadow = `0 0 20px 20px ${color}`;
  },
);

const nameTextStyle = {
  fill: "white",
  fontSize: 36,
  fontWeight: "600",
  fontFamily: "Roboto",
} as const;
const floorTextStyle = computed(() => {
  return {
    fill: "white",
    fontSize: getSubFloor(props.floor) === undefined ? 36 : 28,
    fontWeight: "600",
    fontFamily: "Roboto",
  } as const;
});
const floorValueTextStyle = {
  fill: "white",
  fontSize: 34,
  fontWeight: "600",
  fontFamily: "Roboto",
} as const;

const rIcon = (path: string) => {
  return path.replaceAll(/currentColor/g, "#FFFFFF");
};

const hasPlace = (place: PlaceType) => {
  return props.block.places?.find(({ type }) => type === place) !== undefined;
};

const hasSafePlace = computed(() => {
  return props.block.places?.find(({ type }) => IsSafePlace(type)) !== undefined;
});

const getPlaceFloor = (place: PlaceType) => {
  return props.block.places?.find(({ type }) => type === place)?.floor;
};
</script>
<template>
  <Container :x="x" :y="y" @pointertap="emit('click')">
    <graphics @effect="drawBg">
      <Filter :is="boxShadowFilter"></Filter>
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
          :style="nameTextStyle"
        ></Text>
        <Text
          v-if="!block.is_pipe"
          :text="getFloorText(floor)"
          :anchor="{ x: 0.5, y: 0.5 }"
          :x="PART_SIZE / 2"
          :y="PART_SIZE / 2 + 25"
          :style="floorTextStyle"
        ></Text>
      </Container>
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(infoPartPosition, mainPartsShift)))"
      :color="mainColor"
    >
      <template v-if="!block.is_pipe">
        <Icon
          v-if="hasPlace('generator')"
          :path="rIcon(generatorIcon)"
          :size="34"
          :x="PART_SIZE / 4 + 5"
          :y="PART_SIZE / 4"
        ></Icon>
        <Text
          v-if="hasPlace('generator')"
          :text="String(getPlaceFloor('generator'))"
          :anchor="{ x: 0.5, y: 0.5 }"
          :x="(PART_SIZE * 3) / 4 - 5"
          :y="PART_SIZE / 4"
          :style="floorValueTextStyle"
        ></Text>
        <Icon
          v-if="hasPlace('board')"
          :path="rIcon(boardIcon)"
          :size="34"
          :x="PART_SIZE / 4 + 5"
          :y="(PART_SIZE * 3) / 4"
        ></Icon>
        <Text
          v-if="hasPlace('board')"
          :text="String(getPlaceFloor('board'))"
          :anchor="{ x: 0.5, y: 0.5 }"
          :x="(PART_SIZE * 3) / 4 - 5"
          :y="(PART_SIZE * 3) / 4"
          :style="floorValueTextStyle"
        ></Text>
      </template>
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(professionsPartPosition, mainPartsShift)))"
      :color="mainColor"
    >
      <template v-if="!block.is_pipe">
        <Icon
          v-if="hasPlace('liquidator')"
          :path="rIcon(liquidatorIcon)"
          :size="34"
          :x="PART_SIZE / 4"
          :y="PART_SIZE / 4"
        >
        </Icon>
        <Icon
          v-if="hasPlace('repairman')"
          :path="rIcon(repairmanIcon)"
          :size="34"
          :x="(PART_SIZE * 3) / 4"
          :y="PART_SIZE / 4"
        >
        </Icon>
        <Icon
          v-if="hasPlace('cleaner')"
          :path="rIcon(cleanerIcon)"
          :size="34"
          :x="PART_SIZE / 4"
          :y="(PART_SIZE * 3) / 4"
        >
        </Icon>
        <Icon
          v-if="hasPlace('plumber')"
          :path="rIcon(plumberIcon)"
          :size="34"
          :x="(PART_SIZE * 3) / 4"
          :y="(PART_SIZE * 3) / 4"
        ></Icon>
      </template>
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(placesPartPosition, mainPartsShift)))"
      :color="mainColor"
    >
      <template v-if="!block.is_pipe">
        <Icon
          v-if="hasSafePlace"
          :size="34"
          :path="rIcon(safeIcon)"
          :x="PART_SIZE / 4"
          :y="PART_SIZE / 4"
        ></Icon>
        <Icon
          v-if="hasPlace('hospital')"
          :path="rIcon(hospitalIcon)"
          :size="34"
          :x="(PART_SIZE * 3) / 4"
          :y="PART_SIZE / 4"
        >
        </Icon>
        <Icon
          v-if="hasPlace('theatre')"
          :path="rIcon(theatreIcon)"
          :size="34"
          :x="PART_SIZE / 4"
          :y="(PART_SIZE * 3) / 4"
        >
        </Icon>
        <Icon
          v-if="hasPlace('party')"
          :path="rIcon(partyIcon)"
          :size="34"
          :x="(PART_SIZE * 3) / 4"
          :y="(PART_SIZE * 3) / 4"
        ></Icon>
      </template>
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(floorsPartPositions[block.direction], [0, 0])))"
      :color="mainColor"
    >
      <template v-if="!block.is_pipe">
        <Icon
          v-if="block.max_floor !== undefined"
          :path="rIcon(circleUpIcon)"
          :size="34"
          :x="PART_SIZE / 4 + 5"
          :y="PART_SIZE / 4"
        ></Icon>
        <Text
          v-if="block.max_floor !== undefined"
          :text="String(block.max_floor)"
          :anchor="{ x: 0.5, y: 0.5 }"
          :x="(PART_SIZE * 3) / 4 - 5"
          :y="PART_SIZE / 4"
          :style="floorValueTextStyle"
        ></Text>
        <Icon
          v-if="block.min_floor !== undefined"
          :path="rIcon(circleDownIcon)"
          :size="34"
          :x="PART_SIZE / 4 + 5"
          :y="(PART_SIZE * 3) / 4"
        ></Icon>
        <Text
          v-if="block.min_floor !== undefined"
          :text="String(block.min_floor)"
          :anchor="{ x: 0.5, y: 0.5 }"
          :x="(PART_SIZE * 3) / 4 - 5"
          :y="(PART_SIZE * 3) / 4"
          :style="floorValueTextStyle"
        ></Text>
      </template>
    </Part>
    <Part
      v-bind="toPos(...getPartPosition(...vSum(effectsPartPositions[block.direction], [0, 0])))"
      :color="mainColor"
    >
      <template v-if="!block.is_pipe">
        <Icon
          v-if="block.has_roof"
          :path="rIcon(roofIcon)"
          :size="34"
          :x="PART_SIZE / 4 + 5"
          :y="PART_SIZE / 4"
        ></Icon>
        <Text
          v-if="block.has_roof"
          :text="String(block.max_floor ?? '')"
          :anchor="{ x: 0.5, y: 0.5 }"
          :x="(PART_SIZE * 3) / 4 - 5"
          :y="PART_SIZE / 4"
          :style="floorValueTextStyle"
        ></Text>
        <Icon
          v-if="block.flood_floor !== undefined && block.flood_floor !== null"
          :path="rIcon(floodIcon)"
          :size="34"
          :x="PART_SIZE / 4 + 5"
          :y="(PART_SIZE * 3) / 4"
        ></Icon>
        <Text
          v-if="block.flood_floor !== undefined && block.flood_floor !== null"
          :text="block.flood_floor"
          :anchor="{ x: 0.5, y: 0.5 }"
          :x="(PART_SIZE * 3) / 4 - 5"
          :y="(PART_SIZE * 3) / 4"
          :style="floorValueTextStyle"
        ></Text>
      </template>
    </Part>
    <Flight
      v-bind="toPos(...getPartPosition(...rightFlightPositions[block.direction]))"
      :data="block.is_middle_flight || block.is_pipe ? undefined : block.right_flight"
      :color="mainColor"
    ></Flight>
    <Graphics @effect="drawRow"></Graphics>
    <Fence :type="getFenceType()" :direction="block.direction" @click="changeFenceType"></Fence>
  </Container>
</template>
