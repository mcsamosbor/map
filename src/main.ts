import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "@/App.vue";
import router from "@/router";
import vHide from "@/directives/vHide";

import { RepositoryManager } from "@/repository/manager.ts";
import { installDebugConsole } from "@/utils/debugConsole";

async function loadFonts() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load("600 36px Roboto"), document.fonts.load("400 36px Roboto")]),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch {
    // Если что-то пошло не так, продолжаем без ожидания
  }
}

await loadFonts();

const app = createApp(App);

app.directive("hide", vHide);

app.use(createPinia());
app.use(router);

// Консольное API для картографов: window.mapDebug (см. mapDebug.help() в консоли браузера).
installDebugConsole();

export const repoManager = new RepositoryManager();

repoManager.changeRepositories("supabase");

app.mount("#app");
