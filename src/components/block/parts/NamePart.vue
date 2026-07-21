<script setup lang="ts">
import Part from "../Part.vue";

defineProps<{ name: string; floor: number; subindex?: number }>();

const subText = (subindex?: number) => {
  return subindex ? `/${subindex}` : "";
};
</script>

<template>
  <Part class="block-name-part">
    <span class="block-name">{{ name }}</span>
    <span class="current-floor">{{ `Эт. ${floor}${subText(subindex)}` }}</span>
  </Part>
</template>

<style lang="scss">
.block-name-part {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-family: Roboto;
  font-weight: 600;
  color: white;
}

.block-name {
  font-size: 36px;
}
.current-floor {
  font-size: 28px;
}
</style>
