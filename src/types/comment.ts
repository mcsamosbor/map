// types/comment.ts
import type { BlockUid } from "./block";

export type CommentId = number;

/**
 * Комментарий может быть привязан либо к блоку, либо к точке карты.
 * Для точки карты координаты хранятся в «блочных» единицах:
 *   map_x = worldPos.x / CELL_SIZE, рендер: map_x * CELL_SIZE.
 */
export interface CommentData {
  id: CommentId;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string;
  author_avatar_url: string | null;
  text: string;
  /** null — корневой комментарий */
  parent_id: CommentId | null;
  /** id корневого комментария треды (проставляется серверным триггером) */
  root_id: CommentId;
  block_id: BlockUid | null;
  map_x: number | null;
  map_y: number | null;
  layer: number | null;
  /** если задан — временный комментарий, скрывается после этой даты */
  expires_at: string | null;
}

/** Входные данные для создания комментария. */
export interface CommentCreateData {
  text: string;
  parent_id?: CommentId | null;
  block_id?: BlockUid | null;
  map_x?: number | null;
  map_y?: number | null;
  layer?: number | null;
  expires_at?: string | null;
}

/** Временный комментарий: expires_at задан и ещё не наступил. */
export const isCommentTemporary = (comment: CommentData): boolean =>
  comment.expires_at !== null && new Date(comment.expires_at).getTime() > Date.now();

/** Истёкший временный комментарий (обычно не должен попадать в выборки). */
export const isCommentExpired = (comment: CommentData): boolean =>
  comment.expires_at !== null && new Date(comment.expires_at).getTime() <= Date.now();

export interface CommentTreeNode {
  comment: CommentData;
  children: CommentTreeNode[];
}

/**
 * Строит дерево комментариев из плоского списка.
 * Плоский список должен приходить от RPC уже отсортированным по created_at asc,
 * поэтому порядок в дереве сохраняется (дети добавляются по мере чтения).
 */
export const buildCommentTree = (comments: CommentData[]): CommentTreeNode[] => {
  const nodes = new Map<CommentId, CommentTreeNode>();
  for (const comment of comments) {
    nodes.set(comment.id, { comment, children: [] });
  }

  const roots: CommentTreeNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.comment.parent_id != null ? nodes.get(node.comment.parent_id) : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
};
