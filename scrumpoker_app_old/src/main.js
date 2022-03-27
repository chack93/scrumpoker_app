import "./style/app.scss"
import "./component/about.js";
import "./component/header.js";
import "./component/sheet.js";
import "./component/scroll-text.js";
import "./component/input-text.js";
import "./component/input-button.js";
import "./component/admin-setting.js";
import "./component/estimation-card.js";
import "./component/table.js";
import "./view/router.js";
import "./view/login.js";
import "./view/session.js";
import {defineNewComponent} from "./base_component.js" 

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
`

const style = `
view-router {
  width: 100%;
  height: 100%;
  position: absolute;
  padding: 3.5rem 0.5rem 0.5rem 0.5rem;
}
`

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
        this.showAboutSheet = !this.showAboutSheet
      },
      closeAboutSheetHandler(_e) {
        this.showAboutSheet = false
      }
    },
  }
)
document.body.innerHTML = "<view-app />"
