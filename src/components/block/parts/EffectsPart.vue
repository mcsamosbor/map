<script setup lang="ts">
import Icon from "@/components/common/Icon.vue";
import Part from "../Part.vue";

defineProps<{ roof?: number; flood?: number }>();
</script>

<template>
  <Part class="block-effects-part">
    <div v-if="roof !== undefined" class="roof-info">
      <Icon name="roof" :size="[36, 30]"></Icon>
      <span class="info-floor">{{ roof }}</span>
    </div>
    <div v-if="flood !== undefined" class="flood-info">
      <Icon name="flood" :size="[34, 34]"></Icon>
      <span class="info-floor">{{ flood }}</span>
    </div>
  </Part>
</template>
<style lang="scss">
.block-effects-part {
  display: flex;
  flex-direction: column;
  gap: 15px;

  font-size: 32px;
  font-family: Roboto;
  font-weight: 600;
  color: white;
}

.roof-info,
.flood-info {
  display: flex;
  flex-direction: row;
  gap: 10px;
}
</style>
