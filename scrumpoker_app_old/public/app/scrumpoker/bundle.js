
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
(function () {
  'use strict';

  class Store {
    state = {};
    #state = {
      compA: {
        val1: 2,
      },
    };
    #observer = {};

    constructor() {
      this.#initStateObject("state", this.#state);
    }
    read(keyPath) {
      return keyPath.split(".").reduce((acc, el) => acc[el], this.state);
    }
    write(keyPath, value) {
      const head = keyPath.split(".");
      const tail = head.pop();
      const parent = head.reduce((acc, el) => acc[el], this.state);
      parent[tail] = value;
    }
    addObserver(keyPath, callback) {
      if (!this.#observer[keyPath]) {
        this.#observer[`state.${keyPath}`] = [];
      }
      this.#observer[`state.${keyPath}`].push(callback);
    }

    #initStateObject(parentKey = "state", childObject = {}) {
      Object.keys(childObject).forEach((key) => {
        this.#defineProperty(parentKey, key, childObject[key]);
        if (typeof childObject[key] == "object") {
          const childKey = `${parentKey}.${key}`;
          this.#initStateObject(childKey, childObject[key]);
        }
      });
    }
    #defineProperty(parentKey = "state", key = "", defaultValue = undefined) {
      const _this = this;
      const parentObject = parentKey.split(".").reduce((acc, el) => acc[el], this);
      const childKey = `${parentKey}.${key}`;
      _this.#state[childKey] = defaultValue;
      Object.defineProperty(parentObject, key, {
        enumerable: true,
        get() {
          return _this.#state[childKey];
        },
        set(newValue) {
          const oldValue =
            _this.#state[childKey] != undefined ? JSON.parse(JSON.stringify(_this.#state[childKey])) : undefined;
          _this.#state[childKey] = newValue;
          if (_this.#observer[childKey] && newValue != oldValue) {
            _this.#observer[childKey].forEach((o) => {
              o(newValue, oldValue);
            });
          }
        },
      });
    }
  }

  const domParser = new DOMParser();

  const store = new Store();

  const wait = function (timeout) {
    return new Promise((resolve) => setTimeout(resolve, timeout));
  };

  function defineNewComponent(name, componen_object) {
    window.customElements.define(name, NewComponent(componen_object));
  }

  function NewComponent({
    template = "",
    style = "",
    state = {},
    attributes = [],
    observer = {},
    connected = () => {},
    disconnected = () => {},
    methods = {},
  }) {
    return class extends HTMLElement {
      store = store;
      #state = {};
      #observedDomMap = {};
      #connectedCbDone = false;
      refs = {};
      static get observedAttributes() {
        return attributes;
      }

      constructor() {
        super();
        this.#state = JSON.parse(JSON.stringify(state));
        Object.keys(state).forEach((k) => {
          this.defineProperty(k);
        });
        attributes.forEach((k) => {
          this.#state[k] = "";
          this.defineProperty(k);
        });
        Object.keys(observer).forEach((key) => {
          if (key.indexOf("store.") != 0) return;
          this.store.addObserver(key.substring(6), (newValue, oldValue) => {
            observer[key].apply(this, [newValue, oldValue]);
          });
        });

        Object.keys(methods).forEach((methodName) => {
          this[methodName] = methods[methodName];
        });

        this.attachShadow({ mode: "open" });

        const templateBody = domParser.parseFromString(template, "text/html").querySelector("body");
        this.parseDomList(templateBody);
        this.shadowRoot.append(...templateBody.childNodes);
        this.shadowRoot.querySelectorAll("*").forEach((el) => {
          if (el.id) this.refs[el.id.replace("-", "_")] = el;
        });
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "./bundle.css";
        this.shadowRoot.append(link);
        if (style) {
          const styleDom = document.createElement("style");
          styleDom.innerHTML = style;
          this.shadowRoot.append(styleDom);
        }
      }
      connectedCallback() {
        for (let i = 0; i < this.attributes.length; i++) {
          this[this.attributes[i].name] = this.attributes[i].value;
        }
        connected.call(this);
        this.#connectedCbDone = true;
      }
      disconnectedCallback() {
        disconnected.call(this);
      }
      attributeChangedCallback() {
        for (let i = 0; i < this.attributes.length; i++) {
          this[this.attributes[i].name] = this.attributes[i].value;
        }
      }

      defineProperty(k = "") {
        const _this = this;
        Object.defineProperty(this, k, {
          enumerable: true,
          get() {
            return _this.#state[k];
          },
          set(newValue) {
            try {
              const oldValue = _this.#state[k] != undefined ? JSON.parse(JSON.stringify(_this.#state[k])) : undefined;
              _this.#state[k] = newValue;
              _this.refresh(k);
              if (this.#connectedCbDone && observer[k] && newValue != oldValue) {
                observer[k].apply(this, [newValue, oldValue]);
              }
            } catch (e) {
              console.error("set failed", k, e);
            }
          },
        });
      }
      parseDomList(parentNode = {}) {
        const domChilds = parentNode.childNodes || [];
        for (let i = 0; i < domChilds.length; i++) {
          if (![Node.ELEMENT_NODE, Node.TEXT_NODE].includes(domChilds[i].nodeType)) {
            continue;
          }
          const isElementNode = domChilds[i].nodeType === Node.ELEMENT_NODE;
          const keysToUpdate = [];
          const reHandlebar = /.*{{.*}}.*/;
          const innerText = isElementNode ? domChilds[i].innerText : domChilds[i].textContent;
          const text = reHandlebar.exec(innerText);
          if (text && (domChilds[i].children || []).length == 0) {
            const keyList = innerText
              .split("{{")
              .filter((el) => el.indexOf("}}") != -1)
              .map((el) => el.split("}}")[0]);
            keyList.forEach((key) => {
              if (!this.#observedDomMap[key]) {
                this.#observedDomMap[key] = [];
              }
              this.#observedDomMap[key].push({
                node: domChilds[i],
                update: isElementNode ? "innerHTML" : "textContent",
                innerHTML: isElementNode ? domChilds[i].innerHTML : undefined,
                textContent: !isElementNode ? domChilds[i].textContent : undefined,
                keyList,
              });
              keysToUpdate.push(key);
            });
          }
          const len = (domChilds[i].attributes || []).length;
          for (let j = 0; j < len; j++) {
            if (!domChilds[i] || !domChilds[i].attributes) continue;
            const name = domChilds[i].attributes[j].name;
            const value = domChilds[i].attributes[j].value;
            let key = value.substring(value.indexOf("{{") + 2);
            key = key.substring(0, key.indexOf("}}"));
            if (name.indexOf("if:") == 0) {
              const commentNode = document.createComment("");
              const replaceNode = domChilds[i];
              const condition = name.substring(3);
              if (!this.#observedDomMap[key]) {
                this.#observedDomMap[key] = [];
              }
              let parentN = parentNode;
              if (parentNode.tagName === "BODY") {
                parentN = this.shadowRoot;
              }
              this.#observedDomMap[key].push({
                update: "if",
                condition,
                commentNode,
                parentNode: parentN,
                replaceNode,
                name,
                value,
              });
              keysToUpdate.push(key);
              this.parseDomList(replaceNode);
            } else if (name.indexOf("on:") == 0) {
              const eventType = name.substring(3);
              domChilds[i].addEventListener(eventType, (event) => {
                Object.defineProperty(event, "target", {
                  value: event.composedPath()[0],
                });
                this[value].apply(this, [event]);
              });
            } else if (name.indexOf("each:") == 0) {
              const fnArguments = name.substring(5);
              const updateKey = (domChilds[i].attributes.key || {}).value;
              if (!this.#observedDomMap[key]) {
                this.#observedDomMap[key] = [];
              }
              let parentN = parentNode;
              if (parentNode.tagName === "BODY") {
                parentN = this.shadowRoot;
              }
              this.#observedDomMap[key].push({
                update: "each",
                updateKey,
                fnArguments,
                parentNode: parentN,
                node: domChilds[i],
                template: domChilds[i].cloneNode(true),
                name,
                value,
              });
              parentN.innerHTML = "";
              keysToUpdate.push(key);
            } else if (reHandlebar.exec(value)) {
              if (!this.#observedDomMap[key]) {
                this.#observedDomMap[key] = [];
              }
              this.#observedDomMap[key].push({
                node: domChilds[i],
                update: "attributes",
                name,
                value,
              });
              keysToUpdate.push(key);
            }
          }
          keysToUpdate.forEach((key) => this.refresh(key));
          this.parseDomList(domChilds[i]);
        }
      }
      refresh(changedKey = undefined) {
        if (this.#observedDomMap[changedKey]) {
          this.#observedDomMap[changedKey].forEach(async (updateInfo) => {
            if (updateInfo.update === "innerHTML") {
              const updatedInnerHTML = updateInfo.keyList.reduce(
                (acc, el) => acc.replace(`{{${el}}}`, this[el]),
                updateInfo.innerHTML
              );
              updateInfo.node.innerHTML = updatedInnerHTML;
            } else if (updateInfo.update === "textContent") {
              const updatedTextContent = updateInfo.keyList.reduce(
                (acc, el) => acc.replace(`{{${el}}}`, this[el]),
                updateInfo.textContent
              );
              updateInfo.node.textContent = updatedTextContent;
            } else if (updateInfo.update === "if") {
              if (updateInfo.parentNode.children.length === 0) {
                // wait until the parentNode is in the dom. happens right after init
                await wait(0);
              }
              let truthy = false;
              if (updateInfo.condition === "true" && this[changedKey] === true) truthy = true;
              else if (updateInfo.condition === "false" && this[changedKey] === false) truthy = true;
              else if (updateInfo.condition == this[changedKey]) truthy = true;

              if (!updateInfo.commentNode.isConnected && !updateInfo.replaceNode.isConnected) return;
              if (truthy && !updateInfo.replaceNode.isConnected) {
                updateInfo.parentNode.replaceChild(updateInfo.replaceNode, updateInfo.commentNode);
              } else if (!truthy && !updateInfo.commentNode.isConnected) {
                updateInfo.parentNode.replaceChild(updateInfo.commentNode, updateInfo.replaceNode);
              }
            } else if (updateInfo.update === "each") {
              const [elArgKey = "el", idxArgKey = "idx"] = updateInfo.fnArguments.split(":");
              const createElement = (template, el, idx, key) => {
                const clone = template.cloneNode(true);
                clone.setAttribute("key", el[key]);
                clone.removeAttribute(`each:${updateInfo.fnArguments}`);
                clone.innerHTML = clone.innerHTML.replaceAll(new RegExp(`{{ *${idxArgKey} *}}`, "g"), idx);
                while (true) {
                  const startIdx = clone.innerHTML.indexOf("{{");
                  const endIdx = clone.innerHTML.indexOf("}}");
                  if (startIdx === -1) break;
                  const handlebar = clone.innerHTML.substring(startIdx, endIdx + 2);
                  const handlebarContent = handlebar.replace("{{", "").replace("}}", "");
                  if (handlebar.includes("=>")) {
                    const replace = new Function("return " + handlebarContent)().bind(this, el, idx);
                    clone.innerHTML = clone.innerHTML.replace(handlebar, replace);
                  } else {
                    const k = handlebarContent.replace(`${elArgKey}.`, "");
                    clone.innerHTML = clone.innerHTML.replace(handlebar, el[k]);
                  }
                }
                return clone;
              };
              this[changedKey].forEach((el, idx) => {
                const currentChild = updateInfo.parentNode.childNodes[idx];
                const newNode = createElement(updateInfo.template, el, idx, updateInfo.updateKey);
                if (!currentChild) {
                  // add
                  updateInfo.parentNode.append(newNode);
                } else {
                  // update
                  if (currentChild.getAttribute("key") != el[updateInfo.updateKey]) {
                    updateInfo.parentNode.replaceChild(newNode, currentChild);
                  }
                }
              });
              const childNodeLength = updateInfo.parentNode.childNodes.length - 1;
              const listLength = this[changedKey].length;
              for (let i = childNodeLength; i >= listLength; i--) {
                updateInfo.parentNode.removeChild(updateInfo.parentNode.childNodes[i]);
              }
            } else if (updateInfo.update === "attributes") {
              updateInfo.node.setAttribute(
                updateInfo.name,
                updateInfo.value.replace(`{{${changedKey}}}`, this[changedKey])
              );
            }
          });
        }
      }
    };
  }

  const template$b = `
<h1>Impressum nach Mediengesetz §24</h1>
<pre>
10.Februar 2022

Christian Hackl
Stübegg 9
2871 Zöbern
Österreich
</pre>

<hr />

<h1>License</h1>
<h2>Microns Icon Font</h2>
  Project Homepage: <a href="https://www.s-ings.com/projects/microns-icon-font/">Microns Icon Font</a>
  <br />
  Icons/Artwork: Distributed under <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA</a> licence.
  <br />
  Font: Distributed under <a href="https://scripts.sil.org/cms/scripts/page.php?item_id=OFL_web">SIL Open Font Licence</a> licence.
  <br />
  <br />
`;
  const style$b = `
a {
  color: inherit;
}
`;

  defineNewComponent(
    "component-about",
    {
      template: template$b,
      style: style$b,
    }
  );

  const template$a = `
<div class="container primary-bg box-shadow-1">
  <div class="img-logo {{jump_animation}}"><a href="#" class="anchor"></a></div>
  <div class="slot-wrapper">
    <slot name="content"></slot>
  </div>
</div>
`;
  const style$a = `
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
      template: template$a,
      style: style$a,
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

  const template$9 = `
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
  const style$9 = `
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
      template: template$9,
      style: style$9,
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

  const template$8 = `
<div id="wrapper" class="wrapper">
  <span id="text">{{text}}</span>
</div>
`;

  const style$8 = `
.wrapper {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  padding-top: 0.125rem;
  text-overflow: ellipsis;
}
span {
  display: inline-block;
  transform: translateX(0);
  transition: transform 3s 3s ease;
}
`;

  const speed = 30; // px/s
  const stopTimeout = 2; // s
  const maxScrollbackDuration = 1; // s
  defineNewComponent(
    "component-scroll-text",
    {
      template: template$8,
      style: style$8,
      attributes: ["dir", "text", "scrolling"],
      state: {
        scrollTimeout: undefined,
      },
      connected() {
        if (this.dir === "v") this.refs.wrapper.style.whiteSpace = "initial";
        window.addEventListener("resize", this.startScrolling.bind(this));
      },
      disconnected() {
        window.removeEventListener("resize", this.startScrolling.bind(this));
      },
      observer: {
        text() {
          this.startScrolling();
        },
        scrolling(newVal) {
          // explicitly check boolean values or start endless scroll on undefined
          if (newVal === "true") {
            this.startScrolling();
          } else if (newVal === "false") {
            this.stopScrolling();
          } else {
            this.startScrolling();
          }
        },
      },
      methods: {
        startScrolling() {
          // endless scrolling if undefined
          if (this.scrolling && this.scrolling === "false") return;

          this.stopScrolling();
          if (this.dir === "h") this.scrollHorizontally();
          else this.scrollVertically();
        },
        stopScrolling() {
          clearTimeout(this.scrollTimeout);
          this.refs.text.style.transition = `transform 0s linear`;
          this.refs.text.style.transform = `translate(0px, 0px)`;
        },
        scrollVertically() {
          clearTimeout(this.scrollTimeout);
          const scrollDistance = this.refs.text.clientHeight - this.refs.text.parentNode.clientHeight;
          if (scrollDistance < 5) {
            return;
          }
          const time = scrollDistance / speed;
          const scrollbackDuration = Math.min(time, maxScrollbackDuration);
          this.refs.text.style.transition = `transform ${time}s ${stopTimeout}s linear`;
          this.refs.text.style.transform = `translateY(-${scrollDistance}px)`;
          this.scrollTimeout = setTimeout(() => {
            this.refs.text.style.transition = `transform ${scrollbackDuration}s ${stopTimeout}s linear`;
            this.refs.text.style.transform = `translateY(0px)`;
            this.scrollTimeout = setTimeout(
              this.scrollHorizontally.bind(this),
              (scrollbackDuration + stopTimeout) * 1000
            );
          }, (time + stopTimeout) * 1000);
        },
        scrollHorizontally() {
          clearTimeout(this.scrollTimeout);
          const scrollDistance = this.refs.text.clientWidth - this.refs.text.parentNode.clientWidth;
          if (scrollDistance < 5) {
            return;
          }
          const time = scrollDistance / speed;
          const scrollbackDuration = Math.min(time, maxScrollbackDuration);
          this.refs.text.style.transition = `transform ${time}s ${stopTimeout}s linear`;
          this.refs.text.style.transform = `translateX(-${scrollDistance}px)`;
          this.scrollTimeout = setTimeout(() => {
            this.refs.text.style.transition = `transform ${scrollbackDuration}s ${stopTimeout}s linear`;
            this.refs.text.style.transform = `translateX(0px)`;
            this.scrollTimeout = setTimeout(
              this.scrollHorizontally.bind(this),
              (scrollbackDuration + stopTimeout) * 1000
            );
          }, (time + stopTimeout) * 1000);
        },
      },
    }
  );

  const template$7 = `
<label if:true="{{labelExists}}" for="input">{{label}}</label>
<div class="container secondary-bg secondary-color box-shadow-1">
  <i if:true="{{iconExists}}" class="mu {{icon}}"></i>
  <input
    type="{{type}}"
    pattern="{{pattern}}"
    min="{{min}}"
    max="{{max}}"
    step="{{step}}"
    placeholder="{{placeholder}}"
    id="input"
    name="input"
    list="datalist"
    class="secondary-bg"
    on:input="inputChangedHandler"
    on:keydown="inputKeydownHandler"
    value="{{intValue}}"/>
  <span if:true="{{isRequired}}" title="Required" class="required error-color">*</span>
  <i class="mu mu-cancel" on:click="clickDeleteHandler"></i>
  <datalist id="datalist"></datalist>
</div>
`;

  const style$7 = `
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
      template: template$7,
      style: style$7,
      attributes: ["icon", "initial-value", "value", "focused", "label", "type", "pattern", "min", "max", "step", "placeholder", "required"],
      state: {
        labelExists: false,
        iconExists: false,
        datalist: [],
        intValue: "",
        inputTimeout: undefined,
        lastInputChange: 0,
        isRequired: false,
      },
      connected() {
        this.value = this.value || this["initial-value"];
        this.labelExists = this.label != "";
        this.iconExists = this.icon != "";
        this.type = this.type || "text";
        if (this["initial-value"]) {
          this.intValue = this["initial-value"];
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
          this.intValue = newValue;
        },
        value(newValue) {
          this.intValue = newValue;
        },
        intValue(newValue) {
          this.value = newValue;
          this.dispatchEvent(
            new CustomEvent("input-complete", {
              bubbles: true,
              detail: { value: newValue },
            })
          );
        },
        required(newVal) {
          this.isRequired = newVal == "true";
        }
      },
      methods: {
        focus() {
          this.refs.input.focus();
        },
        inputChangedHandler(event) {
          const now = Date.now();
          clearTimeout(this.inputTimeout);
          if (now - this.lastInputChange < 300) {
            this.inputTimeout = setTimeout(() => this.inputChangedHandler(event), 300);
            return;
          }
          this.lastInputChange = now;
          const newVal = this.getCleanedValue();
          this.intValue = newVal;
          event.target.value = newVal;
        },
        getCleanedValue() {
          if (this.pattern && !RegExp(this.pattern).test(this.refs.input.value))
            return this.intValue;
          return this.refs.input.value;
        },
        inputKeydownHandler(event) {
          if (event.key === "Enter") {
            this.intValue = this.refs.input.value;
          }
        },
        clickDeleteHandler() {
          this.refs.input.value = "";
          this.intValue = "";
        },
      },
    }
  );

  const template$6 = `
<button
  class="accent-bg accent-color box-shadow-2 active"
  id="button"
  on:click="clickHandler"
  >
  <i if:true="{{iconExists}}" class="mu {{icon}}"></i>
  <span>{{text}}</span>
</button>
`;

  const style$6 = `
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
      template: template$6,
      style: style$6,
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
          this.isActive = newVal == "true"; 
          if (this.isActive)
            this.refs.button.classList.add("active");
          else
            this.refs.button.classList.remove("active");
        } 
      },
      methods: {
        focus() {
          this.refs.button.focus();
        },
        clickHandler(event) {
          if (!this.isActive)
            event.stopPropagation();
        }
      },
    }
  );

  const template$5 = `
<div class="container primary-bg box-shadow-1">
    <div class="join-link">
      <span>JoinLink: <a class="primary-color" href="{{joinLink}}">#{{joincode}}</a></span>
      <i
        id="iconCopy"
        class="mu mu-file btn"
        title="copy to clipboard"
        on:click="clickCopyJoinCodeHandler"
        ></i>
    </div>

    <component-input-text
      id="inputDescription"
      placeholder="Description"
      initial-value="{{description}}"
      label="Task Description"
      on:input-complete="inputDescriptionCompleteHandler"
      ></component-input-text>

    <div class="card-sel grid">
      <div class="card-sel-title grid-r1">Card Selection</div>
      <component-input-text
        id="inputCardCount"
        class="grid-r2 grid-c1"
        placeholder="Cards"
        value="{{cardCount}}"
        label="Cards (1-30)"
        type="number"
        pattern="^[0-9]*$"
        min="1"
        max="30"
        on:input-complete="inputCardCountCompleteHandler"
        ></component-input-text>
      <component-input-button
        class="grid-r2 grid-c2"
        icon="mu-delete"
        text="Set Default"
        on:click="clickHandlerSetDefault"></component-input-button>

      <ul
        class="grid-r3"
        on:update-estimation-card="updateEstimationCardHandler">
        <li
          each:el:i="{{cardSelectionList}}"
          key="key">
          <component-estimation-card
            index="{{el.idx}}"
            value="{{el.value}}"
            active="{{el.active}}"></component-estimation-card>
        </li>
      </ul>
    </div>
</div>
`;

  const style$5 = `
.container {
  text-align: center;
  padding: 1rem;
  border-radius: 0.5rem;
}

#inputDescription {
  display: inline-block;
  margin-bottom: 1rem;
}

.join-link {
  margin-bottom: 1rem;
}
.join-link i {
  display: inline-block;
  font-size: 1.25rem;
  width: 1.5rem;
  height: 1.5rem;
}

.card-sel {
  justify-content: center;
}
.card-sel-title {
  margin-bottom: 0.5rem;
  grid-column: span 2;
}
#inputCardCount {
  display: inline-block;
}
ul {
  list-style: none;
  margin: 0;
  padding: 0;
  grid-column: span 2;
}
li {
  display: inline-block;
  padding: 1rem 0.5rem;
  vertical-align: top;
}
`;

  defineNewComponent(
    "component-admin-setting",
    {
      template: template$5,
      style: style$5,
      attributes: ["description", "cardselectionlist", "joincode"],
      state: {
        joinLink: "",
        cardSelectionList: [{key: "", idx: 0, value: "1", active: true}],
        cardCount: 1,
      },
      connected() {
        this.joinLink = `${location.origin}${location.pathname}?join=${this.joincode}`;
        this.setCardSelectionList(this.cardselectionlist);
      },
      observer: {
        joincode(newValue) {
          this.joinLink = `${location.origin}${location.pathname}?join=${newValue}`;
        },
        cardselectionlist(newValue) {
          this.setCardSelectionList(newValue);
        },
        cardSelectionList(newValue) {
          const value = newValue
            .map(({value, active}) => `${value}=${active}`)
            .join(",");
          this.dispatchEvent(
            new CustomEvent("card-selection-list-change", {
              bubbles: true,
              detail: { value },
            })
          );
        }
      },
      methods: {
        setCardSelectionList(str) {
          this.cardSelectionList = this.parseCardSelectionString(str);
          if (this.cardSelectionList.length > 0) {
            this.cardCount = parseInt(this.cardSelectionList.length);
          }
        },
        parseCardSelectionString(str) {
          return str.split(",").map((el, idx) => {
            const [value,active] = el.split("=");
            return {key: this.getCardKey(idx, value, active), idx, value, active: active == "true"}
          })
        },
        getCardKey(idx, value, active) {
          return `${idx}${value}${active}`
        },
        inputDescriptionCompleteHandler(event) {
          this.dispatchEvent(
            new CustomEvent("description-change", {
              bubbles: true,
              detail: { value: event.detail.value },
            })
          );
        },
        inputCardCountCompleteHandler(event) {
          const value = parseInt(event.detail.value);
          if (value.isNaN) return

          const newList = this.cardSelectionList.slice(0, value);

          const cardSelListLen = this.cardSelectionList.length;
          const missingCount = value - cardSelListLen;
          let newElements = [];
          if (missingCount > 0) {
            let lastValue = 0;
            if (cardSelListLen > 0) 
              lastValue = parseInt(this.cardSelectionList[cardSelListLen-1].value) || 0;
            newElements = Array(missingCount).fill().map((_,idx) => ({
              key: this.getCardKey(cardSelListLen+1, lastValue+1, true),
              idx: cardSelListLen+idx,
              value: lastValue+idx+1,
              active: true,
            }));
          }
          this.cardSelectionList = [...newList, ...newElements];
        },
        clickCopyJoinCodeHandler() {
          navigator.clipboard.writeText(this.joinLink);
          this.refs.iconCopy.classList.add("anim-logo-jump");
          setTimeout(() => this.refs.iconCopy.classList.remove("anim-logo-jump"), 700);
        },
        clickHandlerSetDefault() {
          this.setCardSelectionList("☕=true,1=true,2=true,3=true,4=true,5=true,6=true,7=true,8=true,9=true,10=true"        );
        },
        updateEstimationCardHandler(event) {
          if (event.detail && event.detail.index) {
            const idx = event.detail.index;
            const el = this.cardSelectionList.find(el => el.idx == idx);
            el.active = event.detail.active;
            el.value = event.detail.value;
            el.key = this.getCardKey(el.idx, el.value, el.active);
            const copy = [...this.cardSelectionList];
            this.cardSelectionList = copy;
          }
        }
      },
    }
  );

  // class="accent-bg accent-color box-shadow-2 active"
  const template$4 = `
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

  const style$4 = `
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
      template: template$4,
      style: style$4,
      attributes: ["value", "active", "index"],
      state: {
        lastInputChange: 0,
        inputTimeout: undefined,
      },
      connected() {
        this.setActiveStyle();
      },
      observer: {
        active() {
          this.setActiveStyle();
        }
      },
      methods: {
        focus() {
          this.refs.button.focus();
        },
        setActiveStyle() {
          if (this.active === true || this.active == "true")
            this.refs.container.classList.add("active");
          else
            this.refs.container.classList.remove("active");
        },
        clickHandler(event) {
          event.stopPropagation();
          if (event.target.classList.contains("value")) {
            const active = this.active === true || this.active == "true";
            this.active = !active;
            this.sendUpdate();
          }
        },
        inputChangedHandler(event) {
          const now = Date.now();
          clearTimeout(this.inputTimeout);
          if (now - this.lastInputChange < 300) {
            this.inputTimeout = setTimeout(() => this.inputChangedHandler(event), 300);
            return;
          }
          this.lastInputChange = now;
          this.value = event.target.value;
          this.sendUpdate();
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
          );
        }
      },
    }
  );

  const template$3 = `
<div class="container">

  {{sessionGameState}}

  <ul
    class="grid-r3"
    on:update-estimation-card="updateEstimationCardHandler">
    <li
      each:el:i="{{cardSelectionList}}"
      key="key">
      <component-estimation-card
        index="{{el.idx}}"
        value="{{el.value}}"
        active="{{el.active}}"></component-estimation-card>
    </li>
  </ul>
</div>
`;

  const style$3 = `
.container {
  text-align: center;
  padding: 1rem;
}
`;

  defineNewComponent(
    "component-table",
    {
      template: template$3,
      style: style$3,
      attributes: [],
      state: {
        clientId: localStorage.getItem("clientId"),
        sessionId: localStorage.getItem("sessionId"),
        session: {},
        sessionGameState: "",
        client: {},
        clientList: [],
      },
      async connected() {
        this.clientId = localStorage.getItem("clientId");
        this.sessionId = localStorage.getItem("sessionId");

        window.removeEventListener(`websocket-event`, this.wsEventHandler.bind(this));
        window.addEventListener(`websocket-event`, this.wsEventHandler.bind(this));

        const clientResp = await reqClientFetch({clientId: this.clientId});
        this.client = clientResp.body;

        const sessionResp = await reqSessionFetch({sessionId: this.sessionId});
        this.session = sessionResp.body;
      },
      observer: {
        session(newValue) {
          this.sessionGameState = newValue.gameState || "";
        },
        client(newValue) {
          console.log("client", newValue);
        },
        clientList(newValue) {
          console.log("clientList", newValue);
        },
      },
      methods: {
        wsEventHandler(event) {
          if (event.detail.head.action !== "update") return
          this.client = event.detail.body.client;
          this.session = event.detail.body.session;
          this.clientList = event.detail.body.clientList;
        },
      },
    }
  );

  const appName = "SP -";
  const routes = {
    "#": { title: `${appName} Login`, view: "view-login" },
    "#login": { title: `${appName} Login`, view: "view-login" },
    "#session": { title: `${appName} Session`, view: "view-session" },
    //"#about": { title: "About", view: "view-about" },
  };

  defineNewComponent(
    "view-router",
    {
      template: `<div id="router" class="full"></div>`,
      attributes: ["initial"],
      state: {
        currentViewKey: undefined,
      },
      connected() {
        window.addEventListener("hashchange", this.hashChangeEventHandler.bind(this));
        if (this.initial && !location.hash) {
          location.hash = this.initial || "#";
        }
        // fix missing hash after reload for unknown reasons
        const previousHash = location.hash;
        setTimeout(() => {
          location.hash = previousHash;
        }, 0);
        this.hashChangeEventHandler();
      },
      disconnected() {
        window.removeEventListener("hashchange", this.hashChangeEventHandler.bind(this));
      },
      methods: {
        hashChangeEventHandler(_e) {
          const newViewKey = location.hash || "#";
          if (this.currentViewKey === newViewKey) return;
          this.currentViewKey = newViewKey;
          this.refs.router.innerHTML = "";
          if (routes[newViewKey]) {
            this.refs.router.innerHTML = `<${routes[newViewKey].view}></${routes[newViewKey].view}>`;
            document.title = routes[newViewKey].title;
          }
          setTimeout(() => {
            window.scrollTo(0, 0);
          }, 0);
        },
      },
    }
  );

  const baseUrl = "/api/scrumpoker";

  async function reqClientFetch$1({
    clientId = ""
  } = {}) {
    return await request("GET", `${baseUrl}/client/${clientId}`);
  }
  async function reqClientCreate({
    name = "",
    sessionId = "",
    viewer = false
  } = {}) {
    return await request("POST", `${baseUrl}/client`, {
      name,
      sessionId,
      viewer
    });
  }

  async function reqSessionFetch$1({
    sessionId = ""
  } = {}) {
    return await request("GET", `${baseUrl}/session/${sessionId}`);
  }
  async function reqSessionJoinCodeFetch({
    joinCode = ""
  } = {}) {
    return await request("GET", `${baseUrl}/session/join/${joinCode}`);
  }
  async function reqSessionCreate({
    cardSelectionList = "",
    description = "",
    ownerClientId = ""
  } = {}) {
    return await request("POST", `${baseUrl}/session`, {
      cardSelectionList,
      description,
      ownerClientId
    });
  }

  function request(method, path, body) {
    return new Promise((resolve, reject) => {
      fetch(path, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })
        .then(async (response) => {
          const header = {};
          for (let pair of response.headers.entries()) {
            header[pair[0]] = pair[1];
          }
          if (response.status >= 200 && response.status < 300) return { body: await response.json(), header };
          else reject(Error(`${response.status} - ${response.statusText}`));
        })
        .then(({ body, header }) => {
          resolve({ body, header });
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  const firstnames = [
  "James","Mary","Robert","Patricia","John","Jennifer","Michael","Linda","William","Elizabeth","David","Barbara","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen","Christopher","Nancy","Daniel","Lisa","Matthew","Betty","Anthony","Margaret","Mark","Sandra","Donald","Ashley","Steven","Kimberly","Paul","Emily","Andrew","Donna","Joshua","Michelle","Kenneth","Dorothy","Kevin","Carol","Brian","Amanda","George","Melissa","Edward","Deborah","Ronald","Stephanie","Timothy","Rebecca","Jason","Sharon","Jeffrey","Laura","Ryan","Cynthia","Jacob","Kathleen","Gary","Amy","Nicholas","Shirley","Eric","Angela","Jonathan","Helen","Stephen","Anna","Larry","Brenda","Justin","Pamela","Scott","Nicole","Brandon","Emma","Benjamin","Samantha","Samuel","Katherine","Gregory","Christine","Frank","Debra","Alexander","Rachel","Raymond","Catherine","Patrick","Carolyn","Jack","Janet","Dennis","Ruth","Jerry","Maria","Tyler","Heather","Aaron","Diane","Jose","Virginia","Adam","Julie","Henry","Joyce","Nathan","Victoria","Douglas","Olivia","Zachary","Kelly","Peter","Christina","Kyle","Lauren","Walter","Joan","Ethan","Evelyn","Jeremy","Judith","Harold","Megan","Keith","Cheryl","Christian","Andrea","Roger","Hannah","Noah","Martha","Gerald","Jacqueline","Carl","Frances","Terry","Gloria","Sean","Ann","Austin","Teresa","Arthur","Kathryn","Lawrence","Sara","Jesse","Janice","Dylan","Jean","Bryan","Alice","Joe","Madison","Jordan","Doris","Billy","Abigail","Bruce","Julia","Albert","Judy","Willie","Grace","Gabriel","Denise","Logan","Amber","Alan","Marilyn","Juan","Beverly","Wayne","Danielle","Roy","Theresa","Ralph","Sophia","Randy","Marie","Eugene","Diana","Vincent","Brittany","Russell","Natalie","Elijah","Isabella","Louis","Charlotte","Bobby","Rose","Philip","Alexis","Johnny","Kayla"
  ];
  const lastnames = [
  "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez","Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin","Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson","Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores","Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts","Müller","Schmidt","Schneider","Fischer","Weber","Meyer","Wagner","Becker","Schulz","Hoffmann","Schäfer","Koch","Bauer","Richter","Klein","Wolf","Schröder","Neumann","Schwarz","Zimmermann","Braun","Krüger","Hofmann","Hartmann","Lange","Schmitt","Werner","Schmitz","Krause","Meier","Lehmann","Schmid","Schulze","Maier","Köhler","Herrmann","König","Walter","Mayer","Huber","Kaiser","Fuchs","Peters","Lang","Scholz","Möller","Weiß","Jung","Hahn","Schubert","Vogel","Friedrich","Keller","Günther","Frank","Berger","Winkler","Roth","Beck","Lorenz","Baumann","Franke","Albrecht","Schuster","Simon","Ludwig","Böhm","Winter","Kraus","Martin","Schumacher","Krämer","Vogt","Stein","Jäger","Otto","Sommer","Groß","Seidel","Heinrich","Brandt","Haas","Schreiber","Graf","Schulte","Dietrich","Ziegler","Kuhn","Kühn","Pohl","Engel","Horn","Busch","Bergmann","Thomas","Voigt","Sauer","Arnold","Wolff","Pfeiffer"
  ];
  const hexMagicNumbers = [
  "0FF1CEEE","00BAB10C","1BADB002","8BADF00D","B105F00D","0DEFACED","BAAAAAAD","BAADF00D","BADDCAFE","CAFEB0BA","C00010FF","D06F00DD","CAFEBABE","CAFED00D","CEFAEDFE","FEEDFACE","0D15EA5E","DABBAD00","DEAD2BAD","DEADBAAD","DEADC0DE","DECAFBAD","F1ACF1AC","FACEB00C","FACEFEED","FBADBEEF","FEE1DEAD","FEEDC0DE","CAFEBEEF","FFBADD11","C0FFEE"
  ];
  const passwords = [
  "password","123456","12345678","1234","qwerty","12345","dragon","baseball","football","letmein","monkey","abc123","mustang","michael","shadow","master","jennifer","111111","2000","jordan","superman","harley","1234567","hunter","trustno1","ranger","buster","thomas","tigger","robert","soccer","batman","test","pass","killer","hockey","george","charlie","andrew","michelle","love","sunshine","jessica","pepper","daniel","access","123456789","654321","joshua","maggie","starwars","silver","william","dallas","yankees","123123","ashley","666666","hello","amanda","orange","biteme","freedom","computer","thunder","nicole","ginger","heather","hammer","summer","corvette","taylor","austin","1111","merlin","matthew","121212","golfer","cheese","princess","martin","chelsea","patrick","richard","diamond","yellow","bigdog","secret","asdfgh","sparky","cowboy", "swordfish"
  ];

  const template$2 = `
<div class="full">
  <div class="container primary-bg box-shadow-1 grid">
    <component-input-text
      id="inputName"
      class="grid-r1 grid-c1"
      icon="mu-user"
      placeholder="{{randomName}}"
      initial-value="{{username}}"
      focused="true"
      required="true"
      label="Name"
      on:keydown="inputKeydownHandler"
      on:input-complete="inputCompleteHandler"
      ></component-input-text>

    <component-input-text
      id="inputJoin"
      class="grid-r2 grid-c1"
      icon="mu-group"
      placeholder="{{hexMagicNr}}"
      initial-value="{{joinCode}}"
      required="true"
      label="Join"
      on:keydown="inputKeydownHandler"
      on:input-complete="inputCompleteHandler"
      ></component-input-text>

<!--
    <component-input-text
      id="inputPassword"
      class="grid-r3 grid-c1"
      icon="mu-lock"
      placeholder="{{randomPassword}}"
      type="password"
      label="Password"
      password="true"
      on:keydown="inputKeydownHandler"
      ></component-input-text>
-->

    <div class="error">
      <hr if:true="{{showError}}" />
      <p class="error-color anim-error-shake" if:true="{{showError}}">{{errorText}}</p>
    </div>
    <hr />

    <div class="grid">

      <component-input-button
        class="grid-r1 grid-c1"
        icon="mu-edit"
        text="Create New"
        on:click="clickHandlerCreate"></component-input-button>

      <component-input-button
        class="grid-r1 grid-c2"
        icon="mu-arrow-right"
        text="Join"
        active="{{joinButtonActive}}"
        on:click="clickHandlerJoin"></component-input-button>

    </div>
  </div>
</div>
`;

  const style$2 = `
.container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 1rem;
  border-radius: 0.5rem;
  text-align: center;
}
.error {
  transition: all 0.5s ease;
}
.error hr {
  padding-bottom: 0.5rem;
}
`;

  defineNewComponent(
    "view-login",
    {
      template: template$2,
      style: style$2,
      attributes: [],
      state: {
        showAboutSheet: false,
        joinButtonActive: false,
        username: localStorage.getItem("username") || "",
        joinCode: localStorage.getItem("joinCode") ||  "",
        randomName: "",
        hexMagicNr: "",
        randomPassword: "",
        requestPending: false,
        showError: false,
        errorText: ""
      },
      connected() {
        const jc = new URLSearchParams(window.location.search).get("join");
        if (jc) {
          this.joinCode = jc;
        }
        this.toggleJoinButtonState();

        const firstname = firstnames[Math.round(Math.random()*(firstnames.length-1))];
        const lastname = lastnames[Math.round(Math.random()*(lastnames.length-1))];
        this.randomName = `${firstname} ${lastname}`;
        this.hexMagicNr = hexMagicNumbers[Math.round(Math.random()*(hexMagicNumbers.length-1))];
        this.randomPassword = passwords[Math.round(Math.random()*(passwords.length-1))];
        this.showError = false;
      },
      observer: {},
      methods: {
        inputCompleteHandler() {
          const username = this.refs.inputName.value;
          const join = this.refs.inputJoin.value;
          localStorage.setItem("username", username);
          localStorage.setItem("joinCode", join);
          this.toggleJoinButtonState();
        },
        toggleJoinButtonState() {
          const username = this.refs.inputName.value;
          const join = this.refs.inputJoin.value;
          this.joinButtonActive = username && join && join.length >= 6 && !this.requestPending;
        },
        async clickHandlerCreate() {
          this.requestPending = true;
          this.toggleJoinButtonState();

          try {
            const username = this.refs.inputName.value;
            const newClient = await reqClientCreate({name: username});
            localStorage.setItem("clientId", newClient.body.id);
          }catch(e) {
            console.error("create/create-client", e);
            this.errorText = "Create new session failed";
            this.showError = true;
            this.requestPending = false;
            return
          }

          try {
            const newSession = await reqSessionCreate({
              ownerClientId: localStorage.getItem("clientId")
            });
            localStorage.setItem("sessionId", newSession.body.id);
            localStorage.setItem("joinCode", newSession.body.joinCode);
          }catch(e) {
            console.error("login/create-session", e);
            this.errorText = "Login Failed";
            this.showError = true;
            this.requestPending = false;
            return
          }
          location.hash="#session";
          this.requestPending = false;
        },
        inputKeydownHandler(event) {
          if (event.key === "Enter") {
            this.join();
          }
        },
        clickHandlerJoin(_event) {
          this.join();
        },
        async join() {
          this.requestPending = true;
          this.toggleJoinButtonState();

          const username = this.refs.inputName.value;
          const joinCode = this.refs.inputJoin.value;
          //const password = this.refs.inputPassword.value

          try {
            const session = await reqSessionJoinCodeFetch({joinCode});
            localStorage.setItem("sessionId", session.body.id);
            localStorage.setItem("joinCode", joinCode);
          }catch(e) {
            console.error("login/get-session", e);
            this.errorText = "Unknown Join Code";
            this.showError = true;
            this.requestPending = false;
            return
          }
          try {
            const sessionId = localStorage.getItem("sessionId");
            const newClient = await reqClientCreate({name: username, sessionId});
            localStorage.setItem("clientId", newClient.body.id);
          }catch(e) {
            console.error("login/create-client", e);
            this.errorText = "Login failed";
            this.showError = true;
            this.requestPending = false;
            return
          }
          location.hash="#session";
          this.requestPending = false;
        }
      },
    }
  );

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  function __values(o) {
      var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
      if (m) return m.call(o);
      return {
          next: function () {
              if (o && i >= o.length) o = void 0;
              return { value: o && o[i++], done: !o };
          }
      };
  }

  function __read(o, n) {
      var m = typeof Symbol === "function" && o[Symbol.iterator];
      if (!m) return o;
      var i = m.call(o), r, ar = [], e;
      try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
      }
      catch (error) { e = { error: error }; }
      finally {
          try {
              if (r && !r.done && (m = i["return"])) m.call(i);
          }
          finally { if (e) throw e.error; }
      }
      return ar;
  }

  function __spread() {
      for (var ar = [], i = 0; i < arguments.length; i++)
          ar = ar.concat(__read(arguments[i]));
      return ar;
  }

  var Event = /** @class */ (function () {
      function Event(type, target) {
          this.target = target;
          this.type = type;
      }
      return Event;
  }());
  var ErrorEvent = /** @class */ (function (_super) {
      __extends(ErrorEvent, _super);
      function ErrorEvent(error, target) {
          var _this = _super.call(this, 'error', target) || this;
          _this.message = error.message;
          _this.error = error;
          return _this;
      }
      return ErrorEvent;
  }(Event));
  var CloseEvent = /** @class */ (function (_super) {
      __extends(CloseEvent, _super);
      function CloseEvent(code, reason, target) {
          if (code === void 0) { code = 1000; }
          if (reason === void 0) { reason = ''; }
          var _this = _super.call(this, 'close', target) || this;
          _this.wasClean = true;
          _this.code = code;
          _this.reason = reason;
          return _this;
      }
      return CloseEvent;
  }(Event));

  /*!
   * Reconnecting WebSocket
   * by Pedro Ladaria <pedro.ladaria@gmail.com>
   * https://github.com/pladaria/reconnecting-websocket
   * License MIT
   */
  var getGlobalWebSocket = function () {
      if (typeof WebSocket !== 'undefined') {
          // @ts-ignore
          return WebSocket;
      }
  };
  /**
   * Returns true if given argument looks like a WebSocket class
   */
  var isWebSocket = function (w) { return typeof w !== 'undefined' && !!w && w.CLOSING === 2; };
  var DEFAULT = {
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1000 + Math.random() * 4000,
      minUptime: 5000,
      reconnectionDelayGrowFactor: 1.3,
      connectionTimeout: 4000,
      maxRetries: Infinity,
      maxEnqueuedMessages: Infinity,
      startClosed: false,
      debug: false,
  };
  var ReconnectingWebSocket = /** @class */ (function () {
      function ReconnectingWebSocket(url, protocols, options) {
          var _this = this;
          if (options === void 0) { options = {}; }
          this._listeners = {
              error: [],
              message: [],
              open: [],
              close: [],
          };
          this._retryCount = -1;
          this._shouldReconnect = true;
          this._connectLock = false;
          this._binaryType = 'blob';
          this._closeCalled = false;
          this._messageQueue = [];
          /**
           * An event listener to be called when the WebSocket connection's readyState changes to CLOSED
           */
          this.onclose = null;
          /**
           * An event listener to be called when an error occurs
           */
          this.onerror = null;
          /**
           * An event listener to be called when a message is received from the server
           */
          this.onmessage = null;
          /**
           * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
           * this indicates that the connection is ready to send and receive data
           */
          this.onopen = null;
          this._handleOpen = function (event) {
              _this._debug('open event');
              var _a = _this._options.minUptime, minUptime = _a === void 0 ? DEFAULT.minUptime : _a;
              clearTimeout(_this._connectTimeout);
              _this._uptimeTimeout = setTimeout(function () { return _this._acceptOpen(); }, minUptime);
              _this._ws.binaryType = _this._binaryType;
              // send enqueued messages (messages sent before websocket open event)
              _this._messageQueue.forEach(function (message) { return _this._ws.send(message); });
              _this._messageQueue = [];
              if (_this.onopen) {
                  _this.onopen(event);
              }
              _this._listeners.open.forEach(function (listener) { return _this._callEventListener(event, listener); });
          };
          this._handleMessage = function (event) {
              _this._debug('message event');
              if (_this.onmessage) {
                  _this.onmessage(event);
              }
              _this._listeners.message.forEach(function (listener) { return _this._callEventListener(event, listener); });
          };
          this._handleError = function (event) {
              _this._debug('error event', event.message);
              _this._disconnect(undefined, event.message === 'TIMEOUT' ? 'timeout' : undefined);
              if (_this.onerror) {
                  _this.onerror(event);
              }
              _this._debug('exec error listeners');
              _this._listeners.error.forEach(function (listener) { return _this._callEventListener(event, listener); });
              _this._connect();
          };
          this._handleClose = function (event) {
              _this._debug('close event');
              _this._clearTimeouts();
              if (_this._shouldReconnect) {
                  _this._connect();
              }
              if (_this.onclose) {
                  _this.onclose(event);
              }
              _this._listeners.close.forEach(function (listener) { return _this._callEventListener(event, listener); });
          };
          this._url = url;
          this._protocols = protocols;
          this._options = options;
          if (this._options.startClosed) {
              this._shouldReconnect = false;
          }
          this._connect();
      }
      Object.defineProperty(ReconnectingWebSocket, "CONNECTING", {
          get: function () {
              return 0;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket, "OPEN", {
          get: function () {
              return 1;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket, "CLOSING", {
          get: function () {
              return 2;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket, "CLOSED", {
          get: function () {
              return 3;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "CONNECTING", {
          get: function () {
              return ReconnectingWebSocket.CONNECTING;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "OPEN", {
          get: function () {
              return ReconnectingWebSocket.OPEN;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "CLOSING", {
          get: function () {
              return ReconnectingWebSocket.CLOSING;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "CLOSED", {
          get: function () {
              return ReconnectingWebSocket.CLOSED;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "binaryType", {
          get: function () {
              return this._ws ? this._ws.binaryType : this._binaryType;
          },
          set: function (value) {
              this._binaryType = value;
              if (this._ws) {
                  this._ws.binaryType = value;
              }
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "retryCount", {
          /**
           * Returns the number or connection retries
           */
          get: function () {
              return Math.max(this._retryCount, 0);
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "bufferedAmount", {
          /**
           * The number of bytes of data that have been queued using calls to send() but not yet
           * transmitted to the network. This value resets to zero once all queued data has been sent.
           * This value does not reset to zero when the connection is closed; if you keep calling send(),
           * this will continue to climb. Read only
           */
          get: function () {
              var bytes = this._messageQueue.reduce(function (acc, message) {
                  if (typeof message === 'string') {
                      acc += message.length; // not byte size
                  }
                  else if (message instanceof Blob) {
                      acc += message.size;
                  }
                  else {
                      acc += message.byteLength;
                  }
                  return acc;
              }, 0);
              return bytes + (this._ws ? this._ws.bufferedAmount : 0);
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "extensions", {
          /**
           * The extensions selected by the server. This is currently only the empty string or a list of
           * extensions as negotiated by the connection
           */
          get: function () {
              return this._ws ? this._ws.extensions : '';
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "protocol", {
          /**
           * A string indicating the name of the sub-protocol the server selected;
           * this will be one of the strings specified in the protocols parameter when creating the
           * WebSocket object
           */
          get: function () {
              return this._ws ? this._ws.protocol : '';
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "readyState", {
          /**
           * The current state of the connection; this is one of the Ready state constants
           */
          get: function () {
              if (this._ws) {
                  return this._ws.readyState;
              }
              return this._options.startClosed
                  ? ReconnectingWebSocket.CLOSED
                  : ReconnectingWebSocket.CONNECTING;
          },
          enumerable: true,
          configurable: true
      });
      Object.defineProperty(ReconnectingWebSocket.prototype, "url", {
          /**
           * The URL as resolved by the constructor
           */
          get: function () {
              return this._ws ? this._ws.url : '';
          },
          enumerable: true,
          configurable: true
      });
      /**
       * Closes the WebSocket connection or connection attempt, if any. If the connection is already
       * CLOSED, this method does nothing
       */
      ReconnectingWebSocket.prototype.close = function (code, reason) {
          if (code === void 0) { code = 1000; }
          this._closeCalled = true;
          this._shouldReconnect = false;
          this._clearTimeouts();
          if (!this._ws) {
              this._debug('close enqueued: no ws instance');
              return;
          }
          if (this._ws.readyState === this.CLOSED) {
              this._debug('close: already closed');
              return;
          }
          this._ws.close(code, reason);
      };
      /**
       * Closes the WebSocket connection or connection attempt and connects again.
       * Resets retry counter;
       */
      ReconnectingWebSocket.prototype.reconnect = function (code, reason) {
          this._shouldReconnect = true;
          this._closeCalled = false;
          this._retryCount = -1;
          if (!this._ws || this._ws.readyState === this.CLOSED) {
              this._connect();
          }
          else {
              this._disconnect(code, reason);
              this._connect();
          }
      };
      /**
       * Enqueue specified data to be transmitted to the server over the WebSocket connection
       */
      ReconnectingWebSocket.prototype.send = function (data) {
          if (this._ws && this._ws.readyState === this.OPEN) {
              this._debug('send', data);
              this._ws.send(data);
          }
          else {
              var _a = this._options.maxEnqueuedMessages, maxEnqueuedMessages = _a === void 0 ? DEFAULT.maxEnqueuedMessages : _a;
              if (this._messageQueue.length < maxEnqueuedMessages) {
                  this._debug('enqueue', data);
                  this._messageQueue.push(data);
              }
          }
      };
      /**
       * Register an event handler of a specific event type
       */
      ReconnectingWebSocket.prototype.addEventListener = function (type, listener) {
          if (this._listeners[type]) {
              // @ts-ignore
              this._listeners[type].push(listener);
          }
      };
      ReconnectingWebSocket.prototype.dispatchEvent = function (event) {
          var e_1, _a;
          var listeners = this._listeners[event.type];
          if (listeners) {
              try {
                  for (var listeners_1 = __values(listeners), listeners_1_1 = listeners_1.next(); !listeners_1_1.done; listeners_1_1 = listeners_1.next()) {
                      var listener = listeners_1_1.value;
                      this._callEventListener(event, listener);
                  }
              }
              catch (e_1_1) { e_1 = { error: e_1_1 }; }
              finally {
                  try {
                      if (listeners_1_1 && !listeners_1_1.done && (_a = listeners_1.return)) _a.call(listeners_1);
                  }
                  finally { if (e_1) throw e_1.error; }
              }
          }
          return true;
      };
      /**
       * Removes an event listener
       */
      ReconnectingWebSocket.prototype.removeEventListener = function (type, listener) {
          if (this._listeners[type]) {
              // @ts-ignore
              this._listeners[type] = this._listeners[type].filter(function (l) { return l !== listener; });
          }
      };
      ReconnectingWebSocket.prototype._debug = function () {
          var args = [];
          for (var _i = 0; _i < arguments.length; _i++) {
              args[_i] = arguments[_i];
          }
          if (this._options.debug) {
              // not using spread because compiled version uses Symbols
              // tslint:disable-next-line
              console.log.apply(console, __spread(['RWS>'], args));
          }
      };
      ReconnectingWebSocket.prototype._getNextDelay = function () {
          var _a = this._options, _b = _a.reconnectionDelayGrowFactor, reconnectionDelayGrowFactor = _b === void 0 ? DEFAULT.reconnectionDelayGrowFactor : _b, _c = _a.minReconnectionDelay, minReconnectionDelay = _c === void 0 ? DEFAULT.minReconnectionDelay : _c, _d = _a.maxReconnectionDelay, maxReconnectionDelay = _d === void 0 ? DEFAULT.maxReconnectionDelay : _d;
          var delay = 0;
          if (this._retryCount > 0) {
              delay =
                  minReconnectionDelay * Math.pow(reconnectionDelayGrowFactor, this._retryCount - 1);
              if (delay > maxReconnectionDelay) {
                  delay = maxReconnectionDelay;
              }
          }
          this._debug('next delay', delay);
          return delay;
      };
      ReconnectingWebSocket.prototype._wait = function () {
          var _this = this;
          return new Promise(function (resolve) {
              setTimeout(resolve, _this._getNextDelay());
          });
      };
      ReconnectingWebSocket.prototype._getNextUrl = function (urlProvider) {
          if (typeof urlProvider === 'string') {
              return Promise.resolve(urlProvider);
          }
          if (typeof urlProvider === 'function') {
              var url = urlProvider();
              if (typeof url === 'string') {
                  return Promise.resolve(url);
              }
              if (!!url.then) {
                  return url;
              }
          }
          throw Error('Invalid URL');
      };
      ReconnectingWebSocket.prototype._connect = function () {
          var _this = this;
          if (this._connectLock || !this._shouldReconnect) {
              return;
          }
          this._connectLock = true;
          var _a = this._options, _b = _a.maxRetries, maxRetries = _b === void 0 ? DEFAULT.maxRetries : _b, _c = _a.connectionTimeout, connectionTimeout = _c === void 0 ? DEFAULT.connectionTimeout : _c, _d = _a.WebSocket, WebSocket = _d === void 0 ? getGlobalWebSocket() : _d;
          if (this._retryCount >= maxRetries) {
              this._debug('max retries reached', this._retryCount, '>=', maxRetries);
              return;
          }
          this._retryCount++;
          this._debug('connect', this._retryCount);
          this._removeListeners();
          if (!isWebSocket(WebSocket)) {
              throw Error('No valid WebSocket class provided');
          }
          this._wait()
              .then(function () { return _this._getNextUrl(_this._url); })
              .then(function (url) {
              // close could be called before creating the ws
              if (_this._closeCalled) {
                  return;
              }
              _this._debug('connect', { url: url, protocols: _this._protocols });
              _this._ws = _this._protocols
                  ? new WebSocket(url, _this._protocols)
                  : new WebSocket(url);
              _this._ws.binaryType = _this._binaryType;
              _this._connectLock = false;
              _this._addListeners();
              _this._connectTimeout = setTimeout(function () { return _this._handleTimeout(); }, connectionTimeout);
          });
      };
      ReconnectingWebSocket.prototype._handleTimeout = function () {
          this._debug('timeout event');
          this._handleError(new ErrorEvent(Error('TIMEOUT'), this));
      };
      ReconnectingWebSocket.prototype._disconnect = function (code, reason) {
          if (code === void 0) { code = 1000; }
          this._clearTimeouts();
          if (!this._ws) {
              return;
          }
          this._removeListeners();
          try {
              this._ws.close(code, reason);
              this._handleClose(new CloseEvent(code, reason, this));
          }
          catch (error) {
              // ignore
          }
      };
      ReconnectingWebSocket.prototype._acceptOpen = function () {
          this._debug('accept open');
          this._retryCount = 0;
      };
      ReconnectingWebSocket.prototype._callEventListener = function (event, listener) {
          if ('handleEvent' in listener) {
              // @ts-ignore
              listener.handleEvent(event);
          }
          else {
              // @ts-ignore
              listener(event);
          }
      };
      ReconnectingWebSocket.prototype._removeListeners = function () {
          if (!this._ws) {
              return;
          }
          this._debug('removeListeners');
          this._ws.removeEventListener('open', this._handleOpen);
          this._ws.removeEventListener('close', this._handleClose);
          this._ws.removeEventListener('message', this._handleMessage);
          // @ts-ignore
          this._ws.removeEventListener('error', this._handleError);
      };
      ReconnectingWebSocket.prototype._addListeners = function () {
          if (!this._ws) {
              return;
          }
          this._debug('addListeners');
          this._ws.addEventListener('open', this._handleOpen);
          this._ws.addEventListener('close', this._handleClose);
          this._ws.addEventListener('message', this._handleMessage);
          // @ts-ignore
          this._ws.addEventListener('error', this._handleError);
      };
      ReconnectingWebSocket.prototype._clearTimeouts = function () {
          clearTimeout(this._connectTimeout);
          clearTimeout(this._uptimeTimeout);
      };
      return ReconnectingWebSocket;
  }());

  let connection = undefined;

  function Send(head, body) {
    if (!connection)  {
      connection = Connect(head.clientId, head.groupId);
    }
    connection.send(JSON.stringify({head, body}));
  }

  function Close() {
    if (connection) {
      connection.close();
    }
    connection = undefined;
  }

  function Connect(clientId, groupId) {
    const protocol = location.href.indexOf("https") !== -1 ? "wss://" : "ws://";
    const url = `${protocol}${location.host}/api/scrumpoker/ws/${clientId}/${groupId}`;
    const websocket = new ReconnectingWebSocket(url);

    websocket.addEventListener("message", event => {
      window.dispatchEvent(
        new CustomEvent(`websocket-event`, {
          bubbles: true,
          detail: JSON.parse(event.data),
        })
      );
    });

    return websocket
  }

  const template$1 = `
<div class="container">
  <component-admin-setting
    if:true="{{isAdmin}}"
    description="{{initialSessionDescription}}"
    cardselectionlist="{{initialSessionCardSelectionList}}"
    joincode="{{sessionJoinCode}}"
    on:description-change="descriptionChangeHandler"
    on:card-selection-list-change="cardSelectionListChangeHandler"
    on:show-card="showCardHandler"
    on:new-game="newGameHandler"
    ></component-admin-setting>

  <div class="game-area primary-bg primary-color box-shadow-1 grid">
    <div class="grid-r1">
      <span>Task Description: </span>
      <span>{{sessionDescription}}</span>
    </div>
    <component-input-text
      id="inputUsername"
      class="grid-r2 grid-c1"
      placeholder="Name"
      initial-value="{{initialUsername}}"
      label="Username"
      on:input-complete="inputUsernameCompleteHandler"
      ></component-input-text>
    <div class="grid-r2 grid-c2">
      <span>Mode </span>
      <component-input-button
        icon="{{usermodeIcon}}"
        text="{{usermodeText}}"
        on:click="clickHandlerSetUsermode"></component-input-button>
    </div>
    <component-table class="grid-r3"></component-table>
  </div>

  <div>
    {{sessionCardSelectionList}}
  </div>
</div>
`;

  const style$1 = `
.container {
  width: 100%;
  height: 100%;
}
.game-area {
  margin-top: 0.5rem;
  border-radius: 0.5rem;
  padding: 0.5rem;
  justify-content: center;
}
component-table {
  grid-column: 2 span;
}
`;

  defineNewComponent(
    "view-session",
    {
      template: template$1,
      style: style$1,
      attributes: [],
      state: {
        clientId: localStorage.getItem("clientId"),
        sessionId: localStorage.getItem("sessionId"),
        session: {},
        client: {},
        initialSessionDescription: "",
        initialSessionCardSelectionList: "",
        sessionDescription: "",
        sessionCardSelectionList: "",
        sessionJoinCode: "",
        isAdmin: false,
        initialUsername: "",
        usermodeIcon: "mu-user",
        usermodeText: "User",
      },
      async connected() {
        this.clientId= localStorage.getItem("clientId");
        this.sessionId= localStorage.getItem("sessionId");
        if (!this.clientId || !this.sessionId)
          location.hash = "#login";

        window.removeEventListener(`websocket-event`, this.wsEventHandler.bind(this));
        window.addEventListener(`websocket-event`, this.wsEventHandler.bind(this));

        const clientResp = await reqClientFetch$1({clientId: this.clientId});
        this.client = clientResp.body;
        this.initialUsername = this.client.name;
        this.updateUsermode();

        const sessionResp = await reqSessionFetch$1({sessionId: this.sessionId});
        this.session = sessionResp.body;
        this.sessionDescription =  this.session.description;
        this.initialSessionDescription =  this.session.description;
        this.initialSessionCardSelectionList =  this.session.cardSelectionList || "☕=true,1=true,2=true,3=true,4=true,5=true,6=true,7=true,8=true,9=true,10=true";
        this.sessionJoinCode =  this.session.joinCode;
        this.isAdmin = this.session.ownerClientId == this.clientId;

        Close();
        Connect(this.client.id, this.session.id);
        this.sendUpdate();
      },
      observer: {},
      methods: {
        inputUsernameCompleteHandler(event) {
          this.client.name = event.detail.value;
          this.sendUpdate();
        },
        clickHandlerSetUsermode() {
          const viewer = this.client.viewer === true || this.client.viewer === "true";
          this.client.viewer = !viewer;
          this.sendUpdate();
        },
        updateUsermode() {
          if (this.client.viewer) {
            this.usermodeIcon = "mu-show";
            this.usermodeText = "Viewer";
          } else {
            this.usermodeIcon = "mu-user";
            this.usermodeText = "User";
          }
        },
        toggleAboutSheetHandler(_e) {
          this.showAboutSheet = !this.showAboutSheet;
        },
        closeAboutSheetHandler(_e) {
          this.showAboutSheet = false;
        },
        wsEventHandler(event) {
          if (event.detail.head.action !== "update") return

          this.sessionDescription = event.detail.body.session.description;
          this.sessionCardSelectionList = event.detail.body.session.cardSelectionList;
          this.updateUsermode();
        },
        descriptionChangeHandler({detail}){
          this.session.description = detail.value;
          this.sendUpdate();
        },
        cardSelectionListChangeHandler({detail}){
          this.session.cardSelectionList = detail.value;
          this.sendUpdate();
        },
        showCardHandler({detail}){
          console.log("showCardHandler", detail);
        },
        newGameHandler({detail}){
          console.log("newGameHandler", detail);
        },
        sendUpdate() {
          Send({
            action: "update",
            groupId: this.sessionId,
            clientId: this.clientId,
          }, {
            session: this.session,
            client: this.client,
          });
        },
      },
    }
  );

  const template = `
<div class="full">
  <component-header>
    <div slot="content">
      <button class="btn header-slot-item" on:click="toggleAboutSheetHandler">
        About
      </button>
    </div>
  </component-header>

  <view-router initial="#login"></view-router>

  <component-sheet if:true="{{showAboutSheet}}" on:close="closeAboutSheetHandler">
    <div slot="content" class="sheet-content">
      <component-about />
    </div>
  </component-sheet>
</div>
`;

  const style = `
view-router {
  width: 100%;
  height: 100%;
  position: absolute;
  padding: 3.5rem 0.5rem 0.5rem 0.5rem;
}
`;

  defineNewComponent(
    "view-app",
    {
      template,
      style,
      attributes: [],
      state: {
        showAboutSheet: false
      },
      methods: {
        toggleAboutSheetHandler(_e) {
          this.showAboutSheet = !this.showAboutSheet;
        },
        closeAboutSheetHandler(_e) {
          this.showAboutSheet = false;
        }
      },
    }
  );
  document.body.innerHTML = "<view-app />";

})();
//# sourceMappingURL=bundle.js.map
