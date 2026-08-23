// stores/comments.ts
import { defineStore } from "pinia";
import type { CommentRepository, MapBounds } from "@/repository/comment/repo";
import type { BlockUid } from "@/types/block";
import {
  buildCommentTree,
  type CommentCreateData,
  type CommentData,
  type CommentId,
  type CommentTreeNode,
} from "@/types/comment";
import { useBlocksStore } from "@/stores/blocks";

/** Состояние стора, которое используют репозитории (по аналогии с BlocksStore). */
export interface CommentsStore {
  repository: CommentRepository | null;
  mapRoots: CommentData[];
  mapLayer: number;
  mapBounds: MapBounds | null;
  blockComments: Record<BlockUid, CommentData[]>;
  threads: Record<CommentId, CommentData[]>;
  openThreadRootIds: CommentId[];
  loading: boolean;
  error: string | null;
  reloadAll(): Promise<void>;
}

/** Чистое состояние (без методов) для state-фабрики. */
interface CommentsState {
  repository: CommentRepository | null;
  mapRoots: CommentData[];
  mapLayer: number;
  mapBounds: MapBounds | null;
  blockComments: Record<BlockUid, CommentData[]>;
  threads: Record<CommentId, CommentData[]>;
  openThreadRootIds: CommentId[];
  loading: boolean;
  error: string | null;
}

export const useCommentsStore = defineStore("comments", {
  state: (): CommentsState => ({
    repository: null,
    mapRoots: [],
    mapLayer: 0,
    mapBounds: null,
    blockComments: {},
    threads: {},
    openThreadRootIds: [],
    loading: false,
    error: null,
  }),
  getters: {
    /** Корневые комментарии открытого облачка (в порядке открытия; якорь — первый). */
    openThreadRoots: (state): CommentData[] => {
      return state.openThreadRootIds
        .map((id) => state.mapRoots.find((c) => c.id === id))
        .filter((c): c is CommentData => c !== undefined);
    },
    /** Дерево комментариев конкретного корня (для открытых тредов). */
    threadTreeFor:
      (state) =>
      (rootId: CommentId): CommentTreeNode[] => {
        const list = state.threads[rootId];
        return list ? buildCommentTree(list) : [];
      },
    /** Корневые комментарии карты для конкретного слоя. */
    mapRootsForLayer: (state) => {
      return (layer: number): CommentData[] => state.mapRoots.filter((c) => c.layer === layer);
    },
    /** Дерево комментариев блока. */
    blockCommentsTree: (state) => {
      return (blockId: BlockUid): CommentTreeNode[] => {
        const list = state.blockComments[blockId];
        return list ? buildCommentTree(list) : [];
      };
    },
  },
  actions: {
    async setRepository(newRepo: CommentRepository): Promise<void> {
      this.loading = true;
      this.error = null;
      if (this.repository) this.repository.destroy();
      this.repository = newRepo;
      this.mapRoots = [];
      this.blockComments = {};
      this.threads = {};
      this.openThreadRootIds = [];
      try {
        await newRepo.init(this);
        await this.loadMapRoots(useBlocksStore().layer);
      } catch (err) {
        this.error = getErrorMessage(err);
      } finally {
        this.loading = false;
      }
    },
    destroyRepository(): void {
      this.repository?.destroy();
      this.repository = null;
      this.mapRoots = [];
      this.blockComments = {};
      this.threads = {};
      this.openThreadRootIds = [];
      this.loading = false;
      this.error = null;
    },

    async loadMapRoots(layer: number, bounds?: MapBounds): Promise<void> {
      if (!this.repository) return;
      this.mapLayer = layer;
      if (bounds) this.mapBounds = bounds;
      try {
        this.mapRoots = await this.repository.getMapRoots(
          layer,
          bounds ?? this.mapBounds ?? undefined,
        );
      } catch (err) {
        this.error = getErrorMessage(err);
      }
    },

    async loadBlockComments(blockId: BlockUid): Promise<void> {
      if (!this.repository) return;
      try {
        this.blockComments[blockId] = await this.repository.getBlockComments(blockId);
      } catch (err) {
        this.error = getErrorMessage(err);
      }
    },

    async loadThread(rootId: CommentId): Promise<void> {
      if (!this.repository) return;
      try {
        const list = await this.repository.getCommentSubtree(rootId);
        this.threads[rootId] = list;
        // Корень исчез (удалён модератором или истёк) — убираем маркер и закрываем панель.
        if (!list.some((c) => c.id === rootId)) {
          this.mapRoots = this.mapRoots.filter((c) => c.id !== rootId);
          this.openThreadRootIds = this.openThreadRootIds.filter((id) => id !== rootId);
        }
      } catch (err) {
        this.error = getErrorMessage(err);
      }
    },

    openThread(rootIds: CommentId | CommentId[]): void {
      this.openThreadRootIds = Array.isArray(rootIds) ? rootIds : [rootIds];
      for (const rootId of this.openThreadRootIds) {
        if (!this.threads[rootId]) {
          void this.loadThread(rootId);
        }
      }
    },

    closeThread(): void {
      this.openThreadRootIds = [];
    },

    async addComment(data: CommentCreateData): Promise<CommentData> {
      if (!this.repository) throw new Error("Репозиторий комментариев не установлен");
      const comment = await this.repository.addComment(data);
      // Перечитываем открытые выборки: сервер вернёт актуальные root_id и имя автора.
      await this.reloadAll();
      return comment;
    },

    async deleteComment(id: CommentId): Promise<void> {
      if (!this.repository) throw new Error("Репозиторий комментариев не установлен");
      await this.repository.deleteComment(id);
      await this.reloadAll();
    },

    /** Перечитать все открытые данные: маркеры карты, тред, комментарии блоков. */
    async reloadAll(): Promise<void> {
      const requests: Promise<void>[] = [this.loadMapRoots(this.mapLayer)];
      for (const rootId of this.openThreadRootIds) {
        requests.push(this.loadThread(rootId));
      }
      for (const blockId of Object.keys(this.blockComments)) {
        requests.push(this.loadBlockComments(Number(blockId)));
      }
      await Promise.all(requests);
    },
  },
});

const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : "Неизвестная ошибка";
