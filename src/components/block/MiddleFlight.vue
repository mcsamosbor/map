<script lang="ts" setup>
import Icon from "../common/Icon.vue";
import AntiRotatable from "./AntiRotatable.vue";

defineProps<{ up?: boolean; down?: boolean }>();
</script>
<template>
  <div class="middle-flight" v-bind:up="up ?? undefined" v-bind:down="down ?? undefined">
    <AntiRotatable><Icon :name="'stairs'" :size="[30, 30]"></Icon></AntiRotatable>
  </div>
</template>
<style lang="scss" scoped>
.middle-flight {
  width: 50px;
  height: 100%;
  background-color: var(--main-color);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
