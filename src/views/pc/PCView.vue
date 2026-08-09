<script setup lang="ts">
import MainCanvas from "@/components/canvas/MainCanvas.vue";
import BlockCard from "@/components/card/BlockCard.vue";
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
            :enabled="authorization.logged"
            @click="authorization.signInDiscord()"
          ></MenuButton>
          <!-- <MenuButton icon-name="info" :icon-size="[24, 24]" active></MenuButton> -->
          <a href="https://github.com/mcsamosbor/map">
            <MenuButton icon-name="github" :icon-size="[24, 24]" active></MenuButton>
          </a>
          <a href="https://discord.gg/XcrkVjrSUz">
            <MenuButton icon-name="discord" :icon-size="[24, 24]" active></MenuButton>
          </a>
          <a href="https://www.donationalerts.com/r/apxutechtop">
            <MenuButton icon-name="donation_alerts" :icon-size="[24, 24]" active></MenuButton>
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
        </div>
        <div v-if="authorization.logged" class="profile">
          <div class="user-description">
            <img class="avatar" :src="authorization.userAvatarUrl" />
            <span class="username">{{ authorization.username }}</span>
          </div>

          <MenuButton
            :icon-name="'cross'"
            :icon-size="[24, 24]"
            active
            @click="authorization.signOut"
          ></MenuButton>
        </div>
        <BlockCard
          v-if="blocksStore.selectedBlockId"
          :block-id="blocksStore.selectedBlockId"
          @close="() => (blocksStore.selectedBlockId = undefined)"
        ></BlockCard>
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
  flex: 0;
}

.menu-content {
  display: flex;
  // flex: 1;
  border-radius: 10px;
  background-color: var(--bg-panel-background);
  padding: 10px;
  gap: 10px;
  flex-direction: column;
  flex: 0;
}

.buttons {
  display: flex;
  flex-direction: row;
  gap: 10px;
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
