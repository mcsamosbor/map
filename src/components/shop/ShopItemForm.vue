<script lang="ts" setup>
import { computed, ref } from "vue";
import Icon from "../common/Icon.vue";
import ValueInput from "../card/ValueInput.vue";
import ItemIcon from "./ItemIcon.vue";
import { useShopItemsStore } from "@/stores/shopItems";
import type { ItemData, NewItemData } from "@/types/item";
import { pluralize } from "@/utils";

const props = defineProps<{
  /** Редактируемый предмет; не задан — создаётся новый. */
  item?: ItemData;
}>();

const emit = defineEmits<{
  (e: "save", data: NewItemData): void;
  (e: "cancel"): void;
  (e: "delete"): void;
}>();

const shopItemsStore = useShopItemsStore();

const isEditingItem = computed(() => props.item !== undefined);

const name = ref(props.item?.name ?? "");
const count = ref(String(props.item?.count ?? 1));
const price = ref(String(props.item?.price ?? 1));
const icon = ref<string | undefined>(props.item?.icon);
const tags = ref<string[]>(props.item ? [...props.item.tags] : []);

const error = ref<string | null>(null);

// ---------- Иконка ----------

/** Максимальный размер иконки по каждой стороне; крупнее уменьшается автоматически. */
const MAX_ICON_SIZE = 64;
/** Максимальный размер загружаемого файла иконки. */
const MAX_ICON_FILE_SIZE = 5 * 1024 * 1024;
/** Принимаемые форматы — все перекодируются в PNG при загрузке. */
const ICON_ACCEPT_TYPES = "image/png,image/jpeg,image/webp,image/gif";

const fileInput = ref<HTMLInputElement | null>(null);
/** Перетаскивается ли файл на область иконки. */
const isDraggingIcon = ref(false);
/** Фактический размер текущей иконки (для подсказки). */
const iconSize = ref<{ width: number; height: number } | null>(null);

const openFilePicker = () => fileInput.value?.click();

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (e) => reject(e);
    console.log(src);
    image.src = src;
  });

/**
 * Перекодирует картинку в PNG data URL, ужимая до MAX_ICON_SIZE×MAX_ICON_SIZE.
 * Сглаживание выключено — пиксель-арт остаётся чётким.
 */
const encodeIcon = (
  image: HTMLImageElement,
): { dataUrl: string; width: number; height: number } => {
  const scale = Math.min(
    1,
    MAX_ICON_SIZE / image.naturalWidth,
    MAX_ICON_SIZE / image.naturalHeight,
  );
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Не удалось обработать изображение");
  context.imageSmoothingEnabled = false;
  context.drawImage(image, 0, 0, width, height);
  return { dataUrl: canvas.toDataURL("image/png"), width, height };
};

const isImageFile = (file: File): boolean =>
  file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(file.name);

const uploadIcon = async (file: File) => {
  error.value = null;
  if (!isImageFile(file)) {
    error.value = "Нужен файл изображения (PNG, JPEG, WebP или GIF)";
    return;
  }
  if (file.size > MAX_ICON_FILE_SIZE) {
    error.value = "Файл слишком большой — нужен размер до 5 МБ";
    return;
  }
  try {
    const image = await loadImage(await readFileAsDataUrl(file));
    const encoded = encodeIcon(image);
    icon.value = encoded.dataUrl;
    iconSize.value = { width: encoded.width, height: encoded.height };
  } catch (e) {
    console.log(e);
    error.value = "Не удалось прочитать изображение — попробуйте другой файл";
  }
};

const onFileSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  console.log(file);
  input.value = ""; // чтобы повторный выбор того же файла снова вызвал change
  if (file) await uploadIcon(file);
};

const onIconDrop = async (event: DragEvent) => {
  isDraggingIcon.value = false;
  const file = event.dataTransfer?.files?.[0];
  if (file) await uploadIcon(file);
};

const clearIcon = () => {
  icon.value = undefined;
  iconSize.value = null;
};

/** Подпись размера иконки («32×32»; «≤ 64×64», пока размер неизвестен). */
const iconSizeLabel = computed(() =>
  iconSize.value ? `${iconSize.value.width}×${iconSize.value.height}` : "≤ 64×64",
);

// Показываем размер иконки, которая уже есть у редактируемого предмета.
if (icon.value) {
  loadImage(icon.value)
    .then((image) => {
      iconSize.value = { width: image.naturalWidth, height: image.naturalHeight };
    })
    .catch(() => undefined);
}

// ---------- Теги ----------

const tagInput = ref("");

const addTagFromInput = () => {
  const tag = tagInput.value.trim();
  tagInput.value = "";
  if (!tag) return;
  if (!tags.value.includes(tag)) tags.value = [...tags.value, tag];
};

const toggleTag = (tag: string) => {
  tags.value = tags.value.includes(tag)
    ? tags.value.filter((t) => t !== tag)
    : [...tags.value, tag];
};

/** Словарь: теги, которых у предмета ещё нет (для быстрого выбора). */
const unusedTags = computed(() => shopItemsStore.allTags.filter((t) => !tags.value.includes(t)));

// ---------- Сохранение ----------

const parsePositiveInt = (raw: string): number | null => {
  const value = Number.parseInt(raw, 10);
  return Number.isNaN(value) || value <= 0 ? null : value;
};

const save = () => {
  error.value = null;
  const trimmedName = name.value.trim();
  if (!trimmedName) {
    error.value = "Укажите имя предмета";
    return;
  }
  const parsedCount = parsePositiveInt(count.value);
  const parsedPrice = parsePositiveInt(price.value);
  if (parsedCount === null || parsedPrice === null) {
    error.value = "Количество и цена должны быть положительными числами";
    return;
  }
  emit("save", {
    name: trimmedName,
    count: parsedCount,
    price: parsedPrice,
    icon: icon.value,
    tags: [...tags.value],
  });
};

// ---------- Удаление (с подтверждением) ----------

const isDeleteArmed = ref(false);
let deleteArmTimer: number | null = null;

const requestDelete = () => {
  if (!isDeleteArmed.value) {
    isDeleteArmed.value = true;
    deleteArmTimer = window.setTimeout(() => {
      isDeleteArmed.value = false;
      deleteArmTimer = null;
    }, 3000);
    return;
  }
  if (deleteArmTimer !== null) window.clearTimeout(deleteArmTimer);
  emit("delete");
};
</script>

<template>
  <div class="shop-item-form">
    <div class="form-header">
      <span class="form-title">{{
        isEditingItem ? "Редактирование предмета" : "Новый предмет"
      }}</span>
      <button type="button" class="form-close" title="Закрыть" @click="emit('cancel')">
        <Icon name="cross" :size="[12, 12]"></Icon>
      </button>
    </div>

    <div class="form-main">
      <button
        type="button"
        class="icon-picker"
        :class="{ filled: icon !== undefined, dragging: isDraggingIcon }"
        :title="
          icon
            ? 'Заменить иконку — можно перетащить файл'
            : 'Загрузить иконку — можно перетащить файл'
        "
        @click="openFilePicker"
        @dragover.prevent="isDraggingIcon = true"
        @dragleave.prevent="isDraggingIcon = false"
        @drop.prevent="onIconDrop"
      >
        <ItemIcon v-if="icon" :icon="icon" :size="[32, 32]"></ItemIcon>
        <Icon v-else name="plus" :size="[16, 16]"></Icon>
      </button>
      <input
        ref="fileInput"
        class="icon-file-input"
        type="file"
        :accept="ICON_ACCEPT_TYPES"
        @change="onFileSelected"
      />

      <div class="form-fields">
        <div class="form-field">
          <span class="form-label">Имя</span>
          <ValueInput class="form-name-input" v-model="name" :enabled="true"></ValueInput>
        </div>
        <div class="form-field">
          <span class="form-label">Продажа</span>
          <div class="sale-row">
            <ValueInput class="form-number-input" v-model="count" :enabled="true"></ValueInput>
            <span class="form-unit">шт за</span>
            <ValueInput class="form-number-input" v-model="price" :enabled="true"></ValueInput>
            <span class="form-unit">{{
              pluralize(Number.parseInt(price, 10) || 0, ["талон", "талона", "талонов"])
            }}</span>
          </div>
        </div>
        <div class="icon-hint">
          <template v-if="icon">
            <span>PNG {{ iconSizeLabel }}</span>
            <button type="button" class="link-button" @click="clearIcon">убрать</button>
          </template>
          <span v-else>PNG до 64×64, крупнее уменьшится</span>
        </div>
      </div>
    </div>

    <div class="form-field form-tags">
      <span class="form-label">Теги</span>
      <div v-if="tags.length > 0" class="tags-selected">
        <button
          v-for="tag in tags"
          :key="tag"
          type="button"
          class="tag-chip active"
          title="Убрать тег"
          @click="toggleTag(tag)"
        >
          {{ tag }} ×
        </button>
      </div>
      <div class="tags-add">
        <ValueInput
          class="tag-input"
          v-model="tagInput"
          :enabled="true"
          @keyup.enter="addTagFromInput"
        ></ValueInput>
        <button type="button" class="link-button" @click="addTagFromInput">+ тег</button>
      </div>
      <div v-if="unusedTags.length > 0" class="tags-unused">
        <button
          v-for="tag in unusedTags"
          :key="tag"
          type="button"
          class="tag-chip"
          @click="toggleTag(tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>

    <div v-if="error" class="form-error">{{ error }}</div>

    <div class="form-buttons">
      <button type="button" class="form-button primary" @click="save">
        {{ isEditingItem ? "Сохранить" : "Добавить" }}
      </button>
      <button type="button" class="form-button" @click="emit('cancel')">Отмена</button>
      <button
        v-if="isEditingItem"
        type="button"
        class="form-button danger"
        :class="{ armed: isDeleteArmed }"
        @click="requestDelete"
      >
        <Icon name="trash" :size="[14, 14]"></Icon>
        {{ isDeleteArmed ? "Точно удалить?" : "Удалить" }}
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.shop-item-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: thin;
  color: var(--str-button-font);
  font-family: Roboto;
  background-color: var(--bg-panel-background);
  border-radius: 8px;
  padding: 10px;
}

.form-header {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 0 0 auto;
}

.form-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--str-button-font-active);
}

.form-close {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  flex: 0 0 auto;
  border-radius: 5px;
  color: var(--str-button-font);

  &:hover {
    color: var(--str-button-font-active);
    background-color: var(--bg-button-color);
  }
}

.form-main {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  gap: 10px;
  flex: 0 0 auto;
}

.icon-picker {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  border-radius: 8px;
  background-color: var(--bg-button-color);
  border: 1px dashed var(--bg-icon-button);
  color: var(--str-button-font);

  &:hover,
  &.dragging {
    border-color: var(--str-button-font-active);
    color: var(--str-button-font-active);
    background-color: var(--bg-button-color-enabled);
  }

  &.filled {
    border-style: solid;
    border-color: transparent;
  }
}

.icon-file-input {
  display: none;
}

.form-fields {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 6px;
  flex: 1 1 auto;
  min-width: 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 0 0 auto;
}

.form-label {
  font-size: 11px;
  font-weight: 600;
  opacity: 0.7;
}

.form-name-input {
  height: 24px;
  font-size: 14px;
}

.sale-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
}

.form-number-input {
  width: 48px;
  height: 24px;
  flex: 0 0 auto;
  font-size: 14px;
}

.form-unit {
  flex: 0 0 auto;
  font-size: 12px;
  opacity: 0.8;
}

.icon-hint {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  opacity: 0.8;
}

.link-button {
  all: unset;
  cursor: pointer;
  font-size: 12px;
  color: var(--str-button-font-active);
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }
}

.form-tags {
  min-width: 0;
}

.tags-selected,
.tags-add,
.tags-unused {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.tags-unused {
  opacity: 0.8;
}

.tag-chip {
  all: unset;
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--str-button-font);
  background-color: var(--bg-button-color);
  white-space: nowrap;

  &:hover {
    color: var(--str-button-font-active);
  }

  &.active {
    color: var(--str-button-font-active);
    background-color: var(--bg-button-color-enabled);
  }
}

.tag-input {
  width: 110px;
  height: 24px;
  font-size: 13px;
}

.form-error {
  font-size: 12px;
  color: #ff8a8a;
  background-color: color-mix(in srgb, #d66060 15%, transparent);
  border-radius: 5px;
  padding: 4px 8px;
  flex: 0 0 auto;
}

.form-buttons {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.form-button {
  all: unset;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 5px;
  font-family: Roboto;
  font-size: 13px;
  font-weight: 600;
  color: var(--str-button-font);
  background-color: var(--bg-button-color);
  white-space: nowrap;

  &:hover {
    color: var(--str-button-font-active);
  }

  &.primary {
    color: var(--str-button-font-active);
    background-color: var(--bg-button-color-enabled);
  }

  &.danger {
    color: #d66060;
    margin-left: auto;

    &:hover {
      color: #ff8a8a;
    }

    &.armed {
      color: #ff8a8a;
      background-color: color-mix(in srgb, #d66060 25%, transparent);
    }
  }
}
</style>
