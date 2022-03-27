import Store from "./store.js";
const domParser = new DOMParser();

const store = new Store();

const wait = function (timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
};

export function defineNewComponent(name, componen_object) {
  window.customElements.define(name, NewComponent(componen_object))
}

export function NewComponent({
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
