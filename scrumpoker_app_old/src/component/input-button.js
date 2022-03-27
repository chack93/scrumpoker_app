import { defineNewComponent } from "../base_component.js";

const template = `
<button
  class="accent-bg accent-color box-shadow-2 active"
  id="button"
  on:click="clickHandler"
  >
  <i if:true="{{iconExists}}" class="mu {{icon}}"></i>
  <span>{{text}}</span>
</button>
`;

const style = `
button {
  min-width: 10rem;
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
  border: 0;
  outline: 0;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  color: inherit;
  font-size: 1.25rem;
  vertical-align: middle;
  opacity: 0.6;
}
button.active {
  opacity: 1;
}
i {
  vertical-align: middle;
  text-align: center;
}
span {
  vertical-align: middle;
}
`;

defineNewComponent(
  "component-input-button",
  {
    template,
    style,
    attributes: ["icon", "text", "active"],
    state: {
      iconExists: false,
      isActive: true
    },
    connected() {
      this.iconExists = this.icon != "";
    },
    observer: {
      active(newVal) {
        this.isActive = newVal == "true" 
        if (this.isActive)
          this.refs.button.classList.add("active")
        else
          this.refs.button.classList.remove("active")
      } 
    },
    methods: {
      focus() {
        this.refs.button.focus();
      },
      clickHandler(event) {
        if (!this.isActive)
          event.stopPropagation()
      }
    },
  }
);
