<script lang="ts" setup>
import MenuButton from "@/components/common/MenuButton.vue";
import ExpandableFooter from "./ExpandableFooter.vue";
import SearchInput from "@/components/common/SearchInput.vue";

import { useBlocksStore, type BlockUid } from "@/stores/blocks.ts";
import BlockCard from "@/components/card/BlockCard.vue";
import { useAuthorization } from "@/stores/authorization.ts";
import Canvas from "@/components/canvas/Canvas.vue";

const blocksStore = useBlocksStore();
const authorization = useAuthorization();
</script>

<template>
  <div class="mobile-view">
    <Canvas></Canvas>
    <ExpandableFooter>
      <div class="searches">
        <!-- результат поисков, плавает над канвасом но прицеплен к меню -->
      </div>
      <!-- тут поисковая строка и кнопки -->
      <div class="buttons">
        <MenuButton
          icon-name="user"
          :icon-size="[28, 28]"
          active
          @click="authorization.signInDiscord()"
        ></MenuButton>
        <MenuButton icon-name="info" :icon-size="[24, 24]" active></MenuButton>
        <MenuButton icon-name="github" :icon-size="[24, 24]" active></MenuButton>
        <MenuButton icon-name="discord" :icon-size="[24, 24]" active></MenuButton>
        <MenuButton
          v-if="authorization.isEditor"
          icon-name="edit"
          :icon-size="[20, 20]"
          active
          :enabled="blocksStore.isEditing"
          @click="() => (blocksStore.isEditing = !blocksStore.isEditing)"
        ></MenuButton>
        <!-- <MenuButton icon-name="profile"></MenuButton> -->
        <!-- тут основные кнопки: профиль, инфо, закладки -->
      </div>
      <SearchInput></SearchInput>
      <div class="extra-search-buttons">
        <!-- кнопки фильтры, видны если меню раскрыто -->
      </div>
      <BlockCard
        v-if="blocksStore.selectedBlockId"
        :block-id="blocksStore.selectedBlockId"
        @close="() => (blocksStore.selectedBlockId = undefined)"
      ></BlockCard>
    </ExpandableFooter>
  </div>
</template>

<style lang="scss" scoped>
.mobile-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100dvh; // важно для корректной работы процентных высот
}

.searches,
.buttons,
.search-bar,
.extra-search-buttons,
.block-card {
  width: 100%;
  // остальные стили по вашему усмотрению
}

.buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
}

// Дополнительно можно скрыть overflow для footer, если внутри много контента
.footer {
  overflow-y: auto;
}
</style>
