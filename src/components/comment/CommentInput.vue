<script setup lang="ts">
import { computed, ref } from "vue";
import Checkbox from "../card/Checkbox.vue";

withDefaults(
  defineProps<{
    placeholder?: string;
    submitLabel?: string;
  }>(),
  {
    placeholder: "Написать комментарий...",
    submitLabel: "Отправить",
  },
);

const emit = defineEmits<{
  (e: "submit", text: string, isTemporary: boolean): void;
  (e: "cancel"): void;
}>();

const text = ref("");
const temporary = ref(false);
const submitting = ref(false);
const canSubmit = computed(() => text.value.trim().length > 0 && !submitting.value);

const submit = async () => {
  if (!canSubmit.value) return;
  submitting.value = true;
  try {
    emit("submit", text.value.trim(), temporary.value);
    text.value = "";
    temporary.value = false;
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="comment-input">
    <textarea
      v-model="text"
      class="comment-textarea"
      :placeholder="placeholder"
      rows="3"
      @keydown.ctrl.enter.prevent="submit"
    ></textarea>
    <div class="input-actions">
      <label class="temporary" title="Временный комментарий скроется через 24 часа">
        <Checkbox v-model="temporary" :enabled="true" :mini="true"></Checkbox>
        <span class="temporary-label">временный</span>
      </label>
      <div class="buttons">
        <button type="button" class="cancel" @click="emit('cancel')">Отмена</button>
        <button type="button" class="submit" :disabled="!canSubmit" @click="submit">
          {{ submitLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.comment-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  font-family: Roboto;
}

.comment-textarea {
  width: 100%;
  min-height: 60px;
  max-height: 200px;
  resize: vertical;
  padding: 6px 8px;
  border-radius: 6px;
  border: none;
  background-color: var(--bg-button-color);
  color: var(--str-button-font);

  font-size: 14px;
  box-sizing: border-box;

  &::placeholder {
    color: var(--str-button-font);
    opacity: 0.5;
  }

  &:focus {
    outline: 1px solid var(--str-button-font-active);
  }
}

.input-actions {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.temporary {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;

  .temporary-label {
    font-size: 12px;
    color: var(--str-button-font);
    font-family: "Roboto";
  }
}

.buttons {
  display: flex;
  flex-direction: row;
  gap: 6px;
}

.cancel,
.submit {
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-family: Roboto;
  font-size: 12px;

  &.cancel {
    background-color: transparent;
    color: var(--str-button-font);
  }

  &.submit {
    background-color: var(--str-button-font-active);
    color: #1e1e1e;

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }
  }
}
</style>
