/**
 * Раскладка панелей кластеров на поле кластерного вида и маршрутизация
 * линий связей между ними.
 *
 * Раскладка:
 *  - панели разбиваются на компоненты связности по связям (общие блоки) и
 *    раскладываются независимо, а затем ставятся по сетке — разные группы
 *    кластеров не сбиваются в кучу;
 *  - внутри компоненты панели стартуют с сетки (уже без пересечений),
 *    связанные притягиваются силами с охлаждением;
 *  - финальный проход `separate` гарантирует зазор между любыми панелями.
 *
 * Маршрутизация линий: кандидаты (L-, Z-образные и обход мимо всех панелей)
 * оцениваются по числу пересечений с панелями и длине, выбирается лучший.
 * Алгоритмы детерминированы (без случайности).
 */

export type ClusterPanelSize = {
  width: number;
  height: number;
};

export type ClusterPanelRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ClusterPanelLink = {
  from: number;
  to: number;
};

export type Point = {
  x: number;
  y: number;
};

/** Минимальный зазор между панелями кластеров. */
export const CLUSTER_PANEL_GAP = 600;
/** Целевой зазор между границами связанных панелями (место для подписи). */
export const CLUSTER_LINK_LENGTH = 1600;

const FORCE_ITERATIONS = 200;
const SEPARATE_ITERATIONS = 300;
/** Штраф за пересечение линии с панелью (при выборе маршрута). */
const ROUTE_COLLISION_PENALTY = 100_000;

export const distance = (a: Point, b: Point): number =>
  Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

export const rectCenter = (rect: ClusterPanelRect): Point => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

/** Компоненты связности панелей по связям. */
const findComponents = (count: number, links: ClusterPanelLink[]): number[][] => {
  const adjacency: number[][] = Array.from({ length: count }, () => []);
  for (const link of links) {
    if (link.from === link.to) continue;
    adjacency[link.from]?.push(link.to);
    adjacency[link.to]?.push(link.from);
  }
  const componentOf = new Array<number>(count).fill(-1);
  const components: number[][] = [];
  for (let i = 0; i < count; i++) {
    if (componentOf[i] !== -1) continue;
    const id = components.length;
    const members: number[] = [];
    const stack = [i];
    componentOf[i] = id;
    while (stack.length > 0) {
      const node = stack.pop()!;
      members.push(node);
      for (const neighbor of adjacency[node] ?? []) {
        if (componentOf[neighbor] !== -1) continue;
        componentOf[neighbor] = id;
        stack.push(neighbor);
      }
    }
    components.push(members);
  }
  return components;
};

/** Обход компоненты в ширину от самой большой панели — стабильный порядок. */
const bfsOrder = (
  members: number[],
  links: ClusterPanelLink[],
  sizes: ClusterPanelSize[],
): number[] => {
  let start = members[0]!;
  for (const member of members) {
    const size = sizes[member]!;
    const best = sizes[start]!;
    if (size.width * size.height > best.width * best.height) start = member;
  }
  const inComponent = new Set(members);
  const visited = new Set<number>([start]);
  const order = [start];
  const queue = [start];
  while (queue.length > 0) {
    const node = queue.shift()!;
    for (const link of links) {
      const neighbor = link.from === node ? link.to : link.to === node ? link.from : -1;
      if (neighbor < 0 || !inComponent.has(neighbor) || visited.has(neighbor)) continue;
      visited.add(neighbor);
      order.push(neighbor);
      queue.push(neighbor);
    }
  }
  for (const member of members) {
    if (!visited.has(member)) order.push(member);
  }
  return order;
};

/**
 * Гарантированное разведение панелей: пока какая-то пара ближе `margin`,
 * панели отодвигаются друг от друга по оси наименьшего проникновения.
 */
const separate = (centers: Point[], sizes: ClusterPanelSize[], margin: number): void => {
  for (let iteration = 0; iteration < SEPARATE_ITERATIONS; iteration++) {
    let moved = false;
    for (let i = 0; i < centers.length; i++) {
      const a = centers[i]!;
      const sizeA = sizes[i]!;
      for (let j = i + 1; j < centers.length; j++) {
        const b = centers[j]!;
        const sizeB = sizes[j]!;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = (sizeA.width + sizeB.width) / 2 + margin - Math.abs(dx);
        const overlapY = (sizeA.height + sizeB.height) / 2 + margin - Math.abs(dy);
        if (overlapX <= 0 || overlapY <= 0) continue;
        moved = true;
        const signX = dx >= 0 ? 1 : -1;
        const signY = dy >= 0 ? 1 : -1;
        if (overlapX < overlapY) {
          const push = overlapX / 2 + 1;
          a.x -= signX * push;
          b.x += signX * push;
        } else {
          const push = overlapY / 2 + 1;
          a.y -= signY * push;
          b.y += signY * push;
        }
      }
    }
    if (!moved) break;
  }
};

/**
 * Раскладка одной компоненты: сеточная стартовая расстановка (без
 * пересечений), силы притяжения связанных панелей с охлаждением и
 * финальное разведение. Возвращает центры панелей с зазором `margin`
 * между любыми панелями, габарит нормирован к началу координат.
 */
const layoutComponent = (
  members: number[],
  links: ClusterPanelLink[],
  sizes: ClusterPanelSize[],
  margin: number,
): Map<number, Point> => {
  const order = bfsOrder(members, links, sizes);
  const localSizes = order.map((index) => sizes[index]!);
  const localIndex = new Map<number, number>();
  order.forEach((index, local) => localIndex.set(index, local));
  const localLinks: ClusterPanelLink[] = [];
  for (const link of links) {
    const from = localIndex.get(link.from);
    const to = localIndex.get(link.to);
    if (from === undefined || to === undefined) continue;
    localLinks.push({ from, to });
  }

  // Сеточная стартовая расстановка: сразу без пересечений
  const columns = Math.max(1, Math.ceil(Math.sqrt(order.length)));
  const cellWidth = Math.max(...localSizes.map((size) => size.width)) + margin;
  const cellHeight = Math.max(...localSizes.map((size) => size.height)) + margin;
  const centers: Point[] = localSizes.map((size, index) => ({
    x: (index % columns) * cellWidth + size.width / 2,
    y: Math.floor(index / columns) * cellHeight + size.height / 2,
  }));

  // Силы: связанные панели стремятся к зазору CLUSTER_LINK_LENGTH
  for (let iteration = 0; iteration < FORCE_ITERATIONS; iteration++) {
    const cool = 1 - iteration / FORCE_ITERATIONS;
    for (const link of localLinks) {
      const a = centers[link.from]!;
      const b = centers[link.to]!;
      const sizeA = localSizes[link.from]!;
      const sizeB = localSizes[link.to]!;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const gapX = Math.abs(dx) - (sizeA.width + sizeB.width) / 2;
      const gapY = Math.abs(dy) - (sizeA.height + sizeB.height) / 2;
      const currentGap = Math.max(gapX, gapY);
      const force = (currentGap - CLUSTER_LINK_LENGTH) * 0.06 * cool;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.x += fx;
      a.y += fy;
      b.x -= fx;
      b.y -= fy;
    }
    separate(centers, localSizes, margin);
  }
  separate(centers, localSizes, margin);

  // Нормализация габарита компоненты к началу координат
  let minX = Infinity;
  let minY = Infinity;
  centers.forEach((center, index) => {
    const size = localSizes[index]!;
    minX = Math.min(minX, center.x - size.width / 2);
    minY = Math.min(minY, center.y - size.height / 2);
  });
  const result = new Map<number, Point>();
  order.forEach((index, local) => {
    const center = centers[local]!;
    result.set(index, { x: center.x - minX, y: center.y - minY });
  });
  return result;
};

/**
 * Раскладка всех панелей кластеров.
 *
 * Панели разбиваются на компоненты связности (общие переходные блоки),
 * каждая раскладывается независимо и ставится в ячейку сетки компонент —
 * поэтому разные группы кластеров не сбиваются в кучу.
 * Итоговый габарит нормируется так, чтобы его центр был в начале координат.
 */
export const layoutClusters = (
  sizes: ClusterPanelSize[],
  links: ClusterPanelLink[],
  gap: number = CLUSTER_PANEL_GAP,
): ClusterPanelRect[] => {
  const count = sizes.length;
  if (count === 0) return [];

  const components = findComponents(count, links);
  const componentCenters = components.map((members) => layoutComponent(members, links, sizes, gap));

  // Пакуем компоненты по сетке: центры компонент не мешают друг другу
  const columns = Math.max(1, Math.ceil(Math.sqrt(components.length)));
  const componentOffset = new Map<number, Point>();
  let x = 0;
  let y = 0;
  let rowHeight = 0;
  components.forEach((members, componentIndex) => {
    let width = 0;
    let height = 0;
    for (const member of members) {
      const center = componentCenters[componentIndex]!.get(member)!;
      const size = sizes[member]!;
      width = Math.max(width, center.x + size.width / 2);
      height = Math.max(height, center.y + size.height / 2);
    }
    if (componentIndex % columns === 0 && componentIndex > 0) {
      x = 0;
      y += rowHeight + gap;
      rowHeight = 0;
    }
    componentOffset.set(componentIndex, { x, y });
    x += width + gap;
    rowHeight = Math.max(rowHeight, height);
  });

  const rects: ClusterPanelRect[] = new Array(count);
  components.forEach((members, componentIndex) => {
    const offset = componentOffset.get(componentIndex)!;
    for (const member of members) {
      const center = componentCenters[componentIndex]!.get(member)!;
      const size = sizes[member]!;
      rects[member] = {
        x: center.x + offset.x - size.width / 2,
        y: center.y + offset.y - size.height / 2,
        width: size.width,
        height: size.height,
      };
    }
  });

  // Нормализация: центр общего габарита — в начале координат
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of rects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }
  const shiftX = (minX + maxX) / 2;
  const shiftY = (minY + maxY) / 2;
  return rects.map((rect) => ({
    ...rect,
    x: rect.x - shiftX,
    y: rect.y - shiftY,
  }));
};

// ---- Маршрутизация линий связей ----

/** Точка пересечения границы панели с лучом от её центра к (tx, ty). */
export const panelBorderPoint = (rect: ClusterPanelRect, tx: number, ty: number): Point => {
  const center = rectCenter(rect);
  const dx = tx - center.x;
  const dy = ty - center.y;
  if (dx === 0 && dy === 0) return center;
  const sx = dx !== 0 ? rect.width / 2 / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? rect.height / 2 / Math.abs(dy) : Infinity;
  const scale = Math.min(sx, sy);
  return { x: center.x + dx * scale, y: center.y + dy * scale };
};

/** Точка на расстоянии `step` от центра панели наружу через `point`. */
const stepOutward = (point: Point, center: Point, step: number): Point => {
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: point.x + (dx / length) * step, y: point.y + (dy / length) * step };
};

const expandRect = (rect: ClusterPanelRect, margin: number): ClusterPanelRect => ({
  x: rect.x - margin,
  y: rect.y - margin,
  width: rect.width + 2 * margin,
  height: rect.height + 2 * margin,
});

/** Пересекает ли осевой отрезок a-b прямоугольник (для ломаных из осевых звеньев). */
const segmentHitsRect = (a: Point, b: Point, rect: ClusterPanelRect): boolean => {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return (
    maxX >= rect.x && minX <= rect.x + rect.width && maxY >= rect.y && minY <= rect.y + rect.height
  );
};

/** Убрать подряд идущие совпадающие точки. */
const dedupePoints = (points: Point[]): Point[] => {
  const result: Point[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (last && distance(last, point) < 1e-6) continue;
    result.push(point);
  }
  return result;
};

/** Точка на середине ломаной по длине — для подписи связи. */
const polylineMidpoint = (points: Point[]): Point => {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    total += distance(points[i]!, points[i + 1]!);
  }
  let walked = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const segment = distance(a, b);
    if (walked + segment >= total / 2) {
      const t = segment > 0 ? (total / 2 - walked) / segment : 0;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    walked += segment;
  }
  return points[0] ?? { x: 0, y: 0 };
};

export type ClusterLinkRoute = {
  /** Ломаная от границы одной панели до границы другой. */
  points: Point[];
  /** Позиция подписи (середина маршрута по длине). */
  label: Point;
};

/**
 * Маршрут линии связи между панелями: ломаная, которая не проходит
 * поверх панелей (по возможности). Кандидаты — L- и Z-образные маршруты
 * и обход мимо всех панелей; выбирается маршрут с наименьшим числом
 * пересечений с панелями, при равенстве — самый короткий.
 */
export const routeClusterLink = (
  fromRect: ClusterPanelRect,
  toRect: ClusterPanelRect,
  allRects: ClusterPanelRect[],
  clearance: number = CLUSTER_PANEL_GAP / 2,
): ClusterLinkRoute => {
  const fromCenter = rectCenter(fromRect);
  const toCenter = rectCenter(toRect);
  const start = panelBorderPoint(fromRect, toCenter.x, toCenter.y);
  const end = panelBorderPoint(toRect, fromCenter.x, fromCenter.y);

  // Сначала линия уходит от панелей наружу — вдоль самих панелей она не идёт
  const p1 = stepOutward(start, fromCenter, clearance);
  const p2 = stepOutward(end, toCenter, clearance);

  // Препятствия — все панели, кроме начальной и конечной
  const obstacles = allRects
    .filter((rect) => rect !== fromRect && rect !== toRect)
    .map((rect) => expandRect(rect, clearance * 0.5));

  // Габарит всех панелей — для маршрутов «вокруг»
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rect of allRects) {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  }

  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  const candidates: Point[][] = [
    [p1, { x: p2.x, y: p1.y }, p2],
    [p1, { x: p1.x, y: p2.y }, p2],
    [p1, { x: midX, y: p1.y }, { x: midX, y: p2.y }, p2],
    [p1, { x: p1.x, y: midY }, { x: p2.x, y: midY }, p2],
    [p1, { x: minX - clearance, y: p1.y }, { x: minX - clearance, y: p2.y }, p2],
    [p1, { x: maxX + clearance, y: p1.y }, { x: maxX + clearance, y: p2.y }, p2],
    [p1, { x: p1.x, y: minY - clearance }, { x: p2.x, y: minY - clearance }, p2],
    [p1, { x: p1.x, y: maxY + clearance }, { x: p2.x, y: maxY + clearance }, p2],
  ];

  let best = dedupePoints([start, p1, p2, end]);
  let bestScore = Infinity;
  for (const candidate of candidates) {
    const points = dedupePoints([start, ...candidate, end]);
    let length = 0;
    let collisions = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i]!;
      const b = points[i + 1]!;
      length += distance(a, b);
      for (const obstacle of obstacles) {
        if (segmentHitsRect(a, b, obstacle)) collisions += 1;
      }
    }
    const score = length + collisions * ROUTE_COLLISION_PENALTY;
    if (score < bestScore) {
      bestScore = score;
      best = points;
    }
  }
  return { points: best, label: polylineMidpoint(best) };
};
