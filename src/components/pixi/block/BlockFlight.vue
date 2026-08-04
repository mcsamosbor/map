<script lang="ts" setup>
import { PART_SIZE, rIcon } from "@/const/rendering";
import type { FlightData } from "@/types/block";
import type { ColorSource } from "pixi.js";
import Part from "./FloorPart.vue";
import Icon from "./FloorIcon.vue";
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

const soloIconSize = 50;
const duoIconSize = 40;

const iconSize = computed(() =>
  props.data?.type === "ladder_elevator" ? duoIconSize : soloIconSize,
);
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
