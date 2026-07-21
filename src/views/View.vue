<script lang="ts" setup>
import MobileView from "./mobile/MobileView.vue";
import PCView from "./pc/PCView.vue";

const isMobile = true;
</script>

<template>
  <MobileView v-if="isMobile"></MobileView>
  <PCView v-else></PCView>
</template>
