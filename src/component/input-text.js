import { defineNewComponent } from "../base_component.js";

const template = `
<label if:true="{{labelExists}}" for="input">{{label}}</label>
<div class="container secondary-bg secondary-color box-shadow-1">
  <i if:true="{{iconExists}}" class="mu {{icon}}"></i>
  <input
    type="{{type}}"
    placeholder="{{placeholder}}"
    id="input"
    name="input"
    list="datalist"
    class="secondary-bg"
    on:input="inputChangedHandler"
    on:keydown="inputKeydownHandler"
    value="{{value}}"/>
  <span if:true="{{isRequired}}" title="Required" class="required error-color">*</span>
  <i class="mu mu-cancel" on:click="clickDeleteHandler"></i>
  <datalist id="datalist"></datalist>
</div>
`;

const style = `
label {
  min-width: 6rem;
  display: inline-block;
  text-align: right;
  padding-right: 0.5rem;
}
.container {
  width: 16rem;
  padding: 0.125rem 0.5rem;
  border: 0;
  border-radius: 0.25rem;
  white-space: nowrap;
  display: inline-block;
}
i {
  display: inline-block;
  width: 1.25rem;
  font-size: 1.25rem;
  vertical-align: middle;
  text-align: center;
}
.required {
  right: 1.75rem;
  top: 0.25rem;
  font-size: 1.25rem;
  position: absolute;
  z-index: 1;
}
input {
  width: 12rem;
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
}
@media screen and (max-width: 400px) {
  .container {
    width: 11rem;
  }
  input {
    width: 7.25rem;
  }
}
`;

defineNewComponent(
  "component-input-text",
  {
    template,
    style,
    attributes: ["icon", "initial-value", "focused", "label", "type", "placeholder", "required"],
    state: {
      labelExists: false,
      iconExists: false,
      datalist: [],
      value: "",
      inputTimeout: undefined,
      lastInputChange: 0,
      isRequired: false,
    },
    connected() {
      this.labelExists = this.label != "";
      this.iconExists = this.icon != "";
      this.type = this.type || "text";
      if (this["initial-value"]) {
        this.value = this["initial-value"];
      }
      if (this.focused) {
        setTimeout(() => {
          this.refs.input.focus();
        }, 0);
      }
    },
    observer: {
      datalist(newValue) {
        this.refs.datalist.innerHTML = newValue.map((el) => `<option value="${el}">`).join("");
      },
      "initial-value"(newValue) {
        this.value = newValue;
      },
      value(newValue) {
        this.dispatchEvent(
          new CustomEvent("input-complete", {
            bubbles: true,
            detail: { value: newValue },
          })
        );
      },
      required(newVal) {
        console.log("required", newVal)
        this.isRequired = newVal == "true" 
      }
    },
    methods: {
      focus() {
        this.refs.input.focus();
      },
      inputChangedHandler(event) {
        this.lastInputChange = event.timeStamp;
        if (event.timeStamp - this.lastInputChange < 300) {
          clearTimeout(this.inputTimeout);
          this.inputTimeout = setTimeout(() => {
            this.value = event.target.value;
          }, 300);
          return;
        }
        this.value = event.target.value;
      },
      inputKeydownHandler(event) {
        if (event.key === "Enter") {
          this.value = this.refs.input.value;
        }
      },
      clickDeleteHandler() {
        this.refs.input.value = "";
        this.value = "";
      },
    },
  }
);
