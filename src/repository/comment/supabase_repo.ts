// repository/comment/supabase_repo.ts
import { supabase } from "@/supabase";
import { useAuthorization } from "@/stores/authorization";
import type { CommentsStore } from "@/stores/comments";
import type { BlockUid } from "@/types/block";
import { type CommentCreateData, type CommentData, type CommentId } from "@/types/comment";
import type { CommentRepository, MapBounds } from "./repo";

/** Строка таблицы comments + поля автора, которые возвращают RPC-функции. */
interface DbCommentRow {
  id: CommentId;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string | null;
  author_avatar_url: string | null;
  text: string;
  parent_id: CommentId | null;
  root_id: CommentId | null;
  block_id: BlockUid | null;
  map_x: number | null;
  map_y: number | null;
  layer: number | null;
  expires_at: string | null;
}

/** Прямоугольник по умолчанию — вся карта (границы в «блочных» единицах). */
const DEFAULT_BOUNDS: MapBounds = {
  minX: -100_000,
  maxX: 100_000,
  minY: -100_000,
  maxY: 100_000,
};

const toComment = (row: DbCommentRow): CommentData => ({
  id: row.id,
  created_at: row.created_at,
  updated_at: row.updated_at,
  author_id: row.author_id,
  author_name: row.author_name ?? "Unknown",
  author_avatar_url: row.author_avatar_url ?? null,
  text: row.text,
  parent_id: row.parent_id,
  root_id: row.root_id ?? row.id,
  block_id: row.block_id,
  map_x: row.map_x,
  map_y: row.map_y,
  layer: row.layer,
  expires_at: row.expires_at,
});

export class SupabaseCommentRepository implements CommentRepository {
  private store!: CommentsStore;
  private channel: ReturnType<typeof supabase.channel> | null = null;

  async init(store: CommentsStore): Promise<void> {
    this.store = store;
    this.channel = supabase
      .channel("comments-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => {
        // Realtime-событие — сигнал «что-то изменилось»: перечитываем открытые выборки.
        // Комментариев немного, а в payload нет author_name/avatar_url, поэтому
        // проще и надёжнее перечитать данные, чем реконсилить по payload.
        void this.store.reloadAll();
      })
      .subscribe();
  }

  destroy(): void {
    if (this.channel) {
      void supabase.removeChannel(this.channel);
      this.channel = null;
    }
  }

  async getMapRoots(layer: number, bounds?: MapBounds): Promise<CommentData[]> {
    const { minX, maxX, minY, maxY } = bounds ?? DEFAULT_BOUNDS;
    const { data, error } = await supabase.rpc("get_map_roots", {
      p_layer: layer,
      p_min_x: Math.floor(minX),
      p_max_x: Math.ceil(maxX),
      p_min_y: Math.floor(minY),
      p_max_y: Math.ceil(maxY),
    });
    if (error) throw error;
    return (data as DbCommentRow[] | null)?.map(toComment) ?? [];
  }

  async getBlockComments(blockId: BlockUid): Promise<CommentData[]> {
    const { data, error } = await supabase.rpc("get_block_comments", {
      p_block_id: blockId,
    });
    if (error) throw error;
    return (data as DbCommentRow[] | null)?.map(toComment) ?? [];
  }

  async getCommentSubtree(rootId: CommentId): Promise<CommentData[]> {
    const { data, error } = await supabase.rpc("get_comment_subtree", {
      p_root_id: rootId,
    });
    if (error) throw error;
    return (data as DbCommentRow[] | null)?.map(toComment) ?? [];
  }

  async addComment(data: CommentCreateData): Promise<CommentData> {
    const user = useAuthorization().user;
    if (!user) throw new Error("Для создания комментария необходима авторизация");

    const { data: inserted, error } = await supabase
      .from("comments")
      .insert({
        author_id: user.id,
        text: data.text,
        parent_id: data.parent_id ?? null,
        block_id: data.block_id ?? null,
        map_x: data.map_x ?? null,
        map_y: data.map_y ?? null,
        layer: data.layer ?? null,
        expires_at: data.expires_at ?? null,
      })
      .select(
        "id, created_at, updated_at, author_id, text, parent_id, root_id, block_id, map_x, map_y, layer, expires_at",
      )
      .single();

    if (error) throw error;
    // В ответе INSERT нет данных автора — подставляем их из текущей сессии.
    return toComment({
      ...(inserted as DbCommentRow),
      author_name:
        user.user_metadata?.custom_claims?.global_name ??
        user.user_metadata?.name ??
        user.user_metadata?.full_name ??
        user.user_metadata?.username ??
        user.email ??
        "Unknown",
      author_avatar_url: user.user_metadata?.avatar_url ?? null,
    });
  }

  async deleteComment(id: CommentId): Promise<void> {
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) throw error;
  }
}
