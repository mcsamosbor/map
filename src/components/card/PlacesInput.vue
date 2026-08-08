<script setup lang="ts">
import type { PlaceData, PlaceType } from "@/types/block";
import Icon from "../common/Icon.vue";
import ValueInput from "./ValueInput.vue";
import { computed, reactive, watch } from "vue";
import Button from "./Button.vue";

const props = defineProps<{
  what: PlaceType;
  size: [number, number];
  enabled?: boolean;
}>();

const places = defineModel<PlaceData[]>();

const inputPlaces = reactive(new Map<PlaceData, string>());

const filteredItems = computed(() =>
  (places.value ?? [])
    .filter((item) => item.type === props.what)
    .map((item) => ({
      item,
      value: inputPlaces.get(item) ?? String(item.floor),
    })),
);

watch(
  places,
  (newPlaces) => {
    for (const key of inputPlaces.keys()) {
      if (!newPlaces?.includes(key)) {
        inputPlaces.delete(key);
      }
    }
    newPlaces?.forEach((item) => {
      inputPlaces.set(item, String(item.floor));
    });
  },
  { immediate: true },
);

const handleAdd = () => {
  const newPlace: PlaceData = { floor: 0, type: props.what };
  places.value = [...(places.value ?? []), newPlace];
};

const handleChange = (item: PlaceData, newValue: string | undefined) => {
  const raw = newValue ?? "";
  inputPlaces.set(item, raw);

  const num = parseInt(raw, 10);
  if (raw.trim() !== "" && !isNaN(num)) {
    const index = places.value?.indexOf(item);
    if (index !== undefined && index !== -1 && places.value) {
      const newItem: PlaceData = { ...item, floor: num };
      const newModel = [...places.value];
      newModel[index] = newItem;
      places.value = newModel;
    }
  }
};

const handleBlur = (item: PlaceData) => {
  const raw = inputPlaces.get(item) ?? "";
  if (raw.trim() === "") {
    places.value = places.value?.filter((p) => p !== item) ?? [];
  } else {
    const num = parseInt(raw, 10);
    if (isNaN(num)) {
      inputPlaces.set(item, String(item.floor));
    }
  }
};
</script>

<template>
  <div v-if="filteredItems.length > 0 || enabled" class="place-input">
    <Icon :name="what" :size="size" />
    <ValueInput
      v-for="({ item, value }, index) in filteredItems"
      :key="index"
      class="place-floor-input"
      v-bind:model-value="value?.toString()"
      @update:model-value="(newValue?: string) => handleChange(item, newValue)"
      :enabled="enabled"
      @blur="handleBlur(item)"
    />
    <Button v-if="enabled" :name="'plus'" :size="[9, 10]" @click="handleAdd"></Button>
  </div>
</template>

<style scoped lang="scss">
.place-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.place-floor-input {
  width: 32px;
  height: 20px;
}
</style>
