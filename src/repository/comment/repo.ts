// repository/comment/repo.ts
import type { BlockUid } from "@/types/block";
import type { CommentCreateData, CommentData, CommentId } from "@/types/comment";
import type { CommentsStore } from "@/stores/comments";

/** Прямоугольник мировых координат в «блочных» единицах (map_x/map_y). */
export interface MapBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CommentRepository {
  /** Инициализация: подписка на realtime-изменения (если используется). */
  init(store: CommentsStore): Promise<void>;
  /** Отписка от realtime-канала и очистка. */
  destroy(): void;

  /** Корневые комментарии карты для слоя в пределах прямоугольника. */
  getMapRoots(layer: number, bounds?: MapBounds): Promise<CommentData[]>;
  /** Все комментарии блока (корни и ответы). */
  getBlockComments(blockId: BlockUid): Promise<CommentData[]>;
  /** Все комментарии треда (корень и ответы). */
  getCommentSubtree(rootId: CommentId): Promise<CommentData[]>;

  /** Создать комментарий. Возвращает созданный (с реальным id из БД). */
  addComment(data: CommentCreateData): Promise<CommentData>;
  /** Удалить комментарий (автор или модератор). */
  deleteComment(id: CommentId): Promise<void>;
}
