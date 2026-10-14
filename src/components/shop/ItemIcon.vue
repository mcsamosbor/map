<script lang="ts" setup>
/**
 * Иконка предмета: загруженная картинка (data URL PNG до 64×64),
 * которую загружают картографы. Если иконки нет — ничего не рендерится.
 */
defineProps<{
  icon?: string;
  size: [number, number];
}>();
</script>
<template>
  <img
    v-if="icon"
    class="item-icon-img"
    :src="icon"
    :width="size[0]"
    :height="size[1]"
    alt=""
    draggable="false"
  />
</template>
<style lang="scss" scoped>
.item-icon-img {
  flex: 0 0 auto;
  object-fit: contain;
  image-rendering: pixelated;
}
</style>
