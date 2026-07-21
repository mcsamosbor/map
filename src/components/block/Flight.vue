<script setup lang="ts">
import type { FlightStatus, FlightType } from "@/stores/blocks.ts";
import Part from "./Part.vue";
import Icon from "../common/Icon.vue";
import { computed } from "vue";

const props = defineProps<{ type: FlightType; status?: FlightStatus }>();
const has_elevator = computed(() => props.type === "elevator" || props.type === "ladder_elevator");
</script>

<template>
  <div class="flight" :class="{ blocked: status === 'blocked' }">
    <Part>
      <Icon v-if="type === 'stairs'" name="stairs" :size="[60, 60]"></Icon>
      <Icon v-if="type === 'ladder_elevator'" name="ladder" :size="[40, 40]"></Icon>
      <Icon v-if="has_elevator" name="elevator" :size="[40, 40]"></Icon>
    </Part>
  </div>
</template>
<style lang="scss" scoped>
.flight {
  color: white;
}
</style>
<style lang="scss">
.flight.blocked .icon {
  opacity: 0.3;
}
</style>
