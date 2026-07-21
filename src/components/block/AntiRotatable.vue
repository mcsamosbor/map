<template>
  <div class="anti-rotatable-component">
    <slot></slot>
  </div>
</template>
<style>
*[rotation="right"] {
  .anti-rotatable-component {
    rotate: -90deg;
  }
}
*[rotation="down"] {
  .anti-rotatable-component {
    rotate: -180deg;
  }
}
*[rotation="left"] {
  .anti-rotatable-component {
    rotate: -270deg;
  }
}
</style>
