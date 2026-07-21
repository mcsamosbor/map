<script setup lang="ts">
import Icon from "@/components/common/Icon.vue";
import Part from "../Part.vue";

defineProps<{ generator?: number; mail?: number }>();
</script>

<template>
  <Part class="block-info-part">
    <div class="gen-info">
      <Icon name="generator" :size="[28, 36]"></Icon>
      <span class="gen-floor">{{ generator }}</span>
    </div>
    <div class="mail-info">
      <Icon name="mail" :size="[32, 27]"></Icon>
      <span class="mail-floor">{{ mail }}</span>
    </div>
  </Part>
</template>
<style lang="scss">
.block-info-part {
  display: flex;
  flex-direction: column;
  gap: 15px;

  font-size: 32px;
  font-family: Roboto;
  font-weight: 600;
}

.gen-info {
  display: flex;
  flex-direction: row;
  gap: 10px;
  color: white;
}

.mail-info {
  display: flex;
  flex-direction: row;
  gap: 10px;
  color: white;
}
</style>
