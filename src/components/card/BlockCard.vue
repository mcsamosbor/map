<script setup lang="ts">
import { computed, ref } from "vue";
import HeaderButton from "./HeaderButton.vue";
import ValueInput from "./ValueInput.vue";
import Icon from "../common/Icon.vue";
import Button from "./Button.vue";
import FlightDisplay from "./FlightDisplay.vue";
import PosComponent from "./PosComponent.vue";
import Checkbox from "./Checkbox.vue";
import Select from "./Select.vue";
import {
  BlockDirections,
  FlightTypes,
  nextValue,
  useBlocksStore,
  type BlockType,
  type BlockUid,
  type FlightData,
} from "@/stores/blocks.ts";
import { useAuthorization } from "@/stores/authorization.ts";
import PlaceInput from "./PlaceInput.vue";
import PlacesInput from "./PlacesInput.vue";

const blocksStore = useBlocksStore();
const blockData = computed(() => blocksStore.getBlock(props.blockId));

const isEditor = computed(() => authorization.isEditor);
const isEditing = ref(false);
const toggleEditing = () => {
  if (isEditing.value && blockData.value) {
    blocksStore.updateBlock(blockData.value);
  }
  isEditing.value = !isEditing.value;
};

const props = defineProps<{
  blockId: BlockUid;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const isDoubleFloor = computed({
  get: () => {
    return (
      blockData.value?.floors_data?.[blocksStore.layer - blockData.value.layer]?.is_double ?? false
    );
  },
  set: (newValue) => {
    if (!blockData.value || !isEditing.value) return;
    blockData.value.floors_data ??= {};
    const currentFloor = blocksStore.layer - blockData.value.layer;
    blockData.value.floors_data[currentFloor] ??= {};
    blockData.value.floors_data[currentFloor].is_double = newValue;
  },
});

const options: { label: string; value: BlockType }[] = [
  { label: "Жилой", value: "residential" },
  { label: "Разрушенный", value: "destroyed" },
  { label: "Мясной", value: "infected" },
  { label: "Ледяной", value: "frozen" },
];

const directionToDegree = {
  up: 0,
  right: 90,
  down: 180,
  left: 270,
} as const;
const changeRotation = () => {
  if (!blockData.value || !isEditing.value) return;
  const nextDir = nextValue(BlockDirections, blockData.value.direction);
  console.log(blockData.value.direction, nextDir);
  blockData.value.direction = nextDir;
};
const changePosition = (x: number, y: number) => {
  if (!blockData.value || !isEditing.value) return;
  blockData.value.position_x += x;
  blockData.value.position_y += y;
};

const authorization = useAuthorization();

const changeFlight = (what: "left_flight" | "right_flight") => {
  if (!blockData.value || !isEditing.value) return;
  blockData.value[what] ??= { type: "stairs", status: "free" };
  blockData.value[what].type = nextValue(FlightTypes, blockData.value[what].type);
};

const changeIsMiddleFlight = () => {
  if (!blockData.value || !isEditing.value) return;
  console.log(blockData.value.is_middle_flight);
  blockData.value.is_middle_flight = !blockData.value.is_middle_flight;
  blockData.value.middle_flight ??= {
    type: "stairs",
  };
};
</script>

<template>
  <div class="block-card" v-if="blockData">
    <div class="header-buttons">
      <HeaderButton name="shop" :size="[22.5, 20]"></HeaderButton>
      <HeaderButton
        v-if="isEditor"
        name="trash"
        :size="[20, 23]"
        :active="true"
        @click="blocksStore.deleteBlock(blockData.id)"
      ></HeaderButton>
      <HeaderButton
        v-if="isEditor"
        name="pen"
        :size="[20, 20]"
        :active="true"
        @click="() => toggleEditing()"
      ></HeaderButton>
      <HeaderButton
        name="cross"
        :size="[20, 20]"
        :active="true"
        @click="emit('close')"
      ></HeaderButton>
    </div>
    <span class="line"></span>
    <div class="short-info">
      <div class="info">
        <div class="main-info">
          <div class="block-name">
            <ValueInput
              v-model="blockData.name"
              class="block-name-input"
              :enabled="isEditing"
            ></ValueInput>
          </div>
          <div class="floors-info">
            <div class="max-floor">
              <Icon name="circle_up" :size="[18, 18]"></Icon>
              <div class="floor-input">
                <ValueInput v-model.number="blockData.max_floor" :enabled="isEditing"></ValueInput>
              </div>
            </div>
            <div class="min-floor">
              <Icon name="circle_down" :size="[18, 18]"></Icon>
              <div class="floor-input">
                <ValueInput v-model.number="blockData.min_floor" :enabled="isEditing"></ValueInput>
              </div>
            </div>
          </div>
        </div>
        <div class="flights-info">
          <div class="left-flight">
            <div class="left-flight-button">
              <Button
                v-show="isEditing"
                name="arrow_left"
                :size="[13.2, 22]"
                :enabled="isEditing"
                @click="changeIsMiddleFlight"
              ></Button>
            </div>
            <Icon :style="{ rotate: '-90deg' }" name="circle_up" :size="[18, 18]"></Icon>
            <FlightDisplay
              :type="blockData.left_flight?.type ?? 'ladder_elevator'"
              :enabled="isEditing"
              @click="changeFlight('left_flight')"
            ></FlightDisplay>
          </div>
          <div class="right-flight">
            <FlightDisplay
              :type="blockData.right_flight?.type ?? 'stairs'"
              :enabled="isEditing"
              @click="changeFlight('right_flight')"
            ></FlightDisplay>
            <Icon :style="{ rotate: '90deg' }" name="circle_up" :size="[18, 18]"></Icon>
            <div class="right-flight-button">
              <Button
                v-show="isEditing"
                name="arrow_left"
                :size="[13.2, 22]"
                :enabled="isEditing"
                @click="changeIsMiddleFlight"
                :icon-style="{ rotate: '180deg' }"
              ></Button>
            </div>
          </div>
        </div>
      </div>
      <span class="line vertical"></span>
      <div class="extra-buttons">
        <HeaderButton name="copy" :size="[18, 22]"></HeaderButton>
        <HeaderButton name="path" :size="[20, 20]"></HeaderButton>
      </div>
    </div>
    <span class="line"></span>
    <div class="structure-info" v-if="isEditor">
      <div class="position-info">
        <PosComponent label="X" :enabled="isEditing" v-model="blockData.position_x"></PosComponent>
        <PosComponent label="Y" :enabled="isEditing" v-model="blockData.position_y"></PosComponent>
        <PosComponent label="L" :enabled="isEditing" v-model="blockData.layer"></PosComponent>
      </div>
      <div class="rotation-info" :class="{ enabled: isEditing }">
        <div class="controller-row">
          <Icon name="circle_up" :size="[30, 30]" @click="changePosition(0, 1)"></Icon>
        </div>
        <div class="controller-row">
          <Icon
            name="circle_up"
            :size="[30, 30]"
            :style="{ rotate: '-90deg' }"
            @click="changePosition(-1, 0)"
          ></Icon>
          <Icon
            name="v_arrow"
            :size="[30, 30]"
            :style="{ rotate: `${directionToDegree[blockData.direction]}deg` }"
            @click="changeRotation"
          ></Icon>
          <Icon
            name="circle_up"
            :size="[30, 30]"
            :style="{ rotate: '90deg' }"
            @click="changePosition(1, 0)"
          ></Icon>
        </div>
        <div class="controller-row">
          <Icon
            name="circle_up"
            :size="[30, 30]"
            :style="{ rotate: '180deg' }"
            @click="changePosition(0, -1)"
          ></Icon>
        </div>
      </div>
      <div class="type-info">
        <div class="type-info-item">
          <Icon name="double_floor" :size="[30, 30]"></Icon>
          <Checkbox v-model="isDoubleFloor" :enabled="isEditing"></Checkbox>
        </div>
        <div class="type-info-item">
          <Icon name="pipe" :size="[30, 30]"></Icon>
          <Checkbox v-model="blockData.is_pipe" :enabled="isEditing"></Checkbox>
        </div>
      </div>
    </div>
    <span class="line" v-if="isEditor"></span>
    <div class="block-type-info">
      <span>Тип блока: </span>
      <Select
        v-model="blockData.type"
        :options="options"
        :enabled="isEditing"
        placeholder="Выберите..."
      />
    </div>
    <span class="line"></span>
    <div class="places-row">
      <PlaceInput
        :what="'generator'"
        :size="[14, 18]"
        v-model="blockData.places"
        :enabled="isEditing"
      ></PlaceInput>
      <PlaceInput
        :what="'board'"
        :size="[18, 18]"
        v-model="blockData.places"
        :enabled="isEditing"
      ></PlaceInput>
      <PlaceInput
        :what="'mail'"
        :size="[18, 16]"
        v-model="blockData.places"
        :enabled="isEditing"
      ></PlaceInput>
    </div>
    <span class="line"></span>
    <div class="places-row">
      <div class="place-input" v-if="blockData.has_roof || isEditing">
        <Icon :name="'roof'" :size="[18, 15]" />
        <Checkbox
          v-if="isEditing"
          v-model="blockData.has_roof"
          :enabled="isEditing"
          :mini="true"
        ></Checkbox>
        <ValueInput
          v-else
          class="place-floor-input"
          :model-value="blockData.has_roof ? blockData.max_floor : undefined"
        />
      </div>
      <div class="place-input" v-if="blockData.flood_floor || isEditing">
        <Icon :name="'flood'" :size="[18, 15]" />
        <ValueInput class="place-floor-input" :model-value="blockData.flood_floor" />
      </div>
      <div class="place-input" v-if="blockData.has_balcony || isEditing">
        <Icon :name="'balcony'" :size="[17, 18]"></Icon>
        <Checkbox
          v-if="isEditing"
          v-model="blockData.has_balcony"
          :enabled="isEditing"
          :mini="true"
        ></Checkbox>
      </div>
    </div>
    <span class="line"></span>
    <PlacesInput
      :what="'generator'"
      :size="[14, 18]"
      v-model="blockData.places"
      :enabled="isEditing"
    ></PlacesInput>
  </div>
</template>
<style lang="scss" scoped>
.block-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 15px;
  color: var(--str-button-font);
  font-family: Roboto;
}

.header-buttons {
  width: 100%;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.line {
  height: 2px;
  width: 100%;
  background-color: var(--bg-icon-button);
}
.line.vertical {
  width: 2px;
  height: 100%;
}

.short-info {
  display: flex;
  flex-direction: row;
  gap: 5px;
  width: 100%;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  justify-content: center;
  align-items: center;
}

.main-info {
  display: flex;
  flex-direction: row;
  gap: 6px;
}

.structure-info {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
}

.position-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
  justify-content: center;
}

.rotation-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
  align-items: center;
  color: var(--str-button-font);
  &.enabled {
    color: var(--str-button-font-active);
    cursor: pointer;
  }
}

.controller-row {
  display: flex;
  flex-direction: row;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.block-name {
  width: 152px;
  height: 51px;
  font-size: 44px;
}

.block-name-input {
  border-radius: 8px;
}

.floors-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.max-floor,
.min-floor {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 3px;
}

.floor-input {
  width: 32px;
  height: 20px;
  font-size: 18px;
}

.flights-info {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.left-flight-button,
.right-flight-button {
  width: 19px;
  height: 28px;
  display: flex;
}

.left-flight,
.right-flight {
  display: flex;
  gap: 5px;
}

.type-info {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  align-items: center;
}

.type-info-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.block-type-info {
  display: flex;
  flex-direction: row;
  gap: 5px;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.places-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-evenly;
}

.place-input {
  display: flex;
  align-items: center;
  gap: 5px;
}

.place-floor-input {
  width: 32px;
  height: 20px;
}
</style>
<style>
.places-row .icon {
  color: var(--str-button-font);
}
</style>
