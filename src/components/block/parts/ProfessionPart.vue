<script setup lang="ts">
import Icon from "@/components/common/Icon.vue";
import Part from "../Part.vue";

defineProps<{}>();
</script>

<template>
  <Part class="block-professions-part">
    <div class="prof-info">
      <Icon name="repairmen" :size="[34, 34]"></Icon>
      <Icon name="cleaner" :size="[34, 34]"></Icon>
    </div>
    <div class="prof-info">
      <Icon name="liquidator" :size="[34, 34]"></Icon>
      <Icon name="plumber" :size="[34, 34]"></Icon>
    </div>
  </Part>
</template>
<style lang="scss">
.block-professions-part {
  display: flex;
  flex-direction: column;
  gap: 26px;

  font-size: 32px;
  font-family: Roboto;
  font-weight: 600;
  color: white;
}

.prof-info {
  display: flex;
  flex-direction: row;
  gap: 26px;
}
</style>
