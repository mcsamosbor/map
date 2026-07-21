import { supabase } from "@/supabase";
import type { Session, User } from "@supabase/supabase-js";
import { defineStore } from "pinia";

export const useAuthorization = defineStore("authorization", {
  state: () => {
    return {
      user: null as User | null,
      session: null as Session | null,
      roles: [] as string[],
    };
  },
  getters: {
    hasAnyRole:
      (state) =>
      (roles: string[]): boolean => {
        return roles.some((r) => state.roles.includes(r));
      },
    isEditor: (state) => {
      return ["editor", "admin"].some((r) => state.roles.includes(r));
    },
  },
  actions: {
    async setUser(user?: User | null) {
      const isOther = this.user?.id !== user?.id;
      this.user = user ?? null;
      if (isOther) {
        await this.updateRoles();
      }
    },
    async subscribe() {
      this.loadSession();
      const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
        this.session = newSession;
        this.setUser(this.session?.user);
      });
      const unsubscribe = data.subscription.unsubscribe;
      return unsubscribe;
    },
    async loadSession() {
      const { data } = await supabase.auth.getSession();
      this.session = data.session;
      await this.setUser(data.session?.user);
    },
    async signInDiscord() {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: window.location.origin, // куда после входа
        },
      });

      if (error) {
        console.error("Ошибка входа:", error.message);
        return;
      }

      // Перенаправляем пользователя на страницу Discord
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Ошибка выхода:", error.message);
    },
    async updateRoles() {
      if (!this.user) return;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role_id")
        .eq("user_id", this.user.id);
      if (error) return console.error(error);
      // if (!data) return;
      this.roles = data.map((row) => row.role_id);
    },
  },
});
