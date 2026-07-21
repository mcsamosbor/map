<script setup lang="ts">
import Icon from "@/components/common/Icon.vue";
import Part from "../Part.vue";

defineProps<{}>();
</script>

<template>
  <Part class="block-places-part">
    <div class="places-info">
      <Icon name="safe" :size="[34, 34]"></Icon>
      <Icon name="theatre" :size="[34, 34]"></Icon>
    </div>
    <div class="places-info">
      <Icon name="hospital" :size="[34, 34]"></Icon>
      <Icon name="party" :size="[34, 34]"></Icon>
    </div>
  </Part>
</template>
<style lang="scss">
.block-places-part {
  display: flex;
  flex-direction: column;
  gap: 26px;

  font-size: 32px;
  font-family: Roboto;
  font-weight: 600;
  color: white;
}

.places-info {
  display: flex;
  flex-direction: row;
  gap: 26px;
}
</style>
