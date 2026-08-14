// stores/canvasContext.ts
import { defineStore } from "pinia";
import { ref } from "vue";

export const useCanvasContextStore = defineStore("canvasContext", () => {
  // Мировые координаты последнего клика по пустоте
  const worldPos = ref<{ x: number; y: number } | null>(null);
  // Экранные координаты клика (для позиционирования HTML‑меню)
  const screenPos = ref<{ x: number; y: number } | null>(null);
  // Флаг видимости контекстного меню (desktop)
  const contextMenuVisible = ref(false);
  // Флаг показа голубого крестика (мобильные)
  const crossVisible = ref(false);
  // Определяем, тач‑устройство или нет (можно переопределять)
  const isTouchDevice = ref("ontouchstart" in window || navigator.maxTouchPoints > 0);
  // Запрос на фокусировку камеры на блоке (без изменения зума)
  const focusRequest = ref<{ x: number; y: number; blockId?: number } | null>(null);

  function focusBlock(x: number, y: number, blockId?: number) {
    focusRequest.value = { x, y, blockId };
  }

  function showContextMenu(worldX: number, worldY: number, screenX: number, screenY: number) {
    worldPos.value = { x: worldX, y: worldY };
    screenPos.value = { x: screenX, y: screenY };
    contextMenuVisible.value = true;
    crossVisible.value = false; // убираем крестик, если был
  }

  function showCross(worldX: number, worldY: number) {
    worldPos.value = { x: worldX, y: worldY };
    crossVisible.value = true;
    contextMenuVisible.value = false;
  }

  function hideAll() {
    worldPos.value = null;
    screenPos.value = null;
    contextMenuVisible.value = false;
    crossVisible.value = false;
  }

  return {
    worldPos,
    screenPos,
    contextMenuVisible,
    crossVisible,
    isTouchDevice,
    focusRequest,
    focusBlock,
    showContextMenu,
    showCross,
    hideAll,
  };
});
