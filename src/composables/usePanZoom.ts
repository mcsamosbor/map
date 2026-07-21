// src/composables/usePanZoom.ts
import { ref, computed, type Ref } from "vue";

export interface PanZoomState {
  offsetX: Ref<number>;
  offsetY: Ref<number>;
  scale: Ref<number>;
}

export interface PanZoomOptions {
  minScale?: number;
  maxScale?: number;
  step?: number; // шаг изменения масштаба при колесике
}

export function usePanZoom(options: PanZoomOptions = {}) {
  const { minScale = 0.1, maxScale = 5, step = 0.1 } = options;

  const offsetX = ref(0);
  const offsetY = ref(0);
  const scale = ref(1);

  const clampScale = (value: number): number => Math.min(Math.max(value, minScale), maxScale);

  // ------------- МЫШЬ (панорамирование) -------------
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startOffsetX = 0;
  let startOffsetY = 0;

  const onMouseDown = (e: MouseEvent, container: HTMLElement) => {
    if (e.button !== 0) return;
    // Не перетаскиваем, если клик по дочернему элементу (слоту)
    const target = e.target as HTMLElement;
    if (target.closest(".canvas-content > *")) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startOffsetX = offsetX.value;
    startOffsetY = offsetY.value;

    const onMove = (ev: MouseEvent) => {
      if (!isDragging) return;
      offsetX.value = startOffsetX + (ev.clientX - startX);
      offsetY.value = startOffsetY + (ev.clientY - startY);
    };
    const onUp = () => {
      isDragging = false;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  // ------------- КОЛЕСИКО (зум) -------------
  const onWheel = (e: WheelEvent, container: HTMLElement) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -1 : 1; // направление
    const factor = 1.1; // или параметризуем
    const newScale = clampScale(scale.value * Math.pow(factor, delta));
    if (newScale === scale.value) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const ratio = newScale / scale.value;
    offsetX.value = mouseX - (mouseX - offsetX.value) * ratio;
    offsetY.value = mouseY - (mouseY - offsetY.value) * ratio;
    scale.value = newScale;
  };

  // ------------- TOUCH (панорамирование + пинч) -------------
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartOffsetX = 0;
  let touchStartOffsetY = 0;
  let isTouchDragging = false;

  let isPinching = false;
  let pinchInitialDistance = 0;
  let pinchInitialScale = 1;
  let pinchInitialOffsetX = 0;
  let pinchInitialOffsetY = 0;

  const getDistance = (t1: Touch, t2: Touch): number =>
    Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);

  const onTouchStart = (e: TouchEvent, container: HTMLElement) => {
    const touches = e.touches;
    if (touches.length === 1) {
      const touch = touches[0]!;
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target?.closest(".canvas-content > *")) return;

      isTouchDragging = true;
      isPinching = false;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartOffsetX = offsetX.value;
      touchStartOffsetY = offsetY.value;
    } else if (touches.length === 2) {
      isPinching = true;
      isTouchDragging = false;
      const t1 = touches[0]!;
      const t2 = touches[1]!;
      pinchInitialDistance = getDistance(t1, t2);
      pinchInitialScale = scale.value;
      pinchInitialOffsetX = offsetX.value;
      pinchInitialOffsetY = offsetY.value;
    }
  };

  const onTouchMove = (e: TouchEvent, container: HTMLElement) => {
    e.preventDefault();
    const touches = e.touches;

    if (touches.length === 1 && isTouchDragging) {
      const touch = touches[0]!;
      offsetX.value = touchStartOffsetX + (touch.clientX - touchStartX);
      offsetY.value = touchStartOffsetY + (touch.clientY - touchStartY);
    } else if (touches.length === 2 && isPinching) {
      const t1 = touches[0]!;
      const t2 = touches[1]!;
      const newDistance = getDistance(t1, t2);
      const ratio = newDistance / pinchInitialDistance;
      const newScale = clampScale(pinchInitialScale * ratio);
      if (newScale === scale.value) return;

      const rect = container.getBoundingClientRect();
      const centerX = (t1.clientX + t2.clientX) / 2 - rect.left;
      const centerY = (t1.clientY + t2.clientY) / 2 - rect.top;

      const scaleRatio = newScale / pinchInitialScale;
      offsetX.value = centerX - (centerX - pinchInitialOffsetX) * scaleRatio;
      offsetY.value = centerY - (centerY - pinchInitialOffsetY) * scaleRatio;
      scale.value = newScale;
    }
  };

  const onTouchEnd = (e: TouchEvent) => {
    const touches = e.touches;
    if (touches.length === 0) {
      isTouchDragging = false;
      isPinching = false;
    } else if (touches.length === 1 && isPinching) {
      // Переключаемся с пинча на панорамирование одним пальцем
      const touch = touches[0]!;
      isPinching = false;
      isTouchDragging = true;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartOffsetX = offsetX.value;
      touchStartOffsetY = offsetY.value;
    } else if (touches.length === 2 && isTouchDragging) {
      // Переключаемся с панорамирования на пинч
      const t1 = touches[0]!;
      const t2 = touches[1]!;
      isTouchDragging = false;
      isPinching = true;
      pinchInitialDistance = getDistance(t1, t2);
      pinchInitialScale = scale.value;
      pinchInitialOffsetX = offsetX.value;
      pinchInitialOffsetY = offsetY.value;
    }
  };

  // ------------- Методы управления -------------
  const zoomIn = (amount = step) => {
    const newScale = clampScale(scale.value + amount);
    if (newScale === scale.value) return;
    // Зум относительно центра контейнера (можно доработать)
    scale.value = newScale;
  };

  const zoomOut = (amount = step) => {
    zoomIn(-amount);
  };

  const resetView = () => {
    offsetX.value = 0;
    offsetY.value = 0;
    scale.value = 1;
  };

  // Экспортируем всё необходимое
  return {
    offsetX,
    offsetY,
    scale,
    onMouseDown,
    onWheel,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    zoomIn,
    zoomOut,
    resetView,
  };
}
