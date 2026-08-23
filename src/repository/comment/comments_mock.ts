// repository/comment/comments_mock.ts
import type { CommentData } from "@/types/comment";

const hoursAgo = (hours: number): string => new Date(Date.now() - hours * 3_600_000).toISOString();

const base = (
  id: number,
  overrides: Partial<CommentData> & Pick<CommentData, "text">,
): CommentData => ({
  id,
  created_at: hoursAgo(1),
  updated_at: hoursAgo(1),
  author_id: "mock-user-1",
  author_name: "Картограф",
  author_avatar_url: null,
  parent_id: null,
  root_id: id,
  block_id: null,
  map_x: null,
  map_y: null,
  layer: null,
  expires_at: null,
  ...overrides,
});

/** Демо-данные для MockCommentRepository. */
export const generateMockComments = (): CommentData[] => [];
