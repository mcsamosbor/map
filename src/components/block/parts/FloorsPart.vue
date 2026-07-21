<script setup lang="ts">
import Icon from "@/components/common/Icon.vue";
import Part from "../Part.vue";

defineProps<{ max?: number; min?: number }>();
</script>

<template>
  <Part class="block-floors-part">
    <div class="max-info">
      <Icon name="mark_up" :size="[34, 34]"></Icon>
      <span class="max-floor">{{ max }}</span>
    </div>
    <div class="min-info">
      <Icon name="mark_down" :size="[34, 34]"></Icon>
      <span class="min-floor">{{ min }}</span>
    </div>
  </Part>
</template>
<style lang="scss">
.block-floors-part {
  display: flex;
  flex-direction: column;
  gap: 15px;

  font-size: 32px;
  font-family: Roboto;
  font-weight: 600;
}

.max-info {
  display: flex;
  flex-direction: row;
  gap: 10px;
  color: white;
}

.min-info {
  display: flex;
  flex-direction: row;
  gap: 10px;
  color: white;
}
</style>
