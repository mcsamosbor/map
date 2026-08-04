import { useBlocksStore } from "@/stores/blocks";
import { useTransitionsStore } from "@/stores/transitions";
import { MockBlockRepository } from "@/repository/block/mock_repo";
import type { BlockRepository } from "@/repository/block/repo";
import { SupabaseBlockRepository } from "@/repository/block/supabase_repo";
import { MockTransitionRepository } from "@/repository/transition/mock_repo";
import type { TransitionRepository } from "@/repository/transition/repo";
import { SupabaseTransitionRepository } from "@/repository/transition/supabase_repo";

export type RepositoryType = "mock" | "supabase";

export class RepositoryManager {
  private currentType: RepositoryType | null = null;

  private mockBlockRepo?: MockBlockRepository;
  private supabaseBlockRepo?: SupabaseBlockRepository;
  private mockTransitionRepo?: MockTransitionRepository;
  private supabaseTransitionRepo?: SupabaseTransitionRepository;

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

  /**
   * Переключает оба стора (blocks и transitions) на репозитории указанного типа.
   * Если тип уже установлен, повторного переключения не происходит.
   */
  async changeRepositories(type: RepositoryType) {
    if (this.currentType === type) return;

    const blocksStore = useBlocksStore();
    const transitionsStore = useTransitionsStore();

    let blockRepo: BlockRepository;
    let transitionRepo: TransitionRepository;

    if (type === "mock") {
      blockRepo = this.getMockBlockRepo();
      transitionRepo = this.getMockTransitionRepo();
    } else {
      blockRepo = this.getSupabaseBlockRepo();
      transitionRepo = this.getSupabaseTransitionRepo();
    }

    await Promise.all([
      blocksStore.setRepository(blockRepo),
      transitionsStore.setRepository(transitionRepo),
    ]);

    this.currentType = type;
    console.log(`Репозитории переключены на ${type}`);
  }
}
