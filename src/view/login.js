import {reqClientCreate, reqSessionJoinCodeFetch, reqSessionCreate} from "../api/rest.js";
import { defineNewComponent } from "../base_component.js";
import { firstnames, hexMagicNumbers, lastnames, passwords } from "../util/lists.js";

const template = `
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

const style = `
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
    template,
    style,
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
      const jc = new URLSearchParams(window.location.search).get("join")
      if (jc) {
        this.joinCode = jc
      }
      this.toggleJoinButtonState()

      const firstname = firstnames[Math.round(Math.random()*(firstnames.length-1))]
      const lastname = lastnames[Math.round(Math.random()*(lastnames.length-1))]
      this.randomName = `${firstname} ${lastname}`
      this.hexMagicNr = hexMagicNumbers[Math.round(Math.random()*(hexMagicNumbers.length-1))]
      this.randomPassword = passwords[Math.round(Math.random()*(passwords.length-1))]
      this.showError = false
    },
    observer: {},
    methods: {
      inputCompleteHandler() {
        const username = this.refs.inputName.value
        const join = this.refs.inputJoin.value
        localStorage.setItem("username", username)
        localStorage.setItem("joinCode", join)
        this.toggleJoinButtonState()
      },
      toggleJoinButtonState() {
        const username = this.refs.inputName.value
        const join = this.refs.inputJoin.value
        this.joinButtonActive = username && join && join.length >= 6 && !this.requestPending
      },
      async clickHandlerCreate() {
        this.requestPending = true
        this.toggleJoinButtonState()

        try {
          const username = this.refs.inputName.value
          const newClient = await reqClientCreate({name: username})
          localStorage.setItem("clientId", newClient.body.id)
        }catch(e) {
          console.error("create/create-client", e)
          this.errorText = "Create new session failed"
          this.showError = true
          this.requestPending = false
          return
        }

        try {
          const newSession = await reqSessionCreate({
            ownerClientId: localStorage.getItem("clientId")
          })
          localStorage.setItem("sessionId", newSession.body.id)
          localStorage.setItem("joinCode", newSession.body.joinCode)
        }catch(e) {
          console.error("login/create-session", e)
          this.errorText = "Login Failed"
          this.showError = true
          this.requestPending = false
          return
        }
        location.hash="#session"
        this.requestPending = false
      },
      inputKeydownHandler(event) {
        if (event.key === "Enter") {
          this.join()
        }
      },
      clickHandlerJoin(_event) {
        this.join()
      },
      async join() {
        this.requestPending = true
        this.toggleJoinButtonState()

        const username = this.refs.inputName.value
        const joinCode = this.refs.inputJoin.value
        //const password = this.refs.inputPassword.value

        try {
          const session = await reqSessionJoinCodeFetch({joinCode})
          localStorage.setItem("sessionId", session.body.id)
          localStorage.setItem("joinCode", joinCode)
        }catch(e) {
          console.error("login/get-session", e)
          this.errorText = "Unknown Join Code"
          this.showError = true
          this.requestPending = false
          return
        }
        try {
          const sessionId = localStorage.getItem("sessionId")
          const newClient = await reqClientCreate({name: username, sessionId})
          localStorage.setItem("clientId", newClient.body.id)
        }catch(e) {
          console.error("login/create-client", e)
          this.errorText = "Login failed"
          this.showError = true
          this.requestPending = false
          return
        }
        location.hash="#session"
        this.requestPending = false
      }
    },
  }
);
