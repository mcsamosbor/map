<script lang="ts" setup>
import { PART_SIZE } from "@/const/rendering";
import type { FlightData, FlightStatus, FlightType } from "@/stores/blocks";
import type { ColorSource, Graphics } from "pixi.js";
import Part from "./Part.vue";
import Icon from "./Icon.vue";
import { computed } from "vue";
import ladderIcon from "@/assets/icons/block/ladder.svg?raw";
import elevatorIcon from "@/assets/icons/block/elevator.svg?raw";
import stairsIcon from "@/assets/icons/block/stairs.svg?raw";

const props = defineProps<{
  data?: FlightData;
  color: ColorSource;
  x: number;
  y: number;
}>();

const drawBg = (graphics: Graphics) => {
  graphics.clear().rect(0, 0, PART_SIZE, PART_SIZE).fill(props.color);
};

const soloIconSize = 50;
const duoIconSize = 40;

const iconSize = computed(() =>
  props.data?.type === "ladder_elevator" ? duoIconSize : soloIconSize,
);

const rIcon = (path: string) => {
  return path.replace(/currentColor/, "#FFFFFF");
};
</script>
<template>
  <Part :x="x" :y="y" :color="color">
    <Container v-if="data">
      <Icon
        v-if="data.type === 'elevator'"
        :size="iconSize"
        :path="rIcon(elevatorIcon)"
        :x="PART_SIZE / 2"
        :y="PART_SIZE / 2"
      ></Icon>
      <template v-else-if="data.type === 'ladder_elevator'">
        <Icon
          :size="iconSize"
          :path="rIcon(elevatorIcon)"
          :x="PART_SIZE / 3 - 5"
          :y="PART_SIZE / 2"
        ></Icon>
        <Icon
          :size="iconSize"
          :path="rIcon(ladderIcon)"
          :x="(PART_SIZE / 3) * 2 + 5"
          :y="PART_SIZE / 2"
        ></Icon>
      </template>
      <Icon
        v-else
        :size="iconSize"
        :path="rIcon(stairsIcon)"
        :x="PART_SIZE / 2"
        :y="PART_SIZE / 2"
      ></Icon>
    </Container>
  </Part>
</template>
