import type { TransitionRepository } from "@/repository/transition/repo";
import type { TransitionData, TransitionId } from "@/types/transition";
import type { TransitionsStore } from "@/stores/transitions";

export class MockTransitionRepository implements TransitionRepository {
  private store!: TransitionsStore;
  private nextId = 1;

  async init(store: TransitionsStore): Promise<void> {
    this.store = store;
    // Стартуем с пустым списком или с каким-то начальным
    store.transitions = [];
  }

  destroy(): void {}

  async addTransition(data: Omit<TransitionData, "id">): Promise<TransitionData> {
    const newTransition: TransitionData = {
      ...data,
      id: this.nextId++,
    };
    this.store.transitions.push(newTransition);
    return newTransition;
  }

  async removeTransition(transitionId: TransitionId): Promise<void> {
    this.store.transitions = this.store.transitions.filter((t) => t.id !== transitionId);
  }
}
