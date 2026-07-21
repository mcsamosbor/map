import { Graphics, GraphicsContext, type Path } from "pixi.js";

const iconsCache = new Map<string, GraphicsContext>();

export const getIconContext = (path: string) => {
  const cachedContext = iconsCache.get(path);
  if (cachedContext) return cachedContext;
  const graphics = new Graphics().svg(path);
  const context = graphics.context;
  iconsCache.set(path, context);
  return context;
};
