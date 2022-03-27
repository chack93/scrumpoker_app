import { defineNewComponent } from "../base_component.js";

const template = `
<div class="container">

{{sessionGameState}}
</div>
`;

const style = `
.container {
  text-align: center;
  padding: 1rem;
}
`;

defineNewComponent(
  "component-table",
  {
    template,
    style,
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
      this.clientId = localStorage.getItem("clientId")
      this.sessionId = localStorage.getItem("sessionId")

      window.removeEventListener(`websocket-event`, this.wsEventHandler.bind(this))
      window.addEventListener(`websocket-event`, this.wsEventHandler.bind(this))

      const clientResp = await reqClientFetch({clientId: this.clientId})
      this.client = clientResp.body

      const sessionResp = await reqSessionFetch({sessionId: this.sessionId})
      this.session = sessionResp.body
    },
    observer: {
      session(newValue) {
        this.sessionGameState = newValue.gameState || ""
      },
      client(newValue) {
        console.log("client", newValue)
      },
      clientList(newValue) {
        console.log("clientList", newValue)
      },
    },
    methods: {
      wsEventHandler(event) {
        if (event.detail.head.action !== "update") return
        this.client = event.detail.body.client
        this.session = event.detail.body.session
        this.clientList = event.detail.body.clientList
      },
    },
  }
);
