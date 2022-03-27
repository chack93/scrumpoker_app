import { defineNewComponent } from "../base_component.js";

// class="accent-bg accent-color box-shadow-2 active"
const template = `
<div
  id="container"
  class="container accent-bg accent-color active box-shadow-1"
  on:click="clickHandler"
  >
  <div class="value">
    <input
      type="text"
      id="input"
      name="input"
      class="secondary-color secondary-bg"
      on:input="inputChangedHandler"
      value="{{value}}"/>
  </div>
</div>
`;

const style = `
.container {
  width: 3rem;
  height: 3rem;
  opacity: 0.5;
  border-radius: 0.25rem;
}
.active {
  opacity: 1;
}
.value {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  cursor: pointer;
}
input {
  width: 1.75rem;
  height: 1.75rem;
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
  padding: 0;
  border: 0;
  outline: 0;
  color: inherit;
  font-size: 1.25rem;
  vertical-align: middle;
  text-align: center;
}
`;

defineNewComponent(
  "component-estimation-card",
  {
    template,
    style,
    attributes: ["value", "active", "index"],
    state: {
      lastInputChange: 0,
      inputTimeout: undefined,
    },
    connected() {
      this.setActiveStyle()
    },
    observer: {
      active() {
        this.setActiveStyle()
      }
    },
    methods: {
      focus() {
        this.refs.button.focus();
      },
      setActiveStyle() {
        if (this.active === true || this.active == "true")
          this.refs.container.classList.add("active")
        else
          this.refs.container.classList.remove("active")
      },
      clickHandler(event) {
        event.stopPropagation()
        if (event.target.classList.contains("value")) {
          const active = this.active === true || this.active == "true"
          this.active = !active
          this.sendUpdate()
        }
      },
      inputChangedHandler(event) {
        const now = Date.now()
        clearTimeout(this.inputTimeout);
        if (now - this.lastInputChange < 300) {
          this.inputTimeout = setTimeout(() => this.inputChangedHandler(event), 300);
          return;
        }
        this.lastInputChange = now;
        this.value = event.target.value
        this.sendUpdate()
      },
      sendUpdate() {
        this.dispatchEvent(
          new CustomEvent("update-estimation-card", {
            bubbles: true,
            detail: {
              index: this.index,
              value: this.value,
              active: this.active,
            },
          })
        )
      }
    },
  }
);
