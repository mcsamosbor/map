<script lang="ts" setup>
import { computed, ref } from "vue";
import Icon from "../common/Icon.vue";
import ItemIcon from "./ItemIcon.vue";
import ShopItemForm from "./ShopItemForm.vue";
import TagFilter from "./TagFilter.vue";
import { useShopItemsStore } from "@/stores/shopItems";
import type { ItemData, ItemId, NewItemData } from "@/types/item";
import { pluralize } from "@/utils";

const shopItemsStore = useShopItemsStore();

/** Открыта ли форма добавления/редактирования предмета. */
const isFormOpen = ref(false);
/** Редактируемый предмет; null — создание нового. */
const editingItemId = ref<ItemId | null>(null);

const editingItem = computed<ItemData | undefined>(() =>
  editingItemId.value ? shopItemsStore.getItem(editingItemId.value) : undefined,
);

const openCreateForm = () => {
  editingItemId.value = null;
  isFormOpen.value = true;
};

const openEditForm = (item: ItemData) => {
  editingItemId.value = item.id;
  isFormOpen.value = true;
};

const closeForm = () => {
  isFormOpen.value = false;
  editingItemId.value = null;
};

const onSave = (data: NewItemData) => {
  if (editingItem.value) {
    shopItemsStore.changeItem({ ...editingItem.value, ...data });
  } else {
    shopItemsStore.addItem(data);
  }
  closeForm();
};

const onDelete = () => {
  if (editingItem.value) shopItemsStore.deleteItem(editingItem.value.id);
  closeForm();
};

/** Выбранные теги фильтра (показывается предмет с любым из выбранных тегов). */
const tagFilter = ref<string[]>([]);

const filteredItems = computed<ItemData[]>(() => {
  const filter = tagFilter.value;
  if (filter.length === 0) return shopItemsStore.items;
  return shopItemsStore.items.filter((item) => item.tags.some((tag) => filter.includes(tag)));
});

const talonWord = (price: number): string => pluralize(price, ["талон", "талона", "талонов"]);

/** Счётчик предметов в заголовке («5 предметов»). */
const itemsWord = computed(() =>
  pluralize(shopItemsStore.items.length, ["предмет", "предмета", "предметов"]),
);
</script>

<template>
  <div class="shop-items-settings">
    <div class="settings-header">
      <span class="settings-label">Предметы:</span>
      <span class="settings-count">{{ shopItemsStore.items.length }} {{ itemsWord }}</span>
      <span
        v-if="shopItemsStore.hasPendingChanges"
        class="settings-pending"
        title="Есть неотправленные изменения — они уйдут на сервер при выходе из режима редактирования"
        >●</span
      >
      <button type="button" class="settings-add" title="Добавить предмет" @click="openCreateForm">
        <Icon name="plus" :size="[16, 16]"></Icon>
      </button>
    </div>

    <ShopItemForm
      v-if="isFormOpen"
      :item="editingItem"
      @save="onSave"
      @cancel="closeForm"
      @delete="onDelete"
    ></ShopItemForm>

    <template v-else>
      <TagFilter v-model="tagFilter" :tags="shopItemsStore.allTags"></TagFilter>
      <div class="settings-list">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="settings-row"
          title="Редактировать предмет"
          @click="openEditForm(item)"
        >
          <div class="settings-row-icon">
            <ItemIcon :icon="item.icon" :size="[22, 22]"></ItemIcon>
          </div>
          <div class="settings-row-body">
            <div class="settings-row-line">
              <span class="settings-name" :title="item.name">{{ item.name }}</span>
              <span class="settings-price"
                >{{ item.count }}× — {{ item.price }} {{ talonWord(item.price) }}</span
              >
            </div>
            <div v-if="item.tags.length > 0" class="settings-row-tags">
              <span v-for="tag in item.tags" :key="tag" class="settings-tag">{{ tag }}</span>
            </div>
          </div>
          <Icon class="settings-row-edit" name="pen" :size="[14, 14]"></Icon>
        </div>

        <div v-if="filteredItems.length === 0" class="settings-empty">
          <template v-if="shopItemsStore.loading">Загрузка…</template>
          <template v-else-if="tagFilter.length > 0">
            <span>Ничего не найдено</span>
            <span class="settings-empty-hint">Снимите фильтр по тегам</span>
          </template>
          <template v-else>
            <span>Пока нет предметов</span>
            <span class="settings-empty-hint">Нажмите «+», чтобы добавить первый</span>
          </template>
        </div>
      </div>
    </template>

    <div v-if="shopItemsStore.error" class="settings-error">{{ shopItemsStore.error }}</div>
  </div>
</template>

<style lang="scss" scoped>
.shop-items-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  color: var(--str-button-font);
  font-family: Roboto;
}

.settings-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.settings-label {
  font-family: Roboto;
  font-size: 12px;
  color: var(--str-button-font);
  opacity: 0.7;
  margin-right: 2px;
  white-space: nowrap;
}

.settings-count {
  font-size: 12px;
  opacity: 0.7;
  white-space: nowrap;
}

.settings-pending {
  color: #d6a760;
  font-size: 12px;
  cursor: help;
}

.settings-add {
  all: unset;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 38px;
  flex: 0 0 auto;
  margin-left: auto;
  border: 1px solid transparent;
  border-radius: 10px;
  color: var(--str-button-font);
  background-color: var(--bg-button-color);

  &:hover {
    color: var(--bg-panel-background);
    background-color: var(--bg-icon-button-active);
    border-color: var(--bg-icon-button-active);
  }
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.settings-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
  flex: 0 0 auto;
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 6px 8px;
  background-color: var(--bg-button-color);

  &:hover {
    background-color: var(--bg-button-color-enabled);
    border-color: var(--bg-icon-button-active);

    .settings-row-edit {
      opacity: 1;
    }
  }
}

.settings-row-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  border-radius: 10px;
  background-color: var(--bg-panel-background);
}

.settings-row-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1 1 auto;
  min-width: 0;
}

.settings-row-line {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
}

.settings-name {
  flex: 1 1 auto;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.settings-price {
  flex: 0 0 auto;
  font-size: 12px;
  opacity: 0.8;
  white-space: nowrap;
}

.settings-row-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.settings-tag {
  padding: 1px 7px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: var(--str-button-font);
  background-color: var(--bg-panel-background);
  white-space: nowrap;
}

.settings-row-edit {
  flex: 0 0 auto;
  align-self: center;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.settings-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 12px 4px;
  font-size: 13px;
  opacity: 0.7;
  text-align: center;
}

.settings-empty-hint {
  font-size: 11px;
  opacity: 0.8;
}

.settings-error {
  font-size: 12px;
  color: #ff8a8a;
  background-color: color-mix(in srgb, #d66060 15%, transparent);
  border-radius: 5px;
  padding: 4px 8px;
}
</style>
