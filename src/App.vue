<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useAuthorization } from "./stores/authorization.ts";
import View from "./views/View.vue";

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
@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap");
@import url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,700;1,700&display=swap");

@font-face {
  font-family: "Roboto";
  src: url("https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,700;1,700&display=swap");
  font-weight: 700;
  font-style: normal;
}

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
