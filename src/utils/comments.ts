// utils/comments.ts
import type { CommentData } from "@/types/comment";

/** Срок жизни временного комментария по умолчанию. */
export const TEMPORARY_COMMENT_HOURS = 24;

/** Порог объединения близких комментариев карты в «облачко» (в блочных координатах карты). */
export const MAP_COMMENT_MERGE_DISTANCE = 0.2;

/** «Облачко» — группа близких корневых комментариев карты. */
export interface MapCommentCloud {
  /** Самый старый корневой комментарий — якорь; облачко рисуется в его позиции. */
  anchor: CommentData;
  /** Все корневые комментарии облачка (включая якорь), отсортированы по created_at asc. */
  members: CommentData[];
}

const mapPointDistance = (a: CommentData, b: CommentData): number => {
  if (a.map_x === null || a.map_y === null || b.map_x === null || b.map_y === null) {
    return Infinity;
  }
  return Math.hypot(a.map_x - b.map_x, a.map_y - b.map_y);
};

/**
 * Объединяет близкие корневые комментарии карты в «облачка».
 *
 * Сортирует по дате создания (старые первыми), затем каждый следующий комментарий
 * вливается в самое старое облачко, если расстояние до его якоря строго меньше
 * MAP_COMMENT_MERGE_DISTANCE, иначе образует новое облачко.
 */
export const clusterMapComments = (comments: CommentData[]): MapCommentCloud[] => {
  const sorted = [...comments].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  const clouds: MapCommentCloud[] = [];
  for (const comment of sorted) {
    const cloud = clouds.find(
      (c) => mapPointDistance(c.anchor, comment) < MAP_COMMENT_MERGE_DISTANCE,
    );
    if (cloud) {
      cloud.members.push(comment);
    } else {
      clouds.push({ anchor: comment, members: [comment] });
    }
  }
  return clouds;
};

/** ISO-дата истечения временного комментария (по умолчанию через 24 часа). */
export const getTemporaryExpiry = (hours = TEMPORARY_COMMENT_HOURS): string =>
  new Date(Date.now() + hours * 3_600_000).toISOString();

/** Человекочитаемая относительная дата комментария. */
export const formatCommentDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMinutes < 1) return "только что";
  if (diffMinutes < 60) return `${diffMinutes} мин. назад`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} ч. назад`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} дн. назад`;

  return date.toLocaleDateString("ru-RU");
};
