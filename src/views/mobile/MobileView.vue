<script lang="ts" setup>
import MenuButton from "@/components/common/MenuButton.vue";
import ExpandableFooter from "./ExpandableFooter.vue";
// import SearchInput from "@/components/common/SearchInput.vue";

import { useBlocksStore } from "@/stores/blocks.ts";
import { useTransitionsStore } from "@/stores/transitions";
import BlockCard from "@/components/card/BlockCard.vue";
import { useAuthorization } from "@/stores/authorization.ts";
import Canvas from "@/components/canvas/MainCanvas.vue";
import { repoManager } from "@/main.ts";

const blocksStore = useBlocksStore();
const transitionsStore = useTransitionsStore();
const authorization = useAuthorization();

const toggleGlobalEditing = async () => {
  blocksStore.isEditing = !blocksStore.isEditing;
  if (!blocksStore.isEditing) {
    // Выключаем режим общего редактирования — отправляем накопленные изменения на сервер
    await blocksStore.endEditing();
    await transitionsStore.flushPending();
  }
};

const closeCard = async () => {
  if (blocksStore.selectedBlockId) {
    await blocksStore.flushBlock(blocksStore.selectedBlockId);
  }
  blocksStore.selectedBlockId = undefined;
};
</script>

<template>
  <div class="mobile-view">
    <Canvas></Canvas>
    <ExpandableFooter>
      <!-- <div class="searches">
      </div> -->
      <!-- тут поисковая строка и кнопки -->
      <div class="buttons">
        <MenuButton
          icon-name="user"
          :icon-size="[28, 28]"
          active
          @click="authorization.signInDiscord()"
        ></MenuButton>
        <!-- <MenuButton icon-name="info" :icon-size="[24, 24]" active></MenuButton> -->
        <a href="https://github.com/mcsamosbor/map">
          <MenuButton icon-name="github" :icon-size="[24, 24]" active></MenuButton>
        </a>
        <a href="https://discord.gg/XcrkVjrSUz">
          <MenuButton icon-name="discord" :icon-size="[24, 24]" active></MenuButton>
        </a>
        <a href="https://www.donationalerts.com/r/apxutechtop" title="На развитие">
          <MenuButton icon-name="ruble" :icon-size="[24, 24]" active></MenuButton>
        </a>
        <MenuButton
          v-if="authorization.isEditor"
          icon-name="edit"
          :icon-size="[20, 20]"
          active
          :enabled="blocksStore.isEditing"
          @click="toggleGlobalEditing"
        ></MenuButton>
        <MenuButton
          v-if="authorization.isEditor"
          @click="() => repoManager.changeRepositories('mock')"
          >test</MenuButton
        >
        <MenuButton
          v-if="authorization.isEditor"
          @click="() => repoManager.changeRepositories('supabase')"
          >real</MenuButton
        >
        <!-- <MenuButton icon-name="profile"></MenuButton> -->
        <!-- тут основные кнопки: профиль, инфо, закладки -->
      </div>
      <!-- <SearchInput></SearchInput> -->
      <!-- <div class="extra-search-buttons">
      </div> -->
      <div v-if="authorization.logged" class="profile">
        <div class="user-description">
          <img class="avatar" :src="authorization.userAvatarUrl" />
          <span class="username">{{ authorization.username }}</span>
        </div>

        <MenuButton
          :icon-name="'logout'"
          :icon-size="[24, 24]"
          active
          @click="authorization.signOut"
        ></MenuButton>
      </div>
      <BlockCard
        v-if="blocksStore.selectedBlockId"
        :block-id="blocksStore.selectedBlockId"
        @close="closeCard"
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

.profile {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  background-color: var(--bg-button-color);
  padding: 5px;
  border-radius: 5px;
}
.user-description {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 100%;
}
.username {
  font-family: Roboto;
  font-weight: 700;
  font-size: 26px;
  color: var(--str-button-font);
}
</style>
