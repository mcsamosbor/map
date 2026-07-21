<script setup lang="ts">
import AntiRotatable from "./AntiRotatable.vue";

defineProps<{ class?: string }>();
</script>

<template>
  <div class="part">
    <div class="part-background"></div>
    <AntiRotatable class="part" :class="class"><slot></slot></AntiRotatable>
  </div>
</template>
<style lang="scss" scoped>
.part {
  width: var(--part-size);
  height: var(--part-size);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.part-background {
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  background-color: var(--main-color);
}
</style>
