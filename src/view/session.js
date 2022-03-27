import { defineNewComponent } from "../base_component.js";
import { Close, Connect, Send } from "../api/websocket.js";
import {reqClientFetch, reqSessionFetch} from "../api/rest.js";

const template = `
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

const style = `
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
    template,
    style,
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
      this.clientId= localStorage.getItem("clientId")
      this.sessionId= localStorage.getItem("sessionId")
      if (!this.clientId || !this.sessionId)
        location.hash = "#login"

      window.removeEventListener(`websocket-event`, this.wsEventHandler.bind(this))
      window.addEventListener(`websocket-event`, this.wsEventHandler.bind(this))

      const clientResp = await reqClientFetch({clientId: this.clientId})
      this.client = clientResp.body
      this.initialUsername = this.client.name
      this.updateUsermode()

      const sessionResp = await reqSessionFetch({sessionId: this.sessionId})
      this.session = sessionResp.body
      this.sessionDescription =  this.session.description
      this.initialSessionDescription =  this.session.description
      this.initialSessionCardSelectionList =  this.session.cardSelectionList || "☕=true,1=true,2=true,3=true,4=true,5=true,6=true,7=true,8=true,9=true,10=true"
      this.sessionJoinCode =  this.session.joinCode
      this.isAdmin = this.session.ownerClientId == this.clientId

      Close()
      Connect(this.client.id, this.session.id)
      this.sendUpdate()
    },
    observer: {},
    methods: {
      inputUsernameCompleteHandler(event) {
        this.client.name = event.detail.value
        this.sendUpdate()
      },
      clickHandlerSetUsermode() {
        const viewer = this.client.viewer === true || this.client.viewer === "true"
        this.client.viewer = !viewer
        this.sendUpdate()
      },
      updateUsermode() {
        if (this.client.viewer) {
          this.usermodeIcon = "mu-show"
          this.usermodeText = "Viewer"
        } else {
          this.usermodeIcon = "mu-user"
          this.usermodeText = "User"
        }
      },
      toggleAboutSheetHandler(_e) {
        this.showAboutSheet = !this.showAboutSheet
      },
      closeAboutSheetHandler(_e) {
        this.showAboutSheet = false
      },
      wsEventHandler(event) {
        if (event.detail.head.action !== "update") return

        this.sessionDescription = event.detail.body.session.description
        this.sessionCardSelectionList = event.detail.body.session.cardSelectionList
        this.updateUsermode()
      },
      descriptionChangeHandler({detail}){
        this.session.description = detail.value
        this.sendUpdate()
      },
      cardSelectionListChangeHandler({detail}){
        this.session.cardSelectionList = detail.value
        this.sendUpdate()
      },
      showCardHandler({detail}){
        console.log("showCardHandler", detail)
      },
      newGameHandler({detail}){
        console.log("newGameHandler", detail)
      },
      sendUpdate() {
        Send({
          action: "update",
          groupId: this.sessionId,
          clientId: this.clientId,
        }, {
          session: this.session,
          client: this.client,
        })
      },
    },
  }
);
