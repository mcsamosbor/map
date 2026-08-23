// repository/comment/mock_repo.ts
import type { BlockUid } from "@/types/block";
import {
  isCommentExpired,
  type CommentCreateData,
  type CommentData,
  type CommentId,
} from "@/types/comment";
import { useAuthorization } from "@/stores/authorization";
import type { CommentsStore } from "@/stores/comments";
import { generateMockComments } from "./comments_mock";
import type { CommentRepository, MapBounds } from "./repo";

const delay = (ms = 150): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

export class MockCommentRepository implements CommentRepository {
  private store!: CommentsStore;
  private comments: CommentData[] = [];
  private nextId = 1;

  async init(store: CommentsStore): Promise<void> {
    this.store = store;
    this.comments = generateMockComments();
    this.nextId = Math.max(0, ...this.comments.map((c) => c.id)) + 1;
    await delay();
  }

  destroy(): void {
    // нечего очищать
  }

  async getMapRoots(layer: number, bounds?: MapBounds): Promise<CommentData[]> {
    await delay();
    return this.comments.filter((c) => {
      if (c.parent_id !== null || c.block_id !== null) return false;
      if (c.layer !== layer) return false;
      if (isCommentExpired(c)) return false;
      if (c.map_x === null || c.map_y === null) return false;
      if (bounds) {
        if (c.map_x < bounds.minX || c.map_x > bounds.maxX) return false;
        if (c.map_y < bounds.minY || c.map_y > bounds.maxY) return false;
      }
      return true;
    });
  }

  async getBlockComments(blockId: BlockUid): Promise<CommentData[]> {
    await delay();
    // Ответы не хранят block_id (по constraint comments_location_check),
    // поэтому находим корни блока и возвращаем весь их тред по root_id.
    const roots = this.comments.filter(
      (c) => c.block_id === blockId && c.parent_id === null && !isCommentExpired(c),
    );
    const rootIds = new Set<CommentId>(roots.map((c) => c.id));
    return this.comments.filter((c) => rootIds.has(c.root_id) && !isCommentExpired(c));
  }

  async getCommentSubtree(rootId: CommentId): Promise<CommentData[]> {
    await delay();
    return this.comments.filter((c) => c.root_id === rootId && !isCommentExpired(c));
  }

  async addComment(data: CommentCreateData): Promise<CommentData> {
    await delay();
    const authorization = useAuthorization();
    const id = this.nextId++;
    const now = new Date().toISOString();
    const parent =
      data.parent_id != null ? this.comments.find((c) => c.id === data.parent_id) : undefined;
    const comment: CommentData = {
      id,
      created_at: now,
      updated_at: now,
      author_id: authorization.user?.id ?? "mock-user-1",
      author_name: authorization.user?.user_metadata.custom_claims.global_name ?? "Картограф",
      author_avatar_url: authorization.user?.user_metadata.avatar_url ?? null,
      text: data.text,
      parent_id: data.parent_id ?? null,
      root_id: parent ? parent.root_id : id,
      block_id: data.block_id ?? null,
      map_x: data.map_x ?? null,
      map_y: data.map_y ?? null,
      layer: data.layer ?? null,
      expires_at: data.expires_at ?? null,
    };
    this.comments.push(comment);
    return comment;
  }

  async deleteComment(id: CommentId): Promise<void> {
    await delay();
    this.comments = this.comments.filter((c) => c.id !== id);
  }
}
