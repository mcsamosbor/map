import { colors } from "@/const/rendering";
import {
  BlockDirections,
  BlockTypes,
  FenceTypes,
  FlightStatuses,
  FlightTypes,
  PassagePositions,
  PassageTypes,
  PlaceTypes,
  ProfessionPlaces,
  type BlockData,
  type BlockRawData,
  type FlightData,
  type PassagesData,
  type PlaceData,
} from "./blocks";

const randomInt = (min: number, max: number): number =>
  Math.round(Math.random() * (max - min)) + min;

const randomChoice = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]!;

const randomBool = (): boolean => Math.random() > 0.5;

// Генератор блоков
export function generateBlocks(count: number): BlockData[] {
  const blocks: BlockData[] = [];

  for (let i = 1; i <= count; i++) {
    const id = i; // или используйте случайный bigint, но для простоты - счетчик

    // Параметры этажей
    const minFloor = randomInt(-10, 0);
    const maxFloor = minFloor + randomInt(0, 10);

    // Координаты: размещаем в сетку с шагом 100, слои чередуем
    const position_x = randomInt(-15, 15); // смещение по X
    const position_y = randomInt(-20, 20); // можно варьировать для разных рядов, но для простоты все на одной линии
    const layer = randomInt(-5, 5); // меняем слой каждые 10 блоков
    const letters = Object.keys(colors);
    const randomLetter = letters[randomInt(0, letters.length - 1)];
    // Название
    const name = `${randomLetter}-${String(id).padStart(2, "0")}`;

    // Основные поля
    const direction = randomChoice(BlockDirections);
    const type = randomChoice(BlockTypes);
    const left_flight: FlightData = {
      type: randomChoice(FlightTypes),
      status: randomChoice(FlightStatuses),
    };
    const right_flight: FlightData = {
      type: randomChoice(FlightTypes),
      status: randomChoice(FlightStatuses),
    };
    const middle_flight: FlightData = {
      type: randomChoice(FlightTypes),
      status: randomChoice(FlightStatuses),
    };
    const is_middle_flight = randomBool();
    const has_balcony = randomBool();
    const has_roof = randomBool();
    const flood_floor = randomBool() ? randomInt(minFloor, maxFloor) : null;
    const is_pipe = randomBool();

    // Места (places)
    const places: PlaceData[] = [];
    const placeTypes = [...ProfessionPlaces, ...PlaceTypes];
    const placeCount = randomInt(0, 3);
    for (let p = 0; p < placeCount; p++) {
      places.push({
        floor: randomInt(minFloor, maxFloor),
        type: randomChoice(placeTypes),
      });
    }

    // Данные по этажам
    const floors_data: BlockRawData["floors_data"] = {};
    for (let floor = minFloor; floor <= maxFloor; floor++) {
      // Проходы
      const passages_data: PassagesData = {};
      const positions = PassagePositions;
      // Каждый проход может быть 'noway' или 'normal' или отсутствовать
      positions.forEach((pos) => {
        if (randomBool()) {
          passages_data[pos] = randomChoice(PassageTypes);
        }
      });
      // Забор
      const fence_type = randomChoice(FenceTypes);
      const is_double = randomBool();
      const flight_statuses = {
        left_flight: randomBool() ? randomChoice(FlightStatuses) : undefined,
        right_flight: randomBool() ? randomChoice(FlightStatuses) : undefined,
        middle_flight: randomBool() ? randomChoice(FlightStatuses) : undefined,
      };

      floors_data[floor] = {
        passages_data: Object.keys(passages_data).length > 0 ? passages_data : undefined,
        fence_type,
        is_double,
        flight_statuses: Object.values(flight_statuses).some((v) => v !== undefined)
          ? flight_statuses
          : undefined,
      };
    }

    const block: BlockData = {
      id,
      name,
      direction,
      type,
      position_x,
      position_y,
      layer,
      min_floor: minFloor,
      max_floor: maxFloor,
      left_flight,
      right_flight,
      middle_flight,
      is_middle_flight,
      has_balcony,
      has_roof,
      flood_floor,
      is_pipe,
      places,
      floors_data,
    };

    blocks.push(block);
  }

  return blocks;
}
