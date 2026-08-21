<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useAuthorization } from "./stores/authorization.ts";
import View from "./views/MainView.vue";

const authorization = useAuthorization();
let unsubscribe: () => void;
onMounted(async () => {
  unsubscribe = await authorization.subscribe();
});

onUnmounted(() => {
  unsubscribe();
});
</script>

<template>
  <div class="content">
    <View></View>
  </div>
</template>

<style lang="scss" scoped>
.content {
  display: flex;
  background-color: #1e1e1e;
  flex-direction: column;
  position: fixed;
  width: 100%;
  height: 100%;

  * {
    box-sizing: border-box;
  }
}
</style>
<style lang="scss">
body {
  padding: 0;
  margin: 0;
}
// #app {
//   background-color: gray;
//   width: 100%;
//   height: 100%;
// }
</style>
