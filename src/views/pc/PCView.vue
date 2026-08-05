<script setup lang="ts">
import MainCanvas from "@/components/canvas/MainCanvas.vue";
import MenuButton from "@/components/common/MenuButton.vue";
import { repoManager } from "@/main";
import { useAuthorization } from "@/stores/authorization";
import { useBlocksStore } from "@/stores/blocks";

const authorization = useAuthorization();
const blocksStore = useBlocksStore();
</script>

<template>
  <div class="pc-view">
    <div class="canvas-wrapper"><MainCanvas></MainCanvas></div>

    <div class="left-menu">
      <div class="menu-content">
        <div class="buttons">
          <MenuButton
            icon-name="user"
            :icon-size="[28, 28]"
            active
            @click="authorization.signInDiscord()"
          ></MenuButton>
          <MenuButton icon-name="info" :icon-size="[24, 24]" active></MenuButton>
          <a href="https://github.com/mcsamosbor/map">
            <MenuButton icon-name="github" :icon-size="[24, 24]" active></MenuButton>
          </a>
          <a href="https://discord.gg/XcrkVjrSUz">
            <MenuButton icon-name="discord" :icon-size="[24, 24]" active></MenuButton>
          </a>

          <MenuButton
            v-if="authorization.isEditor"
            icon-name="edit"
            :icon-size="[20, 20]"
            active
            :enabled="blocksStore.isEditing"
            @click="() => (blocksStore.isEditing = !blocksStore.isEditing)"
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
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.pc-view {
  display: flex;
  flex-direction: row;
  flex: 1;
  height: 100dvh;
}
.canvas-wrapper {
  display: flex;
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: 3;
}

.left-menu {
  display: flex;
  flex-direction: column;
  padding: 10px;
  z-index: 5;
}

.menu-content {
  display: flex;
  // flex: 1;
  border-radius: 10px;
  background-color: var(--bg-panel-background);
  padding: 10px;
  flex-direction: column;
}

.buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
}
</style>
