<script lang="ts" setup>
import {
  nextValue,
  PassageTypes,
  useBlocksStore,
  type BlockData,
  type BlockUid,
  type PassagePosition,
} from "@/stores/blocks.ts";
import Flight from "./Flight.vue";
import MiddleFlight from "./MiddleFlight.vue";
import Part from "./Part.vue";
import Passage from "./Passage.vue";
import NamePart from "./parts/NamePart.vue";
import InfoPart from "./parts/InfoPart.vue";
import FloorsPart from "./parts/FloorsPart.vue";
import ProfessionPart from "./parts/ProfessionPart.vue";
import PlacesPart from "./parts/PlacesPart.vue";
import EffectsPart from "./parts/EffectsPart.vue";
import { computed } from "vue";

const props = defineProps<{ id: BlockUid; floor: number }>();

const blocksStore = useBlocksStore();
const block_data = blocksStore.getBlock(props.id)!;

const isMiddleFlight = block_data.is_middle_flight;
const leftFlightType = computed(() => block_data.left_flight?.type ?? "stairs");
const rightFlightType = computed(() => block_data.right_flight?.type ?? "stairs");
const roof_floor = block_data.has_roof ? block_data.max_floor : undefined;
const flood_floor = block_data.flood_floor ?? undefined;
const getPassageType = (pos: PassagePosition) => {
  return block_data.floors_data?.[props.floor]?.passages_data?.[pos];
};
const passageClick = (pos: PassagePosition) => {
  blocksStore.changePassageType(props.id, props.floor, pos);
};

const isDoubleFloor = (floorIdx: number) => {
  return block_data.floors_data?.[floorIdx]?.is_double ?? false;
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

const getSubFloor = (floor: number) => {
  if (isDoubleFloor(floor)) return 1;
  const prevFloor = floor + (floor > 0 ? -1 : 1);
  if (isDoubleFloor(prevFloor)) return 2;
};
</script>
<template>
  <div class="floor">
    <div class="row up-row">
      <Flight :type="leftFlightType" :status="block_data.left_flight?.status"></Flight>
      <Passage
        direction="vertical"
        up
        left
        :type="getPassageType('up_left')"
        @click="() => passageClick('up_left')"
      ></Passage>
      <NamePart
        :name="block_data.name"
        :floor="getDisplayFloor(block_data, floor)"
        :subindex="getSubFloor(floor)"
      ></NamePart>
      <MiddleFlight v-if="isMiddleFlight" up></MiddleFlight>
      <Passage v-else direction="vertical" up></Passage>
      <InfoPart :generator="1" :mail="2"></InfoPart>
      <Passage
        direction="vertical"
        up
        right
        :type="getPassageType('up_right')"
        @click="() => passageClick('up_right')"
      ></Passage>
      <Flight :type="rightFlightType" :status="block_data.right_flight?.status"></Flight>
    </div>
    <div class="row middle-row">
      <Passage direction="horizontal" left :type="getPassageType('left')"></Passage>
      <div class="crossroad left"></div>
      <div class="hallway left"></div>
      <div class="fence"></div>
      <div class="hallway right"></div>
      <div class="crossroad right"></div>
      <Passage direction="horizontal" left :type="getPassageType('right')"></Passage>
    </div>
    <div class="row bottom-row">
      <FloorsPart :min="block_data.min_floor" :max="block_data.max_floor"></FloorsPart>
      <Passage
        direction="vertical"
        down
        left
        :type="getPassageType('down_left')"
        @click="() => passageClick('down_left')"
      ></Passage>
      <ProfessionPart></ProfessionPart>
      <!-- <MiddleFlight v-if="isMiddleFlight" down></MiddleFlight> -->
      <Passage direction="vertical" down></Passage>
      <PlacesPart></PlacesPart>
      <Passage
        direction="vertical"
        down
        right
        :type="getPassageType('down_right')"
        @click="() => passageClick('down_right')"
      ></Passage>
      <EffectsPart :flood="flood_floor" :roof="roof_floor"></EffectsPart>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.floor {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: white;
  border-radius: 10px;
  padding: 10px;
  .row {
    display: flex;
    gap: 10px;
    flex-direction: row;
    width: calc(var(--cell-size) * 2 - 70px);
    height: var(--part-size);
    &.middle-row {
      height: 50px;
      background-color: var(--extra-color);
    }
  }
}
.crossroad {
  width: 50px;
  height: 100%;
}
.hallway {
  width: var(--part-size);
  height: 100%;
}
.fence {
  width: 50px;
  height: 100%;
}
</style>
