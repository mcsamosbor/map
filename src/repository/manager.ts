import { useBlocksStore } from "@/stores/blocks";
import { useTransitionsStore } from "@/stores/transitions";
import { useCommentsStore } from "@/stores/comments";
import { useShopItemsStore } from "@/stores/shopItems";
import { MockBlockRepository } from "@/repository/block/mock_repo";
import type { BlockRepository } from "@/repository/block/repo";
import { SupabaseBlockRepository } from "@/repository/block/supabase_repo";
import { MockTransitionRepository } from "@/repository/transition/mock_repo";
import type { TransitionRepository } from "@/repository/transition/repo";
import { SupabaseTransitionRepository } from "@/repository/transition/supabase_repo";
import { MockCommentRepository } from "@/repository/comment/mock_repo";
import type { CommentRepository } from "@/repository/comment/repo";
import { SupabaseCommentRepository } from "@/repository/comment/supabase_repo";
import { MockShopItemsRepository } from "@/repository/shop_items/mock_repo";
import type { ShopItemsRepository } from "@/repository/shop_items/repo";
import { SupabaseShopItemsRepository } from "@/repository/shop_items/supabase_repo";

export type RepositoryType = "mock" | "supabase";

export class RepositoryManager {
  private currentType: RepositoryType | null = null;

  private mockBlockRepo?: MockBlockRepository;
  private supabaseBlockRepo?: SupabaseBlockRepository;
  private mockTransitionRepo?: MockTransitionRepository;
  private supabaseTransitionRepo?: SupabaseTransitionRepository;
  private mockCommentRepo?: MockCommentRepository;
  private supabaseCommentRepo?: SupabaseCommentRepository;
  private mockShopItemsRepo?: MockShopItemsRepository;
  private supabaseShopItemsRepo?: SupabaseShopItemsRepository;

  /** Лениво получить или создать MockBlockRepository */
  private getMockBlockRepo(): MockBlockRepository {
    if (!this.mockBlockRepo) {
      this.mockBlockRepo = new MockBlockRepository();
    }
    return this.mockBlockRepo;
  }

  /** Лениво получить или создать SupabaseBlockRepository */
  private getSupabaseBlockRepo(): SupabaseBlockRepository {
    if (!this.supabaseBlockRepo) {
      this.supabaseBlockRepo = new SupabaseBlockRepository();
    }
    return this.supabaseBlockRepo;
  }

  /** Лениво получить или создать MockTransitionRepository */
  private getMockTransitionRepo(): MockTransitionRepository {
    if (!this.mockTransitionRepo) {
      this.mockTransitionRepo = new MockTransitionRepository();
    }
    return this.mockTransitionRepo;
  }

  /** Лениво получить или создать SupabaseTransitionRepository */
  private getSupabaseTransitionRepo(): SupabaseTransitionRepository {
    if (!this.supabaseTransitionRepo) {
      this.supabaseTransitionRepo = new SupabaseTransitionRepository();
    }
    return this.supabaseTransitionRepo;
  }

  /** Лениво получить или создать MockCommentRepository */
  private getMockCommentRepo(): MockCommentRepository {
    if (!this.mockCommentRepo) {
      this.mockCommentRepo = new MockCommentRepository();
    }
    return this.mockCommentRepo;
  }

  /** Лениво получить или создать SupabaseCommentRepository */
  private getSupabaseCommentRepo(): SupabaseCommentRepository {
    if (!this.supabaseCommentRepo) {
      this.supabaseCommentRepo = new SupabaseCommentRepository();
    }
    return this.supabaseCommentRepo;
  }

  /** Лениво получить или создать MockShopItemsRepository */
  private getMockShopItemsRepo(): MockShopItemsRepository {
    if (!this.mockShopItemsRepo) {
      this.mockShopItemsRepo = new MockShopItemsRepository();
    }
    return this.mockShopItemsRepo;
  }

  /** Лениво получить или создать SupabaseShopItemsRepository */
  private getSupabaseShopItemsRepo(): SupabaseShopItemsRepository {
    if (!this.supabaseShopItemsRepo) {
      this.supabaseShopItemsRepo = new SupabaseShopItemsRepository();
    }
    return this.supabaseShopItemsRepo;
  }

  /**
   * Переключает все сторы (blocks, transitions, comments, shopItems) на репозитории указанного типа.
   * Если тип уже установлен, повторного переключения не происходит.
   */
  async changeRepositories(type: RepositoryType) {
    if (this.currentType === type) return;

    const blocksStore = useBlocksStore();
    const transitionsStore = useTransitionsStore();
    const commentsStore = useCommentsStore();
    const shopItemsStore = useShopItemsStore();

    let blockRepo: BlockRepository;
    let transitionRepo: TransitionRepository;
    let commentRepo: CommentRepository;
    let shopItemsRepo: ShopItemsRepository;

    if (type === "mock") {
      blockRepo = this.getMockBlockRepo();
      transitionRepo = this.getMockTransitionRepo();
      commentRepo = this.getMockCommentRepo();
      shopItemsRepo = this.getMockShopItemsRepo();
    } else {
      blockRepo = this.getSupabaseBlockRepo();
      transitionRepo = this.getSupabaseTransitionRepo();
      commentRepo = this.getSupabaseCommentRepo();
      shopItemsRepo = this.getSupabaseShopItemsRepo();
    }

    await Promise.all([
      blocksStore.setRepository(blockRepo),
      transitionsStore.setRepository(transitionRepo),
      commentsStore.setRepository(commentRepo),
      shopItemsStore.setRepository(shopItemsRepo),
    ]);

    this.currentType = type;
    console.log(`Репозитории переключены на ${type}`);
  }
}
