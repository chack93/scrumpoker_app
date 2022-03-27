import { defineNewComponent } from "../base_component.js";

const template = `
<div class="container primary-bg-sheet"
  id="container"
  tabindex="-1"
  on:click="closeHandler"
  on:keydown="closeHandler">
  <div class="background primary-bg-sheet">
    <div class="slot-wrapper">
      <slot name="content"></slot>
    </div>
  </div>
</div>
`;
const style = `
.container {
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  opacity: 0;
  transition: opacity 0.25s ease-out;
}
.visible {
  opacity: 1;
}
.visible .background {
  transform: translateY(0%);
}
.background {
  width: 100%;
  min-height: 25%;
  max-height: 100%;
  left: 0;
  bottom: 0;
  position: absolute;
  border-radius: 0.5rem 0.5rem 0 0;
  border: 0.125rem solid;
  border-bottom: 0;
  background-clip: content-box;
  transform: translateY(100%);
  transition: transform 0.5s ease-out;
}
.slot-wrapper {
  padding: 0.5rem;
  text-align: center;
  overflow: hidden;
}
`;

defineNewComponent(
  "component-sheet",
  {
    template,
    style,
    state: {
      visible: false,
    },
    observer: {
      visible(newValue) {
        setTimeout(() => {
          if (newValue) this.refs.container.classList.add("visible");
          else this.refs.container.classList.remove("visible");
        }, 0);
      },
    },
    connected() {
      this.refs.container.focus();
      this.visible = true;
    },
    disconnected() {
      this.visible = false;
    },
    methods: {
      closeHandler(event) {
        if (!this.refs.container.classList.contains("visible")) return;
        if (
          (event.type == "keydown" && event.key === "Escape") ||
          (event.type == "click" && event.target == this.refs.container)
        ) {
          this.visible = false;
          setTimeout(() => {
            this.dispatchEvent(
              new CustomEvent("close", {
                bubbles: true,
                detail: {},
              })
            );
          }, 500);
        }
      },
    },
  }
);
