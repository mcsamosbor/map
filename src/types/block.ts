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
 * Модель двойных этажей.
 *
 * `min_floor` и `max_floor` — это ОТОБРАЖАЕМЫЕ этажи (нижний и верхний).
 * Физические слоты блока идут снизу вверх, начиная с `min_floor` (нижний
 * слот). Двойной этаж `N` занимает два соседних слота: нижний отображается
 * как `N/1` (слот `N`), следующий — как `N/2` (слот `N + 1`). Каждый двойной
 * этаж добавляет один дополнительный физический слот, поэтому ряд
 * отображаемых этажей остаётся непрерывным.
 *
 * Список двойных этажей хранится в `double_floors` — это номера
 * ОТОБРАЖАЕМЫХ этажей, например `[0]` для пары `0/1`, `0/2`.
 * `floors_data` (проходы, заборы, статусы) по-прежнему индексируется
 * ФИЗИЧЕСКИМИ слотами.
 *
 * Для любого слота `s` выполняется:
 *   display(s) = s - (число двойных отображаемых этажей, меньших display(s))
 *             = s - (число double_floors, меньших display(s))
 *
 * Верхний физический слот блока = `max_floor + double_floors.length`.
 *
 * Примеры:
 *   min=2 max=4, double_floors=[3]           -> слоты 2,3,4,5 -> подписи 2, 3/1, 3/2, 4
 *   min=-6 max=-4, double_floors=[-5]        -> слоты -6..-3  -> подписи -6, -5/1, -5/2, -4
 *   min=-2 max=1, double_floors=[0]          -> слоты -2..2   -> подписи -2, -1, 0/1, 0/2, 1
 *   min=-3 max=5, double_floors=[-3, 0]      -> слоты -3..7   -> подписи -3/1, -3/2, -2, -1, 0/1, 0/2, 1, 2, 3, 4, 5
 */

export type FloorDisplay = {
  floor: number;
  sub?: 1 | 2;
};

/**
 * Отображаемые этажи, у которых есть подэтаж `/2`.
 * Список отсортирован по возрастанию.
 */
export const getDoubleFloors = (block: BlockData): number[] =>
  [...(block.double_floors ?? [])].sort((a, b) => a - b);

/**
 * Физический слот подэтажа `N/1` отображаемого этажа `N`.
 * Каждый двойной этаж ниже `N` добавляет один слот.
 */
const getFirstSlotOfDisplayFloor = (block: BlockData, displayFloor: number): number => {
  const min = getMinFloorSlot(block);
  const doubles = getDoubleFloors(block);
  return displayFloor + doubles.filter((d) => d >= min && d < displayFloor).length;
};

/**
 * Нижний (первый) физический слот блока.
 * Совпадает с `min_floor`, т.к. двойные этажи добавляют слоты только выше пары.
 */
export const getMinFloorSlot = (block: BlockData): number => block.min_floor ?? 0;

/**
 * Верхний (последний) физический слот блока.
 * `max_floor` — это верхний ОТОБРАЖАЕМЫЙ этаж. Если он двойной, его подэтаж
 * `/2` занимает слот `max_floor + 1`. Каждый двойной отображаемый этаж в
 * диапазоне [min_floor, max_floor] добавляет ещё один физический слот.
 */
export const getMaxFloorSlot = (block: BlockData): number => {
  const max = block.max_floor ?? 0;
  const min = block.min_floor ?? max;
  const extraSlots = getDoubleFloors(block).filter((d) => d >= min && d <= max).length;
  return max + extraSlots;
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
 * Отображаемый этаж по физическому слоту (с учётом подэтажа 1/2).
 */
export const getFloorDisplayBySlot = (slot: number, block: BlockData): FloorDisplay => {
  const min = getMinFloorSlot(block);
  const max = block.max_floor ?? min;
  const doubles = getDoubleFloors(block).filter((d) => d >= min && d <= max);

  for (const d of doubles) {
    const start = getFirstSlotOfDisplayFloor(block, d);
    if (slot === start) return { floor: d, sub: 1 };
    if (slot === start + 1) return { floor: d, sub: 2 };
  }

  const doublesBelow = doubles.filter((d) => getFirstSlotOfDisplayFloor(block, d) < slot).length;
  return { floor: slot - doublesBelow };
};

export const getStringByFloorDisplay = (display: FloorDisplay) => {
  const sub = display.sub ? `/${display.sub}` : "";
  return `${display.floor}${sub}`;
};

/**
 * Первый физический слот отображаемого этажа.
 * Для двойного этажа это слот подэтажа `N/1` (нижний), `N/2` находится на +1.
 */
export const displayFloorToIndex = (displayFloor: number, block: BlockData): number =>
  getFirstSlotOfDisplayFloor(block, displayFloor);

export const getBlockPlaces = (block: BlockData, place: PlaceType) => {
  return block.places.filter(({ type }) => type === place);
};
