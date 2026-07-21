<script lang="ts" setup>
import { computed } from "vue";

type PassageType = "noway" | "normal" | "stairs_up" | "stairs_down";
const props = defineProps<{
  direction: "horizontal" | "vertical";
  type?: PassageType;
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
}>();

const type = computed(() => props.type ?? "noway");

const emit = defineEmits<{
  (e: "click"): void;
}>();
</script>
<template>
  <div
    class="passage"
    v-bind:direction="direction"
    v-bind:type="type"
    v-bind:pass="type !== 'noway' || undefined"
    v-bind:up="up"
    v-bind:down="down"
    v-bind:left="left"
    v-bind:right="right"
    @click="() => emit('click')"
  >
    <div v-if="direction === 'vertical'" class="bg"></div>
  </div>
</template>
<style lang="scss" scoped>
// .passage {
//   outline: 2px solid black;
// }

.passage[direction="vertical"] {
  width: 50px;
  height: 100%;
}
.bg {
  width: 100%;
  height: 100%;
  background-color: var(--extra-color);
}
.passage[pass][up="true"] .bg {
  height: calc(100% + 10px);
}
.passage[pass][down="true"] .bg {
  height: calc(100% + 10px);
  margin-top: -10px;
}
.passage[type="noway"][left="true"] .bg {
  width: 60px;
  margin-right: -10px;
}

.passage[type="noway"][right="true"] .bg {
  width: 60px;
  margin-left: -10px;
}

.passage[type="noway"] .bg {
  background-color: var(--main-color);
}

.passage[type="noway"][left="false"][right="false"] .bg {
  width: 70px;
  margin-left: -10px;
  margin-right: -10px;
}

.passage[direction="horizontal"] {
  width: 120px;
  height: 100%;
  background-color: unset;
}
</style>
