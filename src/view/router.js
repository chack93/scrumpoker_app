import { defineNewComponent } from "../base_component.js";

const appName = "SP -"
const routes = {
  "#": { title: `${appName} Login`, view: "view-login" },
  "#login": { title: `${appName} Login`, view: "view-login" },
  "#table": { title: `${appName} Table`, view: "view-table" },
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
