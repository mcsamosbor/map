import { supabase } from "@/supabase";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { TransitionRepository } from "@/repository/transition/repo";
import type { TransitionData, TransitionId, DbTransitionRow } from "@/types/transition";
import type { TransitionsStore } from "@/stores/transitions";

export class SupabaseTransitionRepository implements TransitionRepository {
  private store!: TransitionsStore;
  private unsubscribeFn?: () => void;

  async init(store: TransitionsStore): Promise<void> {
    this.store = store;

    // 1. Загружаем начальные данные
    const { data, error } = await supabase
      .from("transitions")
      .select("id, from_block_id, to_block_id, from_floor, from_position, to_floor, to_position")
      .order("id", { ascending: true });

    if (error) throw error;

    this.store.transitions = (data as DbTransitionRow[]).map((row) => ({
      ...row,
    }));

    // 2. Подписываемся на realtime-изменения
    const channel = supabase
      .channel("transitions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transitions" },
        (payload: RealtimePostgresChangesPayload<DbTransitionRow>) => {
          this.handleRealtimePayload(payload);
        },
      )
      .subscribe();

    this.unsubscribeFn = () => {
      supabase.removeChannel(channel);
    };
  }

  destroy(): void {
    this.unsubscribeFn?.();
  }

  // === Приватный обработчик realtime-событий ===
  private handleRealtimePayload(payload: RealtimePostgresChangesPayload<DbTransitionRow>) {
    const { eventType, new: newRow, old } = payload;

    // Если переход локально изменён (правки ещё не отправлены на сервер) —
    // игнорируем realtime-события, иначе серверные данные затрут/восстановят
    // локальные изменения (например, удалённый локально переход вернётся на карту).
    if (
      (eventType === "INSERT" || eventType === "UPDATE") &&
      newRow &&
      this.store.editedTransitions.has(newRow.id)
    ) {
      return;
    }

    switch (eventType) {
      case "INSERT":
        if (newRow) {
          // Добавляем только если такого id ещё нет (защита от дублирования)
          if (!this.store.transitions.find((t) => t.id === newRow.id)) {
            this.store.transitions.push({ ...newRow });
          }
        }
        break;

      case "UPDATE":
        if (newRow) {
          const index = this.store.transitions.findIndex((t) => t.id === newRow.id);
          if (index !== -1) {
            this.store.transitions[index] = { ...newRow };
          }
        }
        break;

      case "DELETE":
        if (old) {
          // Переход уже локально помечен на удаление — состояние уже синхронизировано
          if (this.store.editedTransitions.has(old.id!)) {
            return;
          }
          this.store.transitions = this.store.transitions.filter((t) => t.id !== old.id);
        }
        break;
    }
  }

  // === CRUD-операции ===
  async addTransition(data: Omit<TransitionData, "id">): Promise<TransitionData> {
    // Вставляем запись и сразу получаем её с новым id
    const { data: newRow, error } = await supabase
      .from("transitions")
      .insert({
        from_block_id: data.from_block_id,
        to_block_id: data.to_block_id,
        from_floor: data.from_floor,
        from_position: data.from_position,
        to_floor: data.to_floor,
        to_position: data.to_position,
      })
      .select("*")
      .single();

    if (error) throw error;

    const newTransition = newRow as TransitionData;

    // Добавляем локально (realtime-канал может прислать дубликат позже,
    // но проверка в handleRealtimePayload предотвратит повтор)
    this.store.transitions.push(newTransition);

    return newTransition;
  }

  async removeTransition(transitionId: TransitionId): Promise<void> {
    const { error } = await supabase.from("transitions").delete().eq("id", transitionId);

    if (error) throw error;

    // Удаляем локально (realtime-событие DELETE может прийти позже,
    // но повторное удаление безопасно)
    this.store.transitions = this.store.transitions.filter((t) => t.id !== transitionId);
  }
}
