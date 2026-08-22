import { BoxShadowFilter } from "pixi-box-shadow";
import {
  Container,
  Graphics,
  Text,
  TextStyle,
  type ColorSource,
  type GraphicsContext,
} from "pixi.js";
import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  CELL_SIZE,
  GAP,
  PADDING,
  PART_SIZE,
  PASSAGE_WIDTH,
  blockTypeColors,
  colors,
  effectsPartPositions,
  floorsPartPositions,
  getBlockSizes,
  getFloorSizes,
  getPartPosition,
  getPassageCells,
  getPassagePosition,
  infoPartPosition,
  isVertical,
  leftFlightPositions,
  namePartPosition,
  passagePositions,
  placesPartPosition,
  professionsPartPosition,
  rIcon,
  rightFlightPositions,
} from "@/const/rendering";
import { getIconContext } from "@/iconCache";
import {
  BlockDirections,
  IsSafePlace,
  PassagePositions,
  getFloorDisplayBySlot,
  validatePassage,
  type BlockData,
  type BlockDirection,
  type FenceType,
  type FlightData,
  type FlightPosition,
  type PassagePosition,
  type PassageType,
  type PlaceType,
} from "@/types/block";
import {
  getFloorStaticContext,
  getRectContext,
  getRoundRectFillContext,
  getRoundRectStrokeContext,
} from "./contextCache";

import circleDownIcon from "@/assets/icons/block/circle_down.svg?raw";
import circleUpIcon from "@/assets/icons/block/circle_up.svg?raw";
import cleanerIcon from "@/assets/icons/block/cleaner.svg?raw";
import elevatorIcon from "@/assets/icons/block/elevator.svg?raw";
import floodIcon from "@/assets/icons/block/flood.svg?raw";
import generatorIcon from "@/assets/icons/block/generator.svg?raw";
import hospitalIcon from "@/assets/icons/block/hospital.svg?raw";
import ladderIcon from "@/assets/icons/block/ladder.svg?raw";
import liquidatorIcon from "@/assets/icons/block/liquidator.svg?raw";
import partyIcon from "@/assets/icons/block/party.svg?raw";
import plumberIcon from "@/assets/icons/block/plumber.svg?raw";
import repairmanIcon from "@/assets/icons/block/repairman.svg?raw";
import roofIcon from "@/assets/icons/block/roof.svg?raw";
import safeIcon from "@/assets/icons/block/safe.svg?raw";
import stairsIcon from "@/assets/icons/block/stairs.svg?raw";
import theatreIcon from "@/assets/icons/block/theatre.svg?raw";
import boardIcon from "@/assets/icons/block/card/board.svg?raw";

const ICONS = {
  liquidator: rIcon(liquidatorIcon),
  repairman: rIcon(repairmanIcon),
  cleaner: rIcon(cleanerIcon),
  plumber: rIcon(plumberIcon),
  safe: rIcon(safeIcon),
  hospital: rIcon(hospitalIcon),
  theatre: rIcon(theatreIcon),
  party: rIcon(partyIcon),
  circleUp: rIcon(circleUpIcon),
  circleDown: rIcon(circleDownIcon),
  roof: rIcon(roofIcon),
  flood: rIcon(floodIcon),
  generator: rIcon(generatorIcon),
  board: rIcon(boardIcon),
  stairs: rIcon(stairsIcon),
  ladder: rIcon(ladderIcon),
  elevator: rIcon(elevatorIcon),
} as const;

const nameTextStyle = new TextStyle({
  fill: "white",
  fontSize: 36,
  fontWeight: "600",
  fontFamily: "Roboto",
});
const floorTextStyle36 = new TextStyle({
  fill: "white",
  fontSize: 36,
  fontWeight: "600",
  fontFamily: "Roboto",
});
const floorTextStyle28 = new TextStyle({
  fill: "white",
  fontSize: 28,
  fontWeight: "600",
  fontFamily: "Roboto",
});
const floorValueTextStyle = new TextStyle({
  fill: "white",
  fontSize: 34,
  fontWeight: "600",
  fontFamily: "Roboto",
});
const stairsTextStyle = new TextStyle({
  fill: "white",
  fontSize: 26,
  fontWeight: "600",
  fontFamily: "Roboto",
});

const PASSAGE_FLAGS: Record<
  PassagePosition,
  { up?: boolean; down?: boolean; left?: boolean; right?: boolean }
> = {
  up_left: { up: true, left: true },
  up_right: { up: true, right: true },
  down_right: { down: true, right: true },
  down_left: { down: true, left: true },
  left: { left: true },
  right: { right: true },
};

/** Боковые проходы (торцы коридора). */
const SIDE_PASSAGES = ["left", "right"] as const;
type SidePassage = (typeof SIDE_PASSAGES)[number];

const isSidePassage = (pos: PassagePosition): pos is SidePassage =>
  pos === "left" || pos === "right";

/** Позиция и размер прямоугольника прохода в координатах контейнера этажа. */
const getPassageRect = (
  direction: BlockDirection,
  pos: PassagePosition,
  type: PassageType,
): { x: number; y: number; w: number; h: number } => {
  const flags = PASSAGE_FLAGS[pos];
  const [px, py] = getPassagePosition(...passagePositions[pos][direction]);
  const vertical = !!flags.up || !!flags.down;
  const realDirection = ((vertical ? 0 : 1) + BlockDirections.indexOf(direction)) % 2;
  let w = realDirection === 0 ? PASSAGE_WIDTH : PART_SIZE;
  let h = realDirection === 0 ? PART_SIZE : PASSAGE_WIDTH;
  const nowayShift = flags.left ? 3 : flags.right ? 1 : 0;
  const normalShift = flags.up ? 0 : flags.down ? 2 : 0;
  const effectIndex =
    ((type === "noway" ? nowayShift : normalShift) + BlockDirections.indexOf(direction)) % 4;
  let x = px - w / 2;
  let y = py - h / 2;
  // Боковые проходы: открытые не расширяются.
  // Закрытые (noway) у горизонтального блока расширяются наверх на GAP
  // (нижний край остаётся на месте), у вертикального — влево и вправо на GAP;
  // нижний проход вертикального блока дополнительно укорачивается на GAP
  // (верхний край остаётся на месте).
  if (isSidePassage(pos)) {
    if (type === "noway") {
      // Общее: стена удлиняется вдоль блока.
      h += GAP;
      if (isVertical(direction)) {
        // Вертикальный блок: расширяем влево и вправо на GAP.
        w += 2 * GAP;
        x -= GAP;
        h -= GAP;
        // Нижний проход укорачиваем на GAP (верхний край остаётся на месте).
        if (py > BLOCK_WIDTH / 2) {
          // h -= GAP;
        }
      } else {
        // Горизонтальный блок: расширяем наверх на GAP (нижний край остаётся на месте).
        y -= GAP;
        h += GAP;
      }
    }
    return { x, y, w, h };
  }
  switch (effectIndex) {
    case 0:
      h += GAP;
      break;
    case 1:
      w += GAP;
      x -= GAP;
      break;
    case 2:
      h += GAP;
      y -= GAP;
      break;
    case 3:
      w += GAP;
      break;
  }
  return { x, y, w, h };
};

/**
 * Белая черточка у внутреннего края закрытого (noway) бокового прохода.
 * Край выбирается в сторону центра коридора, черточка рисуется на границе стены.
 */
const drawClosedPassageDash = (
  context: GraphicsContext,
  direction: BlockDirection,
  rect: { x: number; y: number; w: number; h: number },
) => {
  const vertical = isVertical(direction);
  const corridorCx = vertical ? 2 * GAP + PART_SIZE + PASSAGE_WIDTH / 2 : BLOCK_WIDTH / 2;
  const corridorCy = vertical ? BLOCK_WIDTH / 2 : 2 * GAP + PART_SIZE + PASSAGE_WIDTH / 2;
  const rectCx = rect.x + rect.w / 2;
  const rectCy = rect.y + rect.h / 2;
  const toCenterX = corridorCx - rectCx;
  const toCenterY = corridorCy - rectCy;
  if (Math.abs(toCenterX) > Math.abs(toCenterY)) {
    // Смещение от центра по горизонтали: внутренний край вертикальный.
    // У горизонтальных блоков стена расширена наверх, поэтому черточка
    // привязана к верхней границе исходного слота (rect.y + GAP) и не двигается.
    const edgeX = toCenterX > 0 ? rect.x + rect.w + GAP : rect.x;
    context.rect(edgeX - GAP, rect.y + GAP, GAP, PASSAGE_WIDTH).fill("#FFFFFF");
  } else {
    // Смещение от центра по вертикали: внутренний край горизонтальный.
    // У нижнего прохода вертикального блока черточку приподнимаем на GAP, у верхнего опускаем.
    const edgeY = toCenterY > 0 ? rect.y + rect.h : rect.y + GAP;
    const lift = toCenterY < 0 ? GAP : -GAP;
    context
      .rect(rectCx - PASSAGE_WIDTH / 2, edgeY - GAP - lift, PASSAGE_WIDTH, GAP)
      .fill("#FFFFFF");
  }
};

/** Позиция и размер фона среднего пролёта (в координатах контейнера этажа). */
const middleFlightRect = (
  direction: BlockDirection,
  cells: readonly [number, number],
  hasGap: boolean,
): { x: number; y: number; w: number; h: number } => {
  const vertical = BlockDirections.indexOf(direction) % 2 === 1;
  const pw = vertical ? PART_SIZE : PASSAGE_WIDTH;
  const ph = vertical ? PASSAGE_WIDTH : PART_SIZE;
  const [bx, by] = getPassagePosition(...cells);
  const gapOffsetX = hasGap && !vertical ? -GAP : 0;
  const gapOffsetY = hasGap && vertical ? -GAP : 0;
  const gapWidthAdd = hasGap && !vertical ? 2 * GAP : 0;
  const gapHeightAdd = hasGap && vertical ? 2 * GAP : 0;
  return {
    x: bx - pw / 2 + gapOffsetX,
    y: by - ph / 2 + gapOffsetY,
    w: pw + gapWidthAdd,
    h: ph + gapHeightAdd,
  };
};

/** Решётка/забор в центре блока. */
const drawFenceShapes = (
  context: GraphicsContext,
  direction: BlockDirection,
  fenceType: FenceType,
) => {
  if (fenceType === "missing") return;
  const vertical = isVertical(direction);
  const centerX = vertical ? BLOCK_HEIGHT / 2 : BLOCK_WIDTH / 2;
  const centerY = vertical ? BLOCK_WIDTH / 2 : BLOCK_HEIGHT / 2;
  const thickness = 10;
  const length = PASSAGE_WIDTH;
  const fenceWidth = vertical ? length : thickness;
  const fenceHeight = vertical ? thickness : length;
  const fenceX = centerX - fenceWidth / 2;
  const fenceY = centerY - fenceHeight / 2;
  if (fenceType === "solid") {
    context.rect(fenceX, fenceY, fenceWidth, fenceHeight).fill("#FFFFFF");
    return;
  }
  const third = length / 3;
  if (vertical) {
    context.rect(fenceX, fenceY, third, fenceHeight).fill("#FFFFFF");
    context.rect(fenceX + 2 * third, fenceY, third, fenceHeight).fill("#FFFFFF");
  } else {
    context.rect(fenceX, fenceY, fenceWidth, third).fill("#FFFFFF");
    context.rect(fenceX, fenceY + 2 * third, fenceWidth, third).fill("#FFFFFF");
  }
};

/** Описание иконки в локальных координатах контейнера. */
type IconItem = { path: string; size: number; x: number; y: number };

/** Иконки левого/правого пролёта (локальные координаты Part-контейнера). */
const flightIconItems = (data: FlightData): IconItem[] => {
  const size = data.type === "ladder_elevator" ? 40 : 50;
  if (data.type === "elevator") {
    return [{ path: ICONS.elevator, size, x: PART_SIZE / 2, y: PART_SIZE / 2 }];
  }
  if (data.type === "ladder_elevator") {
    return [
      { path: ICONS.elevator, size, x: PART_SIZE / 3 - 5, y: PART_SIZE / 2 },
      { path: ICONS.ladder, size, x: (PART_SIZE / 3) * 2 + 5, y: PART_SIZE / 2 },
    ];
  }
  return [{ path: ICONS.stairs, size, x: PART_SIZE / 2, y: PART_SIZE / 2 }];
};

/** Иконки среднего пролёта (локальные координаты его контейнера). */
const middleFlightIconItems = (
  data: FlightData,
  width: number,
  height: number,
  direction: BlockDirection,
): IconItem[] => {
  const vertical = BlockDirections.indexOf(direction) % 2 === 1;
  if (data.type === "elevator") {
    return [{ path: ICONS.elevator, size: 40, x: width / 2, y: height / 2 }];
  }
  if (data.type === "ladder_elevator") {
    const x1 = vertical ? width / 3 - 5 : width / 2;
    const y1 = vertical ? height / 2 : height / 3 - 5;
    const x2 = vertical ? (width / 3) * 2 + 5 : width / 2;
    const y2 = vertical ? height / 2 : (height / 3) * 2 + 5;
    return [
      { path: ICONS.elevator, size: 40, x: x1, y: y1 },
      { path: ICONS.ladder, size: 40, x: x2, y: y2 },
    ];
  }
  return [{ path: ICONS.stairs, size: 40, x: width / 2, y: height / 2 }];
};

/** Graphics-иконка на общей SVG-геометрии, центрированная в точке (x, y). */
const makeIcon = (path: string, size: number, x: number, y: number): Graphics => {
  const graphics = new Graphics({ context: getIconContext(path) });
  const bounds = graphics.getLocalBounds();
  graphics.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  graphics.setSize(size);
  graphics.position.set(x, y);
  graphics.eventMode = "none";
  return graphics;
};

/**
 * Обновить переиспользуемую иконку: при смене пути подменяется общий
 * SVG-контекст, pivot считается по центру контента (а не по size),
 * далее — позиция и масштаб. Новых Graphics не создаётся.
 */
const configureIcon = (icon: Graphics, item: IconItem): Graphics => {
  const context = getIconContext(item.path);
  if (icon.context !== context) {
    icon.context = context;
  }
  const bounds = icon.getLocalBounds();
  icon.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  icon.setSize(item.size);
  icon.position.set(item.x, item.y);
  icon.visible = true;
  return icon;
};

/** Text с белым шрифтом, центрированный в точке (x, y). */
const makeText = (text: string, x: number, y: number, style: TextStyle): Text => {
  const node = new Text({
    text,
    style,
    anchor: { x: 0.5, y: 0.5 },
    position: { x, y },
  });
  node.eventMode = "none";
  return node;
};

const setText = (text: Text, value: string) => {
  if (text.text !== value) text.text = value;
};

const mainColorOf = (block: BlockData): ColorSource =>
  colors[block.name.charAt(0)]?.main ?? "#767676";
const bgColorOf = (block: BlockData): ColorSource => colors[block.name.charAt(0)]?.bg ?? "#A8A8A8";

const hasPlace = (block: BlockData, place: PlaceType) =>
  block.places?.find(({ type }) => type === place) !== undefined;

const getPlaceFloor = (block: BlockData, place: PlaceType) =>
  block.places?.find(({ type }) => type === place)?.floor;

const hasSafePlace = (block: BlockData) =>
  block.places?.find(({ type }) => IsSafePlace(type)) !== undefined;

const getFlightStatus = (block: BlockData, floor: number, flightPos: FlightPosition) =>
  block.floors_data?.[floor]?.flight_statuses?.[flightPos] ?? "free";

export interface BlockViewCallbacks {
  onSelect: (blockId: number) => void;
  onChangePassageType: (blockId: number, floor: number, pos: PassagePosition) => void;
  onChangeFenceType: (blockId: number, floor: number) => void;
  onChangeFlightStatus: (blockId: number, floor: number, flightPos: FlightPosition) => void;
}

type FloorPassages = Record<PassagePosition, PassageType>;

type FloorStaticParams = {
  direction: BlockDirection;
  mainColor: ColorSource;
  bgColor: ColorSource;
  passages: FloorPassages;
  fenceType: FenceType;
  hasMiddleGap: boolean;
};

const buildFloorStatic = (context: GraphicsContext, p: FloorStaticParams) => {
  const vertical = isVertical(p.direction);

  // Центральный коридор (drawRow)
  const rowX = vertical ? 2 * GAP + PART_SIZE : GAP;
  const rowY = vertical ? GAP : 2 * GAP + PART_SIZE;
  const rowW = vertical ? PASSAGE_WIDTH : BLOCK_WIDTH - 2 * GAP;
  const rowH = vertical ? BLOCK_WIDTH - 2 * GAP : PASSAGE_WIDTH;
  context.rect(rowX, rowY, rowW, rowH).fill(p.bgColor);

  // Проходы (угловые и боковые)
  for (const pos of PassagePositions) {
    const rect = getPassageRect(p.direction, pos, p.passages[pos]);
    context
      .rect(rect.x, rect.y, rect.w, rect.h)
      .fill(p.passages[pos] === "noway" ? p.mainColor : p.bgColor);
  }

  // Закрытые боковые проходы: белая черточка у внутреннего края стены
  for (const pos of SIDE_PASSAGES) {
    if (p.passages[pos] !== "noway") continue;
    drawClosedPassageDash(context, p.direction, getPassageRect(p.direction, pos, "noway"));
  }

  // Средние пролёты
  const middle1 = middleFlightRect(
    p.direction,
    getPassageCells([3, 0])[p.direction],
    p.hasMiddleGap,
  );
  context.rect(middle1.x, middle1.y, middle1.w, middle1.h).fill(p.mainColor);
  const middle2 = middleFlightRect(p.direction, getPassageCells([3, 2])[p.direction], true);
  context.rect(middle2.x, middle2.y, middle2.w, middle2.h).fill(p.mainColor);

  // Части
  const shiftX = vertical ? -1 : 0;
  const shiftY = vertical ? 1 : 0;
  const cells: readonly (readonly [number, number])[] = [
    [namePartPosition[0] + shiftX, namePartPosition[1] + shiftY],
    [infoPartPosition[0] + shiftX, infoPartPosition[1] + shiftY],
    [professionsPartPosition[0] + shiftX, professionsPartPosition[1] + shiftY],
    [placesPartPosition[0] + shiftX, placesPartPosition[1] + shiftY],
    floorsPartPositions[p.direction],
    effectsPartPositions[p.direction],
    leftFlightPositions[p.direction],
    rightFlightPositions[p.direction],
  ];
  for (const [cx, cy] of cells) {
    const [x, y] = getPartPosition(cx, cy);
    context.rect(x, y, PART_SIZE, PART_SIZE).fill(p.mainColor);
  }

  // Забор
  drawFenceShapes(context, p.direction, p.fenceType);
};

export class BlockView {
  readonly root: Container;
  readonly blockId: number;

  private block: BlockData;
  private floor: number;

  private readonly floorContainer: Container;
  private readonly bg: Graphics;
  private readonly shadowFilter: BoxShadowFilter;
  private readonly staticFloor: Graphics;
  private staticKey = "";

  private readonly nameText: Text;
  private readonly floorText: Text;

  private readonly genIcon: Graphics;
  private readonly genText: Text;
  private readonly boardIcon: Graphics;
  private readonly boardText: Text;
  private readonly liqIcon: Graphics;
  private readonly repIcon: Graphics;
  private readonly cleIcon: Graphics;
  private readonly pluIcon: Graphics;
  private readonly safeIconG: Graphics;
  private readonly hospIcon: Graphics;
  private readonly theaIcon: Graphics;
  private readonly partyIconG: Graphics;
  private readonly circleUpIconG: Graphics;
  private readonly maxFloorText: Text;
  private readonly circleDownIconG: Graphics;
  private readonly minFloorText: Text;
  private readonly roofIconG: Graphics;
  private readonly roofText: Text;
  private readonly floodIconG: Graphics;
  private readonly floodText: Text;

  private readonly dynamicFloor: Container;
  private readonly selection: Graphics;

  // Части-контейнеры: их позиции зависят от направления блока и должны
  // обновляться в sync(), а не только в конструкторе.
  private readonly namePart: Container;
  private readonly infoPart: Container;
  private readonly profPart: Container;
  private readonly placesPart: Container;
  private readonly floorsPart: Container;
  private readonly effectsPart: Container;

  // Переиспользуемые узлы динамического слоя: между слоями они скрываются
  // и перенастраиваются, а не пересоздаются (источник долгого flushJobs).
  private stairSlots: { icon: Graphics; text: Text }[] = [];
  private flightSlots: { part: Container; icons: Graphics[] }[] = [];
  private dynamicKey = "";
  private bgSizeKey = "";

  private editing = false;
  private hitAreas: Graphics[] = [];
  private lastShadowColor: ColorSource | null = null;
  private readonly callbacks: BlockViewCallbacks;

  constructor(block: BlockData, callbacks: BlockViewCallbacks) {
    this.block = block;
    this.blockId = block.id;
    this.floor = 0;
    this.callbacks = callbacks;

    const direction = block.direction;
    const [floorW, floorH] = getFloorSizes(direction);

    this.root = new Container();
    this.root.eventMode = "static";
    this.root.cursor = "pointer";
    this.root.on("pointertap", () => this.callbacks.onSelect(this.blockId));
    this.root.position.set(
      (block.position_x ?? 0) * CELL_SIZE,
      -(block.position_y ?? 0) * CELL_SIZE,
    );

    this.floorContainer = new Container();
    this.floorContainer.position.set(PADDING, PADDING);
    this.root.addChild(this.floorContainer);

    // Белый фон со скруглением + тень по типу блока
    this.bg = new Graphics(getRoundRectFillContext(floorW, floorH, 10, "#FFFFFF"));
    this.shadowFilter = new BoxShadowFilter({
      boxShadow: `0 0 20px 20px ${blockTypeColors[block.type ?? "residential"]}`,
      borderRadius: 10,
    });
    this.bg.filters = [this.shadowFilter];
    this.floorContainer.addChild(this.bg);

    // Статичный облик этажа (кешированный GraphicsContext)
    this.staticFloor = new Graphics();
    this.floorContainer.addChild(this.staticFloor);

    const vertical = isVertical(direction);
    const shiftX = vertical ? -1 : 0;
    const shiftY = vertical ? 1 : 0;
    const addPart = (cell: readonly [number, number]): Container => {
      const part = new Container();
      const [x, y] = getPartPosition(...cell);
      part.position.set(x, y);
      this.floorContainer.addChild(part);
      return part;
    };

    // Часть с названием и этажом
    const namePart = addPart([namePartPosition[0] + shiftX, namePartPosition[1] + shiftY]);
    this.namePart = namePart;
    this.nameText = makeText(block.name, PART_SIZE / 2, PART_SIZE / 2, nameTextStyle);
    namePart.addChild(this.nameText);
    this.floorText = makeText("", PART_SIZE / 2, PART_SIZE / 2 + 25, floorTextStyle36);
    namePart.addChild(this.floorText);

    // Часть «инфраструктура»: генератор и доска
    const infoPart = addPart([infoPartPosition[0] + shiftX, infoPartPosition[1] + shiftY]);
    this.infoPart = infoPart;
    this.genIcon = makeIcon(ICONS.generator, 34, PART_SIZE / 4 + 5, PART_SIZE / 4);
    this.genText = makeText("", (PART_SIZE * 3) / 4 - 5, PART_SIZE / 4, floorValueTextStyle);
    infoPart.addChild(this.genIcon, this.genText);
    this.boardIcon = makeIcon(ICONS.board, 34, PART_SIZE / 4 + 5, (PART_SIZE * 3) / 4);
    this.boardText = makeText(
      "",
      (PART_SIZE * 3) / 4 - 5,
      (PART_SIZE * 3) / 4,
      floorValueTextStyle,
    );
    infoPart.addChild(this.boardIcon, this.boardText);

    // Часть «профессии»
    const profPart = addPart([
      professionsPartPosition[0] + shiftX,
      professionsPartPosition[1] + shiftY,
    ]);
    this.profPart = profPart;
    this.liqIcon = makeIcon(ICONS.liquidator, 34, PART_SIZE / 4, PART_SIZE / 4);
    this.repIcon = makeIcon(ICONS.repairman, 34, (PART_SIZE * 3) / 4, PART_SIZE / 4);
    this.cleIcon = makeIcon(ICONS.cleaner, 34, PART_SIZE / 4, (PART_SIZE * 3) / 4);
    this.pluIcon = makeIcon(ICONS.plumber, 34, (PART_SIZE * 3) / 4, (PART_SIZE * 3) / 4);
    profPart.addChild(this.liqIcon, this.repIcon, this.cleIcon, this.pluIcon);

    // Часть «места»
    const placesPart = addPart([placesPartPosition[0] + shiftX, placesPartPosition[1] + shiftY]);
    this.placesPart = placesPart;
    this.safeIconG = makeIcon(ICONS.safe, 34, PART_SIZE / 4, PART_SIZE / 4);
    this.hospIcon = makeIcon(ICONS.hospital, 34, (PART_SIZE * 3) / 4, PART_SIZE / 4);
    this.theaIcon = makeIcon(ICONS.theatre, 34, PART_SIZE / 4, (PART_SIZE * 3) / 4);
    this.partyIconG = makeIcon(ICONS.party, 34, (PART_SIZE * 3) / 4, (PART_SIZE * 3) / 4);
    placesPart.addChild(this.safeIconG, this.hospIcon, this.theaIcon, this.partyIconG);

    // Часть «этажи»
    const floorsPart = addPart(floorsPartPositions[direction]);
    this.floorsPart = floorsPart;
    this.circleUpIconG = makeIcon(ICONS.circleUp, 34, PART_SIZE / 4 + 5, PART_SIZE / 4);
    this.maxFloorText = makeText("", (PART_SIZE * 3) / 4 - 5, PART_SIZE / 4, floorValueTextStyle);
    floorsPart.addChild(this.circleUpIconG, this.maxFloorText);
    this.circleDownIconG = makeIcon(ICONS.circleDown, 34, PART_SIZE / 4 + 5, (PART_SIZE * 3) / 4);
    this.minFloorText = makeText(
      "",
      (PART_SIZE * 3) / 4 - 5,
      (PART_SIZE * 3) / 4,
      floorValueTextStyle,
    );
    floorsPart.addChild(this.circleDownIconG, this.minFloorText);

    // Часть «эффекты»
    const effectsPart = addPart(effectsPartPositions[direction]);
    this.effectsPart = effectsPart;
    this.roofIconG = makeIcon(ICONS.roof, 34, PART_SIZE / 4 + 5, PART_SIZE / 4);
    this.roofText = makeText("", (PART_SIZE * 3) / 4 - 5, PART_SIZE / 4, floorValueTextStyle);
    effectsPart.addChild(this.roofIconG, this.roofText);
    this.floodIconG = makeIcon(ICONS.flood, 34, PART_SIZE / 4 + 5, (PART_SIZE * 3) / 4);
    this.floodText = makeText(
      "",
      (PART_SIZE * 3) / 4 - 5,
      (PART_SIZE * 3) / 4,
      floorValueTextStyle,
    );
    effectsPart.addChild(this.floodIconG, this.floodText);

    // Динамический слой (иконки пролётов, лестницы проходов) — перестраивается при смене этажа
    this.dynamicFloor = new Container();
    this.floorContainer.addChild(this.dynamicFloor);

    // Рамка выделения
    const [blockW, blockH] = getBlockSizes(direction);
    this.selection = new Graphics(getRoundRectStrokeContext(blockW, blockH, 10, 10, 0x00ffff));
    this.selection.eventMode = "none";
    this.selection.visible = false;
    this.root.addChild(this.selection);
  }

  /**
   * Обновить вид блока под текущий слой/данные.
   * Вызывается при смене слоя, изменении данных блока и т.д.
   */
  sync(block: BlockData, layer: number) {
    this.block = block;
    const floor = layer - (block.layer ?? 0);
    this.floor = floor;
    const direction = block.direction;
    const isPipe = block.is_pipe === true;
    const vertical = isVertical(direction);

    // Позиция блока: обновляем и при изменении данных (правка координат в карточке)
    const posX = (block.position_x ?? 0) * CELL_SIZE;
    const posY = -(block.position_y ?? 0) * CELL_SIZE;
    if (this.root.x !== posX || this.root.y !== posY) {
      this.root.position.set(posX, posY);
    }

    // Фон и рамка выделения зависят от ориентации блока: при смене direction
    // бэкграунд и свечение (фильтр на bg) должны поворачиваться вместе с этажом.
    const [floorW, floorH] = getFloorSizes(direction);
    const bgKey = `${floorW}x${floorH}`;
    if (bgKey !== this.bgSizeKey) {
      this.bgSizeKey = bgKey;
      this.bg.context = getRoundRectFillContext(floorW, floorH, 10, "#FFFFFF");
      const [blockW, blockH] = getBlockSizes(direction);
      this.selection.context = getRoundRectStrokeContext(blockW, blockH, 10, 10, 0x00ffff);
    }

    // Позиции частей тоже зависят от направления — обновляем в sync()
    const shiftX = vertical ? -1 : 0;
    const shiftY = vertical ? 1 : 0;
    this.namePart.position.set(
      ...getPartPosition(namePartPosition[0] + shiftX, namePartPosition[1] + shiftY),
    );
    this.infoPart.position.set(
      ...getPartPosition(infoPartPosition[0] + shiftX, infoPartPosition[1] + shiftY),
    );
    this.profPart.position.set(
      ...getPartPosition(professionsPartPosition[0] + shiftX, professionsPartPosition[1] + shiftY),
    );
    this.placesPart.position.set(
      ...getPartPosition(placesPartPosition[0] + shiftX, placesPartPosition[1] + shiftY),
    );
    this.floorsPart.position.set(...getPartPosition(...floorsPartPositions[direction]));
    this.effectsPart.position.set(...getPartPosition(...effectsPartPositions[direction]));

    // Статичный облик этажа: меняем только при изменении ключа
    const passages = this.getPassageTypes();
    const fenceType = block.floors_data?.[floor]?.fence_type ?? "missing";
    const hasMiddleGap = !(block.is_middle_flight && !isPipe && block.middle_flight !== undefined);
    const staticKey = [
      direction,
      mainColorOf(block),
      bgColorOf(block),
      passages.up_left,
      passages.up_right,
      passages.down_right,
      passages.down_left,
      passages.left,
      passages.right,
      fenceType,
      hasMiddleGap ? "g" : "n",
    ].join("|");
    if (staticKey !== this.staticKey) {
      this.staticKey = staticKey;
      this.staticFloor.context = getFloorStaticContext(staticKey, (context) =>
        buildFloorStatic(context, {
          direction,
          mainColor: mainColorOf(block),
          bgColor: bgColorOf(block),
          passages,
          fenceType,
          hasMiddleGap,
        }),
      );
    }

    // Тень по типу блока
    const shadowColor = blockTypeColors[block.type ?? "residential"];
    if (shadowColor !== this.lastShadowColor) {
      this.lastShadowColor = shadowColor;
      this.shadowFilter.boxShadow = `0 0 20px 20px ${shadowColor}`;
    }

    // Название и подпись этажа
    setText(this.nameText, block.name);
    this.nameText.y = PART_SIZE / 2 - (isPipe ? 0 : 25);
    const display = getFloorDisplayBySlot(floor, block);
    setText(this.floorText, `Эт. ${display.floor}${display.sub ? `/${display.sub}` : ""}`);
    const floorStyle = display.sub === undefined ? floorTextStyle36 : floorTextStyle28;
    if (this.floorText.style !== floorStyle) this.floorText.style = floorStyle;
    this.floorText.visible = !isPipe;

    // Часть «инфраструктура»
    const generator = !isPipe && hasPlace(block, "generator");
    this.genIcon.visible = generator;
    this.genText.visible = generator;
    if (generator) setText(this.genText, String(getPlaceFloor(block, "generator")));
    const board = !isPipe && hasPlace(block, "board");
    this.boardIcon.visible = board;
    this.boardText.visible = board;
    if (board) setText(this.boardText, String(getPlaceFloor(block, "board")));

    // Часть «профессии»
    this.liqIcon.visible = !isPipe && hasPlace(block, "liquidator");
    this.repIcon.visible = !isPipe && hasPlace(block, "repairman");
    this.cleIcon.visible = !isPipe && hasPlace(block, "cleaner");
    this.pluIcon.visible = !isPipe && hasPlace(block, "plumber");

    // Часть «места»
    this.safeIconG.visible = !isPipe && hasSafePlace(block);
    this.hospIcon.visible = !isPipe && hasPlace(block, "hospital");
    this.theaIcon.visible = !isPipe && hasPlace(block, "theatre");
    this.partyIconG.visible = !isPipe && hasPlace(block, "party");

    // Часть «этажи»
    const hasMaxFloor = !isPipe && block.max_floor !== undefined;
    const hasMinFloor = !isPipe && block.min_floor !== undefined;
    this.circleUpIconG.visible = hasMaxFloor;
    this.maxFloorText.visible = hasMaxFloor;
    if (hasMaxFloor) setText(this.maxFloorText, String(block.max_floor));
    this.circleDownIconG.visible = hasMinFloor;
    this.minFloorText.visible = hasMinFloor;
    if (hasMinFloor) setText(this.minFloorText, String(block.min_floor));

    // Часть «эффекты»
    const roof = !isPipe && block.has_roof === true;
    this.roofIconG.visible = roof;
    this.roofText.visible = roof;
    if (roof) setText(this.roofText, String((block.max_floor ?? 0) + 1));
    const flood = !isPipe && block.flood_floor !== undefined && block.flood_floor !== null;
    this.floodIconG.visible = flood;
    this.floodText.visible = flood;
    if (flood) setText(this.floodText, String(block.flood_floor));

    // Динамический слой и hit-зоны редактирования
    this.rebuildFloorDynamic();
    if (this.editing) this.createHitAreas();
  }

  private getPassageTypes(): FloorPassages {
    const passagesData = this.block.floors_data?.[this.floor]?.passages_data;
    return {
      up_left: validatePassage(passagesData?.up_left, "up_left"),
      up_right: validatePassage(passagesData?.up_right, "up_right"),
      down_right: validatePassage(passagesData?.down_right, "down_right"),
      down_left: validatePassage(passagesData?.down_left, "down_left"),
      left: validatePassage(passagesData?.left, "left"),
      right: validatePassage(passagesData?.right, "right"),
    };
  }

  /** Пересобрать иконки/тексты, зависящие от текущего этажа (с переиспользованием узлов). */
  private rebuildFloorDynamic() {
    const block = this.block;
    const floor = this.floor;
    const direction = block.direction;
    const passages = this.getPassageTypes();

    const leftData = block.is_middle_flight || block.is_pipe ? undefined : block.left_flight;
    const rightData = block.is_middle_flight || block.is_pipe ? undefined : block.right_flight;
    const middleData = block.is_middle_flight && !block.is_pipe ? block.middle_flight : undefined;

    // Ранний выход: контент динамического слоя не изменился.
    const key = [
      direction,
      floor,
      passages.up_left,
      passages.up_right,
      passages.down_right,
      passages.down_left,
      passages.left,
      passages.right,
      leftData?.type ?? "",
      getFlightStatus(block, floor, "left_flight"),
      rightData?.type ?? "",
      getFlightStatus(block, floor, "right_flight"),
      middleData?.type ?? "",
      getFlightStatus(block, floor, "middle_flight"),
    ].join("|");
    if (key === this.dynamicKey) return;
    this.dynamicKey = key;

    // Лестницы проходов
    const stairs: { x: number; y: number; tx: number; ty: number; label: string }[] = [];
    for (const pos of PassagePositions) {
      const type = passages[pos];
      if (type !== "stairs_up" && type !== "stairs_down") continue;
      const rect = getPassageRect(direction, pos, type);
      const centerX = rect.x + rect.w / 2;
      const centerY = rect.y + rect.h / 2;
      // Лестницы: для боковых проходов иконка и подпись вытянуты вдоль блока,
      // для угловых — поперёк.
      const horizontalBlock = direction === "down" || direction === "up";
      const shift = isSidePassage(pos) === horizontalBlock ? { x: 20, y: 0 } : { x: 0, y: 20 };
      stairs.push({
        x: centerX + shift.x,
        y: centerY + shift.y,
        tx: centerX - shift.x,
        ty: centerY - shift.y,
        label: type === "stairs_down" ? "-1" : "+1",
      });
    }
    while (this.stairSlots.length < stairs.length) {
      const icon = makeIcon(ICONS.stairs, 30, 0, 0);
      const text = makeText("", 0, 0, stairsTextStyle);
      this.dynamicFloor.addChild(icon, text);
      this.stairSlots.push({ icon, text });
    }
    let stairIndex = 0;
    for (const slot of this.stairSlots) {
      const item = stairs[stairIndex++];
      slot.icon.visible = item !== undefined;
      slot.text.visible = item !== undefined;
      if (!item) continue;
      configureIcon(slot.icon, { path: ICONS.stairs, size: 30, x: item.x, y: item.y });
      slot.text.position.set(item.tx, item.ty);
      setText(slot.text, item.label);
    }

    // Пролёты (левый, правый, средний)
    const flights: { x: number; y: number; alpha: number; icons: IconItem[] }[] = [];
    const addFlight = (x: number, y: number, pos: FlightPosition, items: IconItem[]) => {
      flights.push({
        x,
        y,
        alpha: getFlightStatus(block, floor, pos) === "blocked" ? 0.35 : 1,
        icons: items,
      });
    };
    if (leftData) {
      const [fx, fy] = getPartPosition(...leftFlightPositions[direction]);
      addFlight(fx, fy, "left_flight", flightIconItems(leftData));
    }
    if (rightData) {
      const [fx, fy] = getPartPosition(...rightFlightPositions[direction]);
      addFlight(fx, fy, "right_flight", flightIconItems(rightData));
    }
    if (middleData) {
      const rect = middleFlightRect(direction, getPassageCells([3, 0])[direction], false);
      addFlight(
        rect.x,
        rect.y,
        "middle_flight",
        middleFlightIconItems(middleData, rect.w, rect.h, direction),
      );
    }
    while (this.flightSlots.length < flights.length) {
      const part = new Container();
      const icon1 = makeIcon(ICONS.stairs, 40, 0, 0);
      const icon2 = makeIcon(ICONS.stairs, 40, 0, 0);
      part.addChild(icon1, icon2);
      this.dynamicFloor.addChild(part);
      this.flightSlots.push({ part, icons: [icon1, icon2] });
    }
    let flightIndex = 0;
    for (const slot of this.flightSlots) {
      const item = flights[flightIndex++];
      slot.part.visible = item !== undefined;
      if (!item) continue;
      slot.part.position.set(item.x, item.y);
      slot.part.alpha = item.alpha;
      let iconIndex = 0;
      for (const icon of slot.icons) {
        const iconData = item.icons[iconIndex++];
        icon.visible = iconData !== undefined;
        if (iconData) configureIcon(icon, iconData);
      }
    }
  }

  setEditing(editing: boolean) {
    if (this.editing === editing) return;
    this.editing = editing;
    if (editing) {
      this.createHitAreas();
    } else {
      this.destroyHitAreas();
    }
  }

  private createHitAreas() {
    this.destroyHitAreas();
    const block = this.block;
    const floor = this.floor;
    const direction = block.direction;
    const blockId = block.id;
    const passages = this.getPassageTypes();

    const addHit = (width: number, height: number, x: number, y: number, onTap: () => void) => {
      const hit = new Graphics(getRectContext(width, height, "#FFFFFF"));
      hit.position.set(x, y);
      hit.alpha = 0;
      hit.eventMode = "static";
      hit.cursor = "pointer";
      hit.on("pointertap", onTap);
      this.floorContainer.addChild(hit);
      this.hitAreas.push(hit);
    };

    // Проходы (угловые и боковые)
    for (const pos of PassagePositions) {
      const rect = getPassageRect(direction, pos, passages[pos]);
      addHit(rect.w, rect.h, rect.x, rect.y, () =>
        this.callbacks.onChangePassageType(blockId, floor, pos),
      );
    }

    // Забор в центре
    const centerX = isVertical(direction) ? BLOCK_HEIGHT / 2 : BLOCK_WIDTH / 2;
    const centerY = isVertical(direction) ? BLOCK_WIDTH / 2 : BLOCK_HEIGHT / 2;
    addHit(
      PASSAGE_WIDTH,
      PASSAGE_WIDTH,
      centerX - PASSAGE_WIDTH / 2,
      centerY - PASSAGE_WIDTH / 2,
      () => this.callbacks.onChangeFenceType(blockId, floor),
    );

    // Левый и правый пролёты
    const [leftX, leftY] = getPartPosition(...leftFlightPositions[direction]);
    addHit(PART_SIZE, PART_SIZE, leftX, leftY, () =>
      this.callbacks.onChangeFlightStatus(blockId, floor, "left_flight"),
    );
    const [rightX, rightY] = getPartPosition(...rightFlightPositions[direction]);
    addHit(PART_SIZE, PART_SIZE, rightX, rightY, () =>
      this.callbacks.onChangeFlightStatus(blockId, floor, "right_flight"),
    );

    // Средние пролёты (оба кликабельны, статус меняет только существующий)
    const middle1HasGap = !(
      block.is_middle_flight &&
      !block.is_pipe &&
      block.middle_flight !== undefined
    );
    const middle1 = middleFlightRect(direction, getPassageCells([3, 0])[direction], middle1HasGap);
    addHit(middle1.w, middle1.h, middle1.x, middle1.y, () =>
      this.callbacks.onChangeFlightStatus(blockId, floor, "middle_flight"),
    );
    const middle2 = middleFlightRect(direction, getPassageCells([3, 2])[direction], true);
    addHit(middle2.w, middle2.h, middle2.x, middle2.y, () =>
      this.callbacks.onChangeFlightStatus(blockId, floor, "middle_flight"),
    );
  }

  private destroyHitAreas() {
    for (const hit of this.hitAreas) hit.destroy();
    this.hitAreas = [];
  }

  setSelected(selected: boolean) {
    this.selection.visible = selected;
    if (!selected) this.selection.alpha = 1;
  }

  toggleSelectionAlpha() {
    this.selection.alpha = this.selection.alpha === 1 ? 0.3 : 1;
  }

  destroy() {
    this.destroyHitAreas();
    this.root.destroy({ children: true });
  }
}
