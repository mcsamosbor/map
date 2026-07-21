<script setup lang="ts">
import type { PlaceData, PlaceType } from "@/stores/blocks";
import Icon from "../common/Icon.vue";
import ValueInput from "./ValueInput.vue";
import { computed } from "vue";

const props = defineProps<{
  what: PlaceType;
  size: [number, number];
  enabled?: boolean;
}>();

const places = defineModel<PlaceData[]>();

const value = computed({
  get: () => {
    const place = places.value?.find((p) => p.type === props.what);
    return place?.floor;
  },
  set: (newValue: number | undefined | "") => {
    if (!places.value) return;
    console.log(newValue, places.value);
    const index = places.value.findIndex((p) => p.type === props.what);
    const exists = index !== -1;

    if (newValue !== undefined && newValue !== null && newValue !== "") {
      // Числовое значение задано – обновляем или добавляем запись
      const floor = Number(newValue);
      if (exists) {
        places.value[index]!.floor = floor;
      } else {
        places.value.push({ type: props.what, floor });
      }
    } else {
      // Значение пустое – удаляем запись, если она есть
      if (exists) {
        places.value.splice(index, 1);
      }
    }
  },
});
</script>

<template>
  <div class="place-input">
    <Icon :name="what" :size="size" />
    <ValueInput class="place-floor-input" v-model="value" :enabled="enabled" />
  </div>
</template>

<style scoped lang="scss">
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
