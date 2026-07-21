<script setup lang="ts">
import Icon from "../common/Icon.vue";
import Button from "./Button.vue";
import ValueInput from "./ValueInput.vue";

const value = defineModel<number>();

const props = defineProps<{
  enabled?: boolean;
}>();

const changeValue = (delta: number) => {
  if (value.value != undefined) {
    value.value += delta;
  }
};
</script>

<template>
  <div class="arrow-input" v-show="true">
    <Button
      v-hide="!enabled"
      name="arrow_left"
      :size="[7, 12]"
      class="arrow-button"
      @click="changeValue(-1)"
    ></Button>
    <ValueInput v-model.number="value" class="input-field" :enabled="enabled"></ValueInput>
    <Button
      v-hide="!enabled"
      name="arrow_left"
      :size="[7, 12]"
      :style="{ rotate: '180deg' }"
      class="arrow-button"
      @click="changeValue(1)"
    ></Button>
  </div>
</template>
<style lang="scss" scoped>
.arrow-input {
  display: flex;
  flex-direction: row;
  gap: 2px;
  justify-content: center;
  align-items: center;
}
.arrow-button {
  width: 10px;
  height: 15px;
}
.input-field {
  width: 42px;
}
</style>
