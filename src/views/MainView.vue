<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import MobileView from "./mobile/MobileView.vue";
import PCView from "./pc/PCView.vue";

const isMobile = ref(false);
let mediaQuery: MediaQueryList | null = null;

const handleChange = (e: MediaQueryListEvent) => {
  isMobile.value = e.matches;
};

onMounted(() => {
  mediaQuery = window.matchMedia("(max-width: 767px)");
  isMobile.value = mediaQuery.matches;
  mediaQuery.addEventListener("change", handleChange);
});

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener("change", handleChange);
});
</script>

<template>
  <MobileView v-if="isMobile"></MobileView>
  <PCView v-else></PCView>
</template>
