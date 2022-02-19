export default class Store {
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
