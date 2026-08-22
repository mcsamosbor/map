import {
  getDoubleFloors,
  displayFloorToIndex,
  type BlockData,
  type BlockType,
  getBlockPlaces,
  type SearchPlaceType,
  isPlaceType,
  getFloorDisplayBySlot,
  getStringByFloorDisplay,
} from "@/types/block";

/** Контекст поиска. В будущем здесь появится позиция пользователя/маршрута для ранжирования по расстоянию. */
export interface SearchContext {
  blocks: BlockData[];
  /** Текущий глобальный слой карты (blocksStore.layer). */
  layer: number;
}

/** Фильтры поиска по блокам. */
export interface BlockSearchFilters {
  blockTypes?: BlockType[];
  placeTypes?: SearchPlaceType[];
}

/** Результат поиска — блок + демонстрационный этаж, который показывается в списке. */
export interface BlockSearchResult {
  block: BlockData;
  /** Отображаемый этаж (с поддержкой двойных этажей, e.g. "7-8"). */
  displayFloor: string;
  /** Физический слот этажа для API карты (blocksStore.layer). */
  floorSlot: number;
  /** Численное значение этажа для сортировки по высоте. */
  // floorNumeric: number;
  /** Оценка релевантности (меньше — лучше). */
  score: number;
}

const MAX_RESULTS = 7;

/** Нормализация строки: нижний регистр, ё→е, без лишних пробелов. */
function normalize(str: string): string {
  return str.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
}

/**
 * Список вариантов имени места: каноническое имя, синонимы и
 * неофициальные названия, на которые пользователь может искать.
 */
export const PLACE_SEARCH_VARIANTS: Record<SearchPlaceType, readonly string[]> = {
  generator: ["генератор"],
  board: ["доска", "объявления", "инфодоска", "информационная доска", "инфо"],
  mail: ["почта", "почтовый ящик", "письмо"],
  liquidator: ["ликвидатор", "ликвид", "ликвидаторская", "ликвидаторная", "штаб ликвидаторов"],
  repairman: ["ремонтник", "ремонт", "ремонтная"],
  cleaner: ["уборщик", "клинер", "уборщица", "клининг"],
  plumber: ["завод", "сантехник", "плумбер", "водопроводчик", "трубопроводная"],
  theatre: ["театр", "театральная"],
  hospital: ["госпиталь", "больница", "медпункт", "лазарет", "хилка"],
  party: ["партийка", "кооператив", "клан"],
  laundry: ["стиралка", "прачка", "прачечная", "постирочная", "стирка"],
  shower: ["душ", "душевая", "душевка"],
  toilet: ["туалет", "сортир", "уборная", "толчок"],
  postal: ["почтамт", "отделение связи", "пост офис"],
  gym: ["спортзал", "качалка", "тренажёрка", "спорт"],
  overview: ["смотровая", "обзорная", "обзор", "надзорная"],
  racing: ["гонки", "автогонки", "рейсинг"],
  hockey: ["хоккей", "хоккейная"],
  spleef: ["сплиф", "снежки", "снежная арена"],
  pool: ["бассейн", "плескальня", "акватория"],
  warehouse: ["склад", "хранилище", "кладовка", "складская"],
  gallery: ["галерея", "выставка", "художественная"],
  roof: ["крыша", "кровля"],
  flood: ["затопление", "наводнение", "потоп", "водный"],
  balcony: ["балкон"],
};

/** Порядок отображения мест в результатах поиска. */
const PLACE_FAVORITES: SearchPlaceType[] = [
  "generator",
  "board",
  "mail",
  "liquidator",
  "repairman",
  "cleaner",
  "plumber",
  "theatre",
  "hospital",
  "party",
  "laundry",
  "shower",
  "toilet",
];

/** Загруженные синонимы мест (имя → тип). */
const placeAliases: Map<string, SearchPlaceType> = new Map();
let placeAliasesInitialized = false;
function initPlaceAliases() {
  if (placeAliasesInitialized) return;
  const entries = Object.entries(PLACE_SEARCH_VARIANTS) as [SearchPlaceType, readonly string[]][];
  for (const [type, variants] of entries) {
    for (const variant of variants) {
      const key = normalize(variant);
      placeAliases.set(key, type);
    }
  }
  placeAliasesInitialized = true;
}

/** Типы мест, реально присутствующие в блоке (включая характеристики roof/flood/balcony). */
export function getBlockSearchPlaceTypes(block: BlockData): SearchPlaceType[] {
  const found = new Set<SearchPlaceType>();
  for (const place of block.places ?? []) {
    found.add(place.type);
  }
  if (block.has_roof) found.add("roof");
  if (block.flood_floor != null) found.add("flood");
  if (block.has_balcony) found.add("balcony");
  return PLACE_FAVORITES.filter((type) => found.has(type)).concat(
    [...found].filter((type) => !PLACE_FAVORITES.includes(type)),
  );
}

/** Двойной этаж блока (например "7-8"). */
export function getDoubleFloor(block: BlockData): { display: string; numeric: number } | null {
  const doubles = getDoubleFloors(block);
  if (doubles.length === 0) return null;
  // В результатах показываем самый нижний двойной этаж
  const first = doubles[0]!;
  return { display: `${first}-${first + 1}`, numeric: first + 1 };
}

/** Демонстрационный этаж блока: приоритет двойному этажу. */
export function getDisplayFloor(block: BlockData): {
  display: string;
  numeric: number;
  slot: number;
} {
  const min = block.min_floor ?? 0;
  const double = getDoubleFloor(block);
  if (double) {
    return {
      display: double.display,
      numeric: double.numeric,
      slot: displayFloorToIndex(min, block) + 1,
    };
  }
  return { display: String(min), numeric: min, slot: displayFloorToIndex(min, block) };
}

/** Является ли блок жилым — получает небольшой буст в ранжировании. */
function isResidential(block: BlockData): boolean {
  return block.type === "residential";
}

function getDangerous(block: BlockData) {
  switch (block.type) {
    case "residential":
      return 0;
    case "destroyed":
      return 1;
    case "infected":
      return 2;
    case "frozen":
      return 3;
    case "mushroom":
      return 4;
  }
}

function isSearchable(block: BlockData): boolean {
  return true;
}

function getNameScore(name: string, query: SearchQuery): number {
  const queryText = (query.text || "").trim().toLowerCase();
  const nameText = (name || "").trim().toLowerCase();

  // Если запрос пуст — возвращаем 0 (нет критериев)
  if (queryText.length === 0) return 0;

  // Токенизация: извлекаем последовательности букв (включая русские) и цифр
  const tokenize = (s: string): string[] =>
    s.match(/[a-zа-яё0-9]+/gi)?.map((t) => t.toLowerCase()) ?? [];

  const nameTokens = tokenize(nameText);
  const queryTokens = tokenize(queryText);

  if (queryTokens.length === 0) return 0;
  if (nameTokens.length === 0) return 0;

  // Для каждого токена запроса проверяем, входит ли он как подстрока в какой-либо токен имени
  let matched = 0;
  for (const qToken of queryTokens) {
    const found = nameTokens.some((nToken) => nToken.includes(qToken));
    if (found) matched++;
  }

  // Оценка = доля найденных токенов запроса
  return matched / nameTokens.length;
}

export interface SearchQuery {
  text: string;
  // floor?: number;
  blockTypes?: BlockType[];
  placeTypes?: SearchPlaceType[];
}

/**
 * Поиск блоков по тексту, этажу и фильтрам.
 * Текст ищется по имени блока и синонимам мест; этаж — по отображаемым
 * этажам (с поддержкой двойных).
 *
 * Ранжирование: совпадение по имени > совпадение по месту > совпадение
 * по этажу; внутри — по положению. В будущем добавится ранжирование
 * по расстоянию от пользователя/маршрута.
 */
export function searchBlocks(context: SearchContext, query: SearchQuery): BlockSearchResult[] {
  initPlaceAliases();
  const text = normalize(query.text);
  const words = text.split(" ").filter(Boolean);
  // const floorFilter = query.floor;
  const blockTypeSet = new Set(query.blockTypes ?? []);
  const placeTypeSet = new Set(query.placeTypes ?? []);
  const queryPlaceTypes = [...placeTypeSet.values()];
  const hasPlaceFilter = placeTypeSet.size > 0;
  const anyWordIsFloor = words.some((w) => /^-?\d+$/.test(w));
  const results: BlockSearchResult[] = [];

  for (const block of context.blocks) {
    if (blockTypeSet.size > 0 && (!block.type || !blockTypeSet.has(block.type))) continue;
    if (!isSearchable(block)) continue;

    const blockPlaces = getBlockSearchPlaceTypes(block);

    if (hasPlaceFilter && !queryPlaceTypes.every((p) => blockPlaces.includes(p))) continue;

    const nameNorm = normalize(block.name ?? "");

    let score = 0;

    // Матчинг по тексту (слова запроса)
    for (const word of words) {
      if (/^-?\d+$/.test(word)) continue; // слово-этаж обрабатывается ниже
      const wordAlias = placeAliases.get(word);
      if (nameNorm.includes(word)) {
        score += 2;
      } else if (wordAlias && blockPlaces.includes(wordAlias)) {
        score += 3;
      } else {
        score += 100; // слово не найдено — блок нерелевантен
      }
    }

    // Матчинг по этажу
    const minFloor = block.min_floor ?? 0;
    const maxFloor = block.max_floor ?? minFloor;
    const doubles = getDoubleFloors(block);
    // Отображаемые этажи: непрерывный ряд от min до max, двойные занимают две соседние позиции
    const displayFloors: number[] = [];
    for (let f = minFloor; f <= maxFloor; f++) {
      displayFloors.push(f);
      if (doubles.includes(f)) displayFloors.push(f + 1);
    }

    let matchedFloor: number | null = null;

    // if (floorFilter !== undefined) {
    //   if (displayFloors.includes(floorFilter)) {
    //     matchedFloor = floorFilter;
    //   } else {
    //     continue;
    //   }
    // } else
    if (anyWordIsFloor) {
      const parsed = Number(
        words
          .slice()
          .reverse()
          .find((w) => /^-?\d+$/.test(w)),
      );
      if (displayFloors.includes(parsed)) {
        matchedFloor = parsed;
      } else {
        continue;
      }
    }

    let displayFloor: string;
    let floorSlot: number;
    if (matchedFloor !== null) {
      // Оформляем отображение: если этаж — верхняя часть пары, показываем "N-1-N"
      const isUpperPair = doubles.includes(matchedFloor - 1);
      const isLowerPair = doubles.includes(matchedFloor);
      displayFloor = isUpperPair
        ? `${matchedFloor - 1}-${matchedFloor}`
        : isLowerPair
          ? `${matchedFloor}-${matchedFloor + 1}`
          : String(matchedFloor);
      // Физический слот отображаемого этажа
      const minSlot = displayFloorToIndex(minFloor, block);
      const offset = displayFloors.indexOf(matchedFloor);
      floorSlot = minSlot + offset;
    } else {
      const display = getDisplayFloor(block);
      displayFloor = display.display;
      floorSlot = display.slot;
      matchedFloor = display.numeric;
    }

    // Жилые блоки получают небольшой буст
    if (isResidential(block)) score -= 2;

    const finalScore = rankResult(block, score, text);
    if (hasPlaceFilter) {
      for (const place of placeTypeSet.values()) {
        if (isPlaceType(place)) {
          const placesData = getBlockPlaces(block, place);

          placesData.forEach((data) => {
            const df = getFloorDisplayBySlot(data.floor, block);
            results.push({
              block,
              displayFloor: getStringByFloorDisplay(df),
              floorSlot: data.floor,
              score: finalScore,
            });
          });
        }
      }
    } else {
      const floorSlot = displayFloorToIndex(0, block);
      results.push({
        block,
        displayFloor: "0",
        floorSlot: floorSlot,
        score: finalScore,
      });
    }
  }

  results.sort(
    (a, b) =>
      a.score - b.score ||
      a.block.position_x - b.block.position_x ||
      a.block.position_y - b.block.position_y,
  );
  return results.slice(0, MAX_RESULTS);
}

/**
 * Доп-ранжирование: префикс имени даёт бонус. В будущем сюда добавится
 * сортировка по расстоянию от точки маршрута.
 */
export function rankResult(block: BlockData, score: number, queryNorm: string): number {
  const nameNorm = normalize(block.name ?? "");
  if (queryNorm && nameNorm.startsWith(queryNorm)) return score - 10;
  return score;
}
