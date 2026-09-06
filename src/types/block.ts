export const BlockDirections = ["up", "right", "down", "left"] as const;
export type BlockDirection = (typeof BlockDirections)[number];

export const BlockTypes = ["residential", "frozen", "infected", "destroyed", "mushroom"] as const;
export type BlockType = (typeof BlockTypes)[number];

export const FlightTypes = ["stairs", "elevator", "ladder_elevator"] as const;
export const FlightStatuses = ["free", "blocked"] as const;
export const FlightPositions = ["left_flight", "right_flight", "middle_flight"] as const;
export type FlightType = (typeof FlightTypes)[number];
export type FlightStatus = (typeof FlightStatuses)[number];
export type FlightPosition = (typeof FlightPositions)[number];
export type FlightData = {
  type: FlightType;
  status?: FlightStatus;
};

export const ProfessionPlaces = ["liquidator", "repairman", "cleaner", "plumber"] as const;
export const InfrastructurePlaces = ["generator", "board", "mail"] as const;
export const PlaceTypes = [
  "theatre",
  "hospital",
  "party",
  "gym",
  "laundry",
  "postal",
  "overview",
  "racing",
  "hockey",
  "spleef",
  "pool",
  "warehouse",
  "shower",
  "toilet",
  "gallery",
] as const;
export const AllPlaces = [...ProfessionPlaces, ...InfrastructurePlaces, ...PlaceTypes];

export type PlaceType =
  | (typeof ProfessionPlaces)[number]
  | (typeof PlaceTypes)[number]
  | (typeof InfrastructurePlaces)[number];

const placeTypeSet = new Set(AllPlaces);

/**
 * Характеристики блока, которые не являются PlaceType, но выводятся в
 * карточке и могут быть использованы как фильтры/иконки.
 */
export const BlockFeaturePlaces = ["roof", "flood", "balcony"] as const;
export type BlockFeaturePlace = (typeof BlockFeaturePlaces)[number];

/** Универсальный идентификатор места для фильтров и иконок. */
export type SearchPlaceType = PlaceType | BlockFeaturePlace;

export const isPlaceType = (value: SearchPlaceType): value is PlaceType => {
  return placeTypeSet.has(value as PlaceType);
};

export type PlaceData = {
  floor: number;
  type: PlaceType;
};

export const safePlaceTypes: PlaceType[] = [
  "theatre",
  "party",
  "gym",
  "overview",
  "gallery",
  "racing",
  "hockey",
  "spleef",
  "pool",
  "warehouse",
  "liquidator",
  "plumber",
] as const;

export const IsSafePlace = (place: PlaceType) => {
  return safePlaceTypes.includes(place);
};

export type BlockUid = number;

export const PassagePositions = [
  "up_left",
  "up_right",
  "right",
  "down_right",
  "down_left",
  "left",
] as const;
export type PassagePosition = (typeof PassagePositions)[number];
export const PassageTypes = ["noway", "normal", "stairs_up", "stairs_down"] as const;
export type PassageType = (typeof PassageTypes)[number];
export type PassagesData = { [position in PassagePosition]?: PassageType } | undefined;

export const FenceTypes = ["missing", "hole", "solid"] as const;
export type FenceType = (typeof FenceTypes)[number];

export type BlockRawData = {
  // id: BlockUid,
  name: string;
  direction: BlockDirection;
  type?: BlockType;
  position_x: number;
  position_y: number;
  layer: number;

  min_floor?: number;
  max_floor?: number;

  left_flight?: FlightData;
  right_flight?: FlightData;
  middle_flight?: FlightData;
  is_middle_flight?: boolean;

  has_balcony?: boolean;
  has_roof?: boolean;
  flood_floor?: number | null;
  is_pipe?: boolean;
  can_create_block?: boolean;

  places: PlaceData[];

  /**
   * Отображаемые этажи, у которых есть подэтаж `/2`.
   *
   * Это номера ОТОБРАЖАЕМЫХ этажей (не физические слоты), например
   * `double_floors: [0]` значит, что отображаемый этаж 0 представлен
   * подэтажами `0/1` и `0/2`.
   *
   * Хранить флаг по отображаемому этажу важно: если сделать двойным этаж
   * ниже, физические слоты выше сдвигаются, а отображаемые номера этажей
   * остаются теми же. Например, блок -3..5 с двойным 0 и затем двойным -3:
   *   двойные: [-3, 0]
   *   подписи слотов: -3/1, -3/2, -2, -1, 0/1, 0/2, 1, 2, 3, 4, 5
   */
  double_floors?: number[];

  /**
   * Отображаемые этажи, у которых есть подэтажи `/2` и `/3`.
   *
   * Это номера ОТОБРАЖАЕМЫХ этажей (не физические слоты), например
   * `triple_floors: [0]` значит, что отображаемый этаж 0 представлен
   * подэтажами `0/1`, `0/2` и `0/3`.
   *
   * Не пересекается с `double_floors`: отображаемый этаж либо обычный,
   * либо двойной, либо тройной. Тройной этаж добавляет два
   * дополнительных физических слота (подэтажи `/2` и `/3`).
   */
  triple_floors?: number[];

  floors_data?: {
    [floor_idx: number]: {
      passages_data?: PassagesData;
      fence_type?: FenceType;
      flight_statuses?: {
        left_flight?: FlightStatus;
        right_flight?: FlightStatus;
        middle_flight?: FlightStatus;
      };
    };
  };

  editor_info?: string;
};

export type BlockData = {
  id: BlockUid;
} & BlockRawData;

export interface DbBlockRow {
  id: BlockUid;
  data: BlockRawData; // в data лежит объект Block (без id, но id у нас дублируется)
  position_x: number;
  position_y: number;
  layer: number;
  updated_at: string;
}

export const validatePassage = (
  type: PassageType | undefined,
  position: PassagePosition,
): PassageType => {
  if (type !== undefined) return type;
  // Боковые проходы по умолчанию открыты, угловые — закрыты.
  if (position === "left" || position === "right") return "normal";
  return "noway";
};

/**
 * Модель высоких этажей (двойных и тройных).
 *
 * `min_floor` и `max_floor` — это ОТОБРАЖАЕМЫЕ этажи (нижний и верхний).
 * Физические слоты блока идут снизу вверх, начиная с `min_floor` (нижний
 * слот). Отображаемый этаж `N` может занимать:
 *   - 1 физический слот (обычный этаж, подпись `N`);
 *   - 2 физических слота (двойной этаж, подписи `N/1`, `N/2`);
 *   - 3 физических слота (тройной этаж, подписи `N/1`, `N/2`, `N/3`).
 * Каждый дополнительный подэтаж добавляет один физический слот, поэтому
 * ряд отображаемых этажей остаётся непрерывным.
 *
 * Высокие этажи хранятся списками ОТОБРАЖАЕМЫХ номеров:
 *   - `double_floors` — этажи с двумя подэтажами, например `[0]` для `0/1`, `0/2`;
 *   - `triple_floors` — этажи с тремя подэтажами, например `[0]` для `0/1`, `0/2`, `0/3`;
 * списки не пересекаются. `floors_data` (проходы, заборы, статусы) по-прежнему
 * индексируется ФИЗИЧЕСКИМИ слотами.
 *
 * Для любого слота `s` выполняется:
 *   display(s) = s - Σ (высота(d) - 1) по высоким отображаемым этажам d,
 *                первые слоты которых лежат строго ниже display(s)
 * (двойной этаж сдвигает на один слот, тройной — на два).
 *
 * Верхний физический слот блока = `max_floor + Σ (высота(d) - 1)` по
 * высоким этажам d из диапазона [min_floor, max_floor].
 *
 * Примеры:
 *   min=2 max=4, double_floors=[3]                    -> слоты 2,3,4,5   -> подписи 2, 3/1, 3/2, 4
 *   min=2 max=4, triple_floors=[3]                    -> слоты 2..6      -> подписи 2, 3/1, 3/2, 3/3, 4
 *   min=-6 max=-4, double_floors=[-5]                 -> слоты -6..-3    -> подписи -6, -5/1, -5/2, -4
 *   min=-2 max=1, double_floors=[0]                   -> слоты -2..2     -> подписи -2, -1, 0/1, 0/2, 1
 *   min=-3 max=5, double_floors=[-3, 0]               -> слоты -3..7     -> подписи -3/1, -3/2, -2, -1, 0/1, 0/2, 1, 2, 3, 4, 5
 *   min=0 max=3, triple_floors=[1]                    -> слоты 0..5      -> подписи 0, 1/1, 1/2, 1/3, 2, 3
 */

/** Количество физических слотов (подэтажей), занимаемых отображаемым этажом. */
export const FloorHeights = [1, 2, 3] as const;
export type FloorHeight = (typeof FloorHeights)[number];

export type FloorDisplay = {
  floor: number;
  /** Номер подэтажа в составе этажа: `1`..`высота этажа` (1 — обычный этаж). */
  sub?: 1 | 2 | 3;
};

/** Высокий (многослотовый) отображаемый этаж блока. */
export type ExtendedFloor = {
  floor: number;
  /** Количество занимаемых физических слотов: 2 (двойной) или 3 (тройной). */
  height: 2 | 3;
};

/**
 * Высокие отображаемые этажи блока: двойные и тройные.
 * Список отсортирован по возрастанию номера этажа; дубликаты исключены
 * (при конфликте между списками приоритет у тройного этажа).
 */
export const getExtendedFloors = (block: BlockData): ExtendedFloor[] => {
  const heights = new Map<number, 2 | 3>();
  for (const floor of block.double_floors ?? []) heights.set(floor, 2);
  for (const floor of block.triple_floors ?? []) heights.set(floor, 3);
  return [...heights.entries()]
    .map(([floor, height]) => ({ floor, height }))
    .sort((a, b) => a.floor - b.floor);
};

/**
 * Высота отображаемого этажа — количество занимаемых физических слотов
 * (подэтажей): 1 (обычный), 2 (двойной) или 3 (тройной).
 */
export const getFloorHeight = (block: BlockData, displayFloor: number): FloorHeight => {
  if (block.triple_floors?.includes(displayFloor)) return 3;
  if (block.double_floors?.includes(displayFloor)) return 2;
  return 1;
};

/** Количество дополнительных физических слотов, добавляемых высокими этажами. */
const getExtendedSlots = (extended: ExtendedFloor[]): number =>
  extended.reduce((acc, e) => acc + e.height - 1, 0);

/**
 * Физический слот подэтажа `N/1` отображаемого этажа `N`.
 * Каждый высокий этаж ниже `N` (двойной или тройной) сдвигает слот вверх
 * на `height - 1` позиций.
 */
const getFirstSlotOfDisplayFloor = (block: BlockData, displayFloor: number): number => {
  const min = getMinFloorSlot(block);
  const extendedBelow = getExtendedFloors(block).filter(
    (e) => e.floor >= min && e.floor < displayFloor,
  );
  return displayFloor + getExtendedSlots(extendedBelow);
};

/**
 * Нижний (первый) физический слот блока.
 * Совпадает с `min_floor`, т.к. высокие этажи добавляют слоты только выше себя.
 */
export const getMinFloorSlot = (block: BlockData): number => block.min_floor ?? 0;

/**
 * Верхний (последний) физический слот блока.
 * `max_floor` — это верхний ОТОБРАЖАЕМЫЙ этаж. Каждый высокий отображаемый
 * этаж в диапазоне [min_floor, max_floor] (двойной или тройной) добавляет
 * `height - 1` дополнительных физических слотов (двойной — один, тройной — два).
 */
export const getMaxFloorSlot = (block: BlockData): number => {
  const max = block.max_floor ?? 0;
  const min = block.min_floor ?? max;
  const extendedInRange = getExtendedFloors(block).filter((e) => e.floor >= min && e.floor <= max);
  return max + getExtendedSlots(extendedInRange);
};

/**
 * Проверяет виден ли блок на указанном слое
 * @param block данные блока
 * @param layer слой карты
 * @returns
 */
export const isBlockVisible = (block: BlockData, layer: number) => {
  const floor = layer - block.layer;
  return floor >= getMinFloorSlot(block) && floor <= getMaxFloorSlot(block);
};

/**
 * Отображаемый этаж по физическому слоту (с учётом подэтажей `/1`..`/высота`).
 */
export const getFloorDisplayBySlot = (slot: number, block: BlockData): FloorDisplay => {
  const min = getMinFloorSlot(block);
  const max = block.max_floor ?? min;
  const extendedInRange = getExtendedFloors(block).filter((e) => e.floor >= min && e.floor <= max);

  for (const e of extendedInRange) {
    const start = getFirstSlotOfDisplayFloor(block, e.floor);
    const sub = slot - start + 1;
    if (sub >= 1 && sub <= e.height) {
      return { floor: e.floor, sub: sub as 1 | 2 | 3 };
    }
  }

  const extendedBelow = extendedInRange.filter(
    (e) => getFirstSlotOfDisplayFloor(block, e.floor) < slot,
  );
  return { floor: slot - getExtendedSlots(extendedBelow) };
};

export const getStringByFloorDisplay = (display: FloorDisplay) => {
  const sub = display.sub ? `/${display.sub}` : "";
  return `${display.floor}${sub}`;
};

/**
 * Первый физический слот отображаемого этажа.
 * Для высокого этажа это слот подэтажа `N/1` (нижний), следующие подэтажи
 * (`N/2`, `N/3`) занимают слоты `+1`, `+2`.
 */
export const displayFloorToIndex = (displayFloor: number, block: BlockData): number =>
  getFirstSlotOfDisplayFloor(block, displayFloor);

export const getBlockPlaces = (block: BlockData, place: PlaceType) => {
  return block.places.filter(({ type }) => type === place);
};
