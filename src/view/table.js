import { defineNewComponent } from "../base_component.js";

const template = `
<div class="container">
hello
</div>
`;

const style = `
.container {
  width: 100%;
  height: 100%;
  padding: 3.5rem 0.5rem 0.5rem;
}
`;

defineNewComponent(
  "view-table",
  {
    template,
    style,
    attributes: [],
    state: {
      joinCodeFromQuery: "",
    },
    connected() {
      this.joinCodeFromQuery = new URLSearchParams(window.location.search).get("join") || ""
      // TODO: read settings from localstorage
      // try to join
    },
    observer: {},
    methods: {
      toggleAboutSheetHandler(_e) {
        this.showAboutSheet = !this.showAboutSheet
      },
      closeAboutSheetHandler(_e) {
        this.showAboutSheet = false
      }
    },
  }
);
