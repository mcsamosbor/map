export const BlockDirections = ["up", "right", "down", "left"] as const;
export type BlockDirection = (typeof BlockDirections)[number];

export const BlockTypes = ["residential", "frozen", "infected", "destroyed", "mushroom"] as const;
export type BlockType = (typeof BlockTypes)[number];

export const FlightTypes = ["stairs", "elevator", "ladder_elevator"] as const;
export const FlightStatuses = ["free", "blocked"] as const;
export type FlightType = (typeof FlightTypes)[number];
export type FlightStatus = (typeof FlightStatuses)[number];
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

export type PlaceType =
  | (typeof ProfessionPlaces)[number]
  | (typeof PlaceTypes)[number]
  | (typeof InfrastructurePlaces)[number];

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

  floors_data?: {
    [floor_idx: number]: {
      passages_data?: PassagesData;
      fence_type?: FenceType;
      is_double?: boolean;
      flight_statuses?: {
        left_flight?: FlightStatus;
        right_flight?: FlightStatus;
        middle_flight?: FlightStatus;
      };
    };
  };
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
  if (position === "left" || position === "right") return "normal";
  if (type === undefined) return "noway";
  return type;
};

export const displayFloorToIndex = (displayFloor: number, block: BlockData) => {
  const doubleFloors = Object.entries(block.floors_data ?? {}).reduce<number>(
    (prevCount: number, [floor, floorData]) => {
      const parsedFloor = parseInt(floor);
      const isCurrentFloorPositive = displayFloor > 0;
      const isParsedFloorPositive = parsedFloor > 0;
      if (isCurrentFloorPositive !== isParsedFloorPositive) return prevCount;
      const isNeededFloor =
        displayFloor > 0 ? parsedFloor < displayFloor : parsedFloor > displayFloor;
      if (floorData.is_double && isNeededFloor) {
        return prevCount + 1;
      }
      return prevCount;
    },
    0,
  );
  return displayFloor - doubleFloors;
};
