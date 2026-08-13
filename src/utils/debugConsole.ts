// Консольное API карты для картографов.
//
// Устанавливается в `window.mapDebug` при старте приложения (см. main.ts).
// Все функции безопасно вызывать из DevTools-консоли:
//
//   mapDebug.help()                 — справка по доступным командам
//   mapDebug.getBlocksCount()       — общее количество блоков
//   mapDebug.getCreatableBlocks()   — блоки с can_create_block !== false
//   mapDebug.listBlocks()           — таблица со всеми блоками
//
// Чтение данных доступно любому пользователю. Операции изменения
// (addBlock/updateBlock/deleteBlock и остальные сеттеры) требуют роль
// editor или admin — иначе в консоль выведется предупреждение.
import { useBlocksStore } from "@/stores/blocks";
import { useAuthorization } from "@/stores/authorization";
import { useTransitionsStore } from "@/stores/transitions";
import type { BlockRepository } from "@/repository/block/repo";
import {
  BlockDirections,
  BlockTypes,
  isBlockVisible,
  type BlockData,
  type BlockDirection,
  type BlockType,
  type BlockUid,
} from "@/types/block";

declare global {
  interface Window {
    mapDebug?: MapDebugConsole;
  }
}

const DEBUG_KEY = "mapDebug";
const VERSION = "1.0.0";

const STYLE_TITLE = "color: #4fc3f7; font-weight: bold; font-size: 15px;";
const STYLE_CODE = "color: #a5d6a7; font-weight: bold;";
const STYLE_MUTED = "color: #90a4ae;";

/** Сводная статистика по карте (getSummary). */
export interface BlockSummary {
  total: number;
  creatable: number;
  uncreatable: number;
  loading: boolean;
  error: string | null;
  transitionsCount: number;
  byType: Partial<Record<BlockType, number>>;
  byDirection: Partial<Record<BlockDirection, number>>;
}

/** Публичный интерфейс консольного API. */
export interface MapDebugConsole {
  /** Версия консольного API. */
  readonly version: string;
  /** Справка по доступным командам. */
  help(): void;
  /** Сырые pinia-сторы (для продвинутых манипуляций). */
  readonly stores: {
    readonly blocks: ReturnType<typeof useBlocksStore>;
    readonly transitions: ReturnType<typeof useTransitionsStore>;
    readonly authorization: ReturnType<typeof useAuthorization>;
  };

  // ==== Просмотр блоков ====

  /** Все блоки, загруженные в стор. */
  getAllBlocks(): BlockData[];
  getVisibleBlocks(): BlockData[];
  /** Блок по id (или undefined). */
  getBlock(id: BlockUid): BlockData | undefined;
  /** Общее количество блоков. */
  getBlocksCount(): number;
  /** Блоки, у которых `can_create_block !== false` (рядом можно создать новый блок). */
  getCreatableBlocks(): BlockData[];
  listCreatableBlocks(): void;
  /** Блоки, у которых `can_create_block === false`. */
  getUncreatableBlocks(): BlockData[];
  /** Поиск блоков по id, имени или типу. */
  findBlocks(query: string | number): BlockData[];
  /** Блоки конкретного типа (residential, frozen, infected, destroyed, mushroom). */
  findBlocksByType(type: BlockType): BlockData[];
  /** Краткий список блоков (таблица в консоли). */
  listBlocks(blocks?: BlockData[]): void;
  /** Сводная статистика по карте. */
  getSummary(): BlockSummary;

  // ==== Манипуляции (только editor/admin) ====

  /** Создать новый блок. */
  addBlock(data: Omit<BlockData, "id">): Promise<BlockData | undefined>;
  /** Полностью заменить блок. */
  updateBlock(block: BlockData): Promise<void>;
  /** Удалить блок. */
  deleteBlock(id: BlockUid): Promise<void>;
  /** Задать `can_create_block` для блока и сохранить. */
  setCanCreateBlock(id: BlockUid, value: boolean): Promise<void>;
  /** Переместить блок в мировые координаты и сохранить. */
  setPosition(id: BlockUid, x: number, y: number): Promise<void>;
  /** Переименовать блок и сохранить. */
  setName(id: BlockUid, name: string): Promise<void>;
  /** Перезагрузить блоки с сервера. */
  reloadBlocks(): Promise<void>;
}

function getStores() {
  const blocksStore = useBlocksStore();
  const transitionsStore = useTransitionsStore();
  const authorization = useAuthorization();
  return { blocksStore, transitionsStore, authorization };
}

function requireEditor(authorization: ReturnType<typeof useAuthorization>): boolean {
  if (authorization.isEditor) return true;
  console.warn(
    "%c[mapDebug] Недостаточно прав для изменения данных. Нужна роль editor или admin.",
    STYLE_MUTED,
  );
  return false;
}

function createDebugConsole(): MapDebugConsole {
  return {
    version: VERSION,

    help() {
      console.log(`%c[mapDebug] Консольное API карты v${VERSION}`, STYLE_TITLE);
      console.log("");
      console.log("%cПросмотр данных:", STYLE_CODE);
      console.log("  mapDebug.getAllBlocks()         — все блоки");
      console.log("  mapDebug.getBlock(id)           — блок по id");
      console.log("  mapDebug.getBlocksCount()       — общее количество блоков");
      console.log("  mapDebug.getCreatableBlocks()   — блоки с can_create_block !== false");
      console.log("  mapDebug.getUncreatableBlocks() — блоки с can_create_block === false");
      console.log('  mapDebug.findBlocks("запрос")    — поиск по id/имени/типу');
      console.log('  mapDebug.findBlocksByType("frozen") — блоки конкретного типа');
      console.log("  mapDebug.listBlocks()           — таблица со всеми блоками");
      console.log("  mapDebug.getSummary()           — сводная статистика");
      console.log("");
      console.log("%cМанипуляции (только editor/admin):", STYLE_CODE);
      console.log("  mapDebug.addBlock(data)");
      console.log("  mapDebug.updateBlock(block)");
      console.log("  mapDebug.deleteBlock(id)");
      console.log("  mapDebug.setCanCreateBlock(id, true | false)");
      console.log("  mapDebug.setPosition(id, x, y)");
      console.log('  mapDebug.setName(id, "имя")');
      console.log("  mapDebug.reloadBlocks()");
      console.log("");
      console.log("%cСырые сторы:", STYLE_CODE);
      console.log("  mapDebug.stores.blocks        — pinia-стор блоков");
      console.log("  mapDebug.stores.transitions   — pinia-стор переходов");
      console.log("  mapDebug.stores.authorization — стор авторизации/ролей");
    },

    get stores() {
      const { blocksStore, transitionsStore, authorization } = getStores();
      return { blocks: blocksStore, transitions: transitionsStore, authorization };
    },

    getAllBlocks: () => getStores().blocksStore.blocks,
    getVisibleBlocks() {
      return this.getAllBlocks().filter((block) =>
        isBlockVisible(block, getStores().blocksStore.layer),
      );
    },

    getBlock: (id) => getStores().blocksStore.getBlock(id),

    getBlocksCount: () => getStores().blocksStore.blocks.length,

    getCreatableBlocks: () =>
      getStores().blocksStore.blocks.filter((block) => block.can_create_block !== false),

    getUncreatableBlocks: () =>
      getStores().blocksStore.blocks.filter((block) => block.can_create_block === false),

    findBlocks(query) {
      const blocks = getStores().blocksStore.blocks;
      const q = String(query).trim().toLowerCase();
      if (!q) return blocks;
      const numericId = Number(query);
      return blocks.filter((block) => {
        if (Number.isInteger(numericId) && block.id === numericId) return true;
        if (block.name.toLowerCase().includes(q)) return true;
        if ((block.type ?? "").toLowerCase().includes(q)) return true;
        return false;
      });
    },

    findBlocksByType(type) {
      return getStores().blocksStore.blocks.filter((block) => block.type === type);
    },

    listCreatableBlocks() {
      const blocks = this.getCreatableBlocks();
      this.listBlocks(blocks);
    },

    listBlocks(blocks = getStores().blocksStore.blocks) {
      console.log(`[mapDebug] Блоков на карте: ${blocks.length}`);
      if (blocks.length === 0) return;
      console.table(
        blocks.map((block) => ({
          id: block.id,
          name: block.name,
          type: block.type ?? "-",
          x: block.position_x,
          y: block.position_y,
          layer: block.layer,
          direction: block.direction,
          floors: `${block.min_floor ?? 0}..${block.max_floor ?? 0}`,
          can_create_block: block.can_create_block !== false,
          places: block.places.length,
        })),
      );
    },

    getSummary() {
      const { blocksStore, transitionsStore } = getStores();
      const blocks = blocksStore.blocks;
      const creatable = blocks.filter((block) => block.can_create_block !== false);

      const byType: Partial<Record<BlockType, number>> = {};
      const byDirection: Partial<Record<BlockDirection, number>> = {};
      for (const type of BlockTypes) byType[type] = 0;
      for (const direction of BlockDirections) byDirection[direction] = 0;
      for (const block of blocks) {
        const typeKey = block.type ?? "residential";
        byType[typeKey] = (byType[typeKey] ?? 0) + 1;
        byDirection[block.direction] = (byDirection[block.direction] ?? 0) + 1;
      }

      return {
        total: blocks.length,
        creatable: creatable.length,
        uncreatable: blocks.length - creatable.length,
        loading: blocksStore.loading,
        error: blocksStore.error,
        transitionsCount: transitionsStore.transitions.length,
        byType,
        byDirection,
      };
    },

    async addBlock(data) {
      const { blocksStore, authorization } = getStores();
      if (!requireEditor(authorization)) return undefined;
      const created = await blocksStore.addBlock(data);
      console.log("%c[mapDebug] Блок создан:", STYLE_CODE, created);
      return created;
    },

    async updateBlock(block) {
      const { blocksStore, authorization } = getStores();
      if (!requireEditor(authorization)) return;
      await blocksStore.updateBlock(block);
      console.log(`%c[mapDebug] Блок #${block.id} обновлён`, STYLE_CODE);
    },

    async deleteBlock(id) {
      const { blocksStore, authorization } = getStores();
      if (!requireEditor(authorization)) return;
      await blocksStore.deleteBlock(id);
      console.log(`%c[mapDebug] Блок #${id} удалён`, STYLE_CODE);
    },

    async setCanCreateBlock(id, value) {
      const { blocksStore, authorization } = getStores();
      if (!requireEditor(authorization)) return;
      const block = blocksStore.getBlock(id);
      if (!block) {
        console.warn(`[mapDebug] Блок #${id} не найден`);
        return;
      }
      block.can_create_block = value;
      await blocksStore.updateBlock(block);
      console.log(`%c[mapDebug] Блок #${id}: can_create_block = ${value}`, STYLE_CODE);
    },

    async setPosition(id, x, y) {
      const { blocksStore, authorization } = getStores();
      if (!requireEditor(authorization)) return;
      const block = blocksStore.getBlock(id);
      if (!block) {
        console.warn(`[mapDebug] Блок #${id} не найден`);
        return;
      }
      block.position_x = x;
      block.position_y = y;
      await blocksStore.updateBlock(block);
      console.log(`%c[mapDebug] Блок #${id} перемещён на (${x}, ${y})`, STYLE_CODE);
    },

    async setName(id, name) {
      const { blocksStore, authorization } = getStores();
      if (!requireEditor(authorization)) return;
      const block = blocksStore.getBlock(id);
      if (!block) {
        console.warn(`[mapDebug] Блок #${id} не найден`);
        return;
      }
      block.name = name;
      await blocksStore.updateBlock(block);
      console.log(`%c[mapDebug] Блок #${id} переименован в "${name}"`, STYLE_CODE);
    },

    async reloadBlocks() {
      const { blocksStore } = getStores();
      const repository = (blocksStore as unknown as { repository: BlockRepository | null })
        .repository;
      if (!repository) {
        console.warn("[mapDebug] Репозиторий блоков не установлен — перезагрузка невозможна");
        return;
      }
      await blocksStore.setRepository(repository);
      console.log(
        `%c[mapDebug] Блоки перезагружены с сервера: ${blocksStore.blocks.length}`,
        STYLE_CODE,
      );
    },
  };
}

/**
 * Устанавливает консольное API карты в `window.mapDebug`.
 * Повторные вызовы безопасны (ничего не перезаписывают).
 */
export function installDebugConsole(): MapDebugConsole {
  if (window.mapDebug) {
    console.log("%c[mapDebug] Консольное API уже установлено", STYLE_MUTED);
    return window.mapDebug;
  }
  const api = createDebugConsole();
  window.mapDebug = api;
  console.log(
    `%c[mapDebug] Консольное API карты установлено (${DEBUG_KEY}). Введите %cmapDebug.help()%c для справки.`,
    STYLE_TITLE,
    STYLE_CODE,
    STYLE_MUTED,
  );
  return api;
}
