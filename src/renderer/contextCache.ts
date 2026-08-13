import { GraphicsContext } from "pixi.js";
import type { ColorSource } from "pixi.js";

/**
 * Кеш GraphicsContext'ов.
 *
 * Главная цель: при смене слоя или при перестроении сцены не пересоздавать
 * геометрию заново, а переиспользовать готовые контексты. Graphics с одинаковым
 * контекстом шарят одну геометрию в GPU — различаются только трансформации.
 */

const rectContexts = new Map<string, GraphicsContext>();
const roundRectFillContexts = new Map<string, GraphicsContext>();
const roundRectStrokeContexts = new Map<string, GraphicsContext>();
const floorStaticContexts = new Map<string, GraphicsContext>();

const colorToKey = (color: ColorSource) => {
  if (typeof color === "number") return color.toString(16);
  return String(color);
};

/** Прямоугольник (0,0,w,h), залитый цветом. */
export const getRectContext = (
  width: number,
  height: number,
  color: ColorSource,
): GraphicsContext => {
  const key = `${width}x${height}:${colorToKey(color)}`;
  let context = rectContexts.get(key);
  if (!context) {
    context = new GraphicsContext().rect(0, 0, width, height).fill(color);
    rectContexts.set(key, context);
  }
  return context;
};

/** Скруглённый прямоугольник (0,0,w,h) с радиусом, залитый цветом. */
export const getRoundRectFillContext = (
  width: number,
  height: number,
  radius: number,
  color: ColorSource,
): GraphicsContext => {
  const key = `${width}x${height}:${radius}:${colorToKey(color)}`;
  let context = roundRectFillContexts.get(key);
  if (!context) {
    context = new GraphicsContext().roundRect(0, 0, width, height, radius).fill(color);
    roundRectFillContexts.set(key, context);
  }
  return context;
};

/** Скруглённый прямоугольник (0,0,w,h) с радиусом, только обводка. */
export const getRoundRectStrokeContext = (
  width: number,
  height: number,
  radius: number,
  strokeWidth: number,
  color: ColorSource,
): GraphicsContext => {
  const key = `${width}x${height}:${radius}:${strokeWidth}:${colorToKey(color)}`;
  let context = roundRectStrokeContexts.get(key);
  if (!context) {
    context = new GraphicsContext().roundRect(0, 0, width, height, radius).stroke({
      width: strokeWidth,
      color,
    });
    roundRectStrokeContexts.set(key, context);
  }
  return context;
};

/**
 * Получить (или собрать и закешировать) статичный «облик» этажа блока:
 * фон коридора, части, проходы, забор. Ключ описывает всё, от чего зависит
 * облик — направление, цвета, типы проходов, тип забора.
 */
export const getFloorStaticContext = (
  key: string,
  build: (context: GraphicsContext) => void,
): GraphicsContext => {
  let context = floorStaticContexts.get(key);
  if (!context) {
    context = new GraphicsContext();
    build(context);
    floorStaticContexts.set(key, context);
  }
  return context;
};

/** Очистить весь кеш (полезно при уничтожении рендерера). */
export const clearContextCache = () => {
  rectContexts.clear();
  roundRectFillContexts.clear();
  roundRectStrokeContexts.clear();
  floorStaticContexts.clear();
};
