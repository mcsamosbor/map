// types/global.d.ts
import { vHide } from "../src/directives/vHide";

declare module "@vue/runtime-core" {
  // Расширяем интерфейс директив, чтобы добавить тип для v-hide
  export interface GlobalDirectives {
    vHide: typeof vHide;
  }
}
