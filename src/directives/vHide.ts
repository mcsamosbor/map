import type { Directive, DirectiveBinding } from "vue";

type HideValue = boolean | undefined | null;

export const vHide: Directive<HTMLElement, HideValue> = {
  mounted(el, binding) {
    el.style.visibility = binding.value ? "hidden" : "visible";
  },
  updated(el, binding) {
    el.style.visibility = binding.value ? "hidden" : "visible";
  },
};

export default vHide;
