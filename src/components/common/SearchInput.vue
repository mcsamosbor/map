<script lang="ts" setup>
import { ref } from "vue";

const input = ref("");
</script>

<template>
  <div class="search-input">
    <input class="input-field" v-model="input" placeholder="Поиск" />
  </div>
</template>
<style lang="scss" scoped>
.search-input {
  // width: 100%;
  display: flex;
  align-items: center;
  height: 40px;
  background-color: #252525;
  border-radius: 10px;
  padding-left: 15px;
  padding-right: 15px;
  padding-top: 5px;
  padding-bottom: 5px;
}

.input-field {
  all: unset;
  font-family: "Roboto";
  font-size: 24px;
  font-weight: 600;
  color: #808080;
}
</style>
