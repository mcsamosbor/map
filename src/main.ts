import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "./App.vue";
import router from "./router";
import vHide from "./directives/vHide";

import { renderer, patchProp as defPatchProp } from "vue3-pixi";
import { Viewport, type IViewportOptions } from "pixi-viewport";

// Регистрируем Viewport как кастомный элемент
renderer.use({
  name: "Viewport", // Имя тега в шаблоне
  createElement: (props: IViewportOptions) => {
    // Создаем экземпляр Viewport.
    // Важно: в пропсах должен быть передан объект `application`,
    // чтобы viewport знал, к какому приложению подключиться.
    // В зависимости от версии pixi-viewport, конструктор может принимать
    // { app: application } или сам application.
    // Обычно используется: new Viewport({ app: props.application })
    return new Viewport({
      // Другие опции viewport можно передавать через пропсы
      ...props,
    });
  },
  patchProp(el, key, prevValue, nextValue) {
    // Здесь можно обрабатывать изменения пропсов во время работы,
    // например, обновлять опции viewport.
    // Для базовых случаев достаточно стандартной логики.
    return defPatchProp(el, key, prevValue, nextValue);
  },
});

const app = createApp(App);

app.directive("hide", vHide);

app.use(createPinia());
app.use(router);

app.mount("#app");
