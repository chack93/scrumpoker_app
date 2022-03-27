import { defineNewComponent } from "../base_component.js";

const template = `
<div class="container primary-bg box-shadow-1">
  <div class="img-logo {{jump_animation}}"><a href="#" class="anchor"></a></div>
  <div class="slot-wrapper">
    <slot name="content"></slot>
  </div>
</div>
`;
const style = `
.container {
  width: auto;
  left: 0.5rem;
  right: 0.5rem;
  height: 3rem;
  padding: 0.5rem 0;
  border-radius: 0 0 0.5rem 0.5rem;
  position: fixed;
  z-index: 1;
}
.anchor {
  width: 100%;
  height: 100%;
  display: block;
}
.slot-wrapper {
  left: 4.5rem;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  position: absolute;
  overflow: hidden;
  white-space: nowrap;
  text-align: right;
}
.img-logo {
  width: 4rem;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0.5rem;
  background-image: url("./image/logo.png");
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
}
.img-logo.jump_anim {
  animation: logo_jump 1s 2s cubic-bezier(0, 0.8, 0.2, 1.2);
}

.img-logo:hover {
  animation: logo_shake 1s cubic-bezier(0, 0.8, 0.2, 1.2);
}
`;

defineNewComponent(
  "component-header",
  {
    template,
    style,
    state: {
      jump_animation: "",
    },
    connected() {
      setTimeout(() => {
        this.jump_animation = "jump_anim";
      }, 5000);
    },
  }
);
