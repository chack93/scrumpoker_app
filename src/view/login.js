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
      initial-value=""
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
      initial-value="{{joinCodeFromQuery}}"
      required="true"
      label="Join"
      on:keydown="inputKeydownHandler"
      on:input-complete="inputCompleteHandler"
      ></component-input-text>

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
      joinCodeFromQuery: "",
      randomName: "",
      hexMagicNr: "",
      randomPassword: "",
      showError: true,
      errorText: "Unknown Join Code"
    },
    connected() {
      // TODO: read name from localstorage
      this.joinCodeFromQuery = new URLSearchParams(window.location.search).get("join") || ""
      this.toggleJoinButtonState()
      const firstname = firstnames[Math.round(Math.random()*(firstnames.length-1))]
      const lastname = lastnames[Math.round(Math.random()*(lastnames.length-1))]
      this.randomName = `${firstname} ${lastname}`
      this.hexMagicNr = hexMagicNumbers[Math.round(Math.random()*(hexMagicNumbers.length-1))]
      this.randomPassword = passwords[Math.round(Math.random()*(passwords.length-1))]
    },
    observer: {},
    methods: {
      inputCompleteHandler() {
        this.toggleJoinButtonState()
      },
      toggleJoinButtonState() {
        const name = this.refs.inputName.value
        const join = this.refs.inputJoin.value
        this.joinButtonActive = name && join && join.length >= 6
      },
      clickHandlerCreate() {
        console.log("create", this.refs.inputName.value, this.refs.inputJoin.value, this.refs.inputPassword.value)
        // TODO: create new game
      },
      inputKeydownHandler(event) {
        if (event.key === "Enter") {
          this.join({
            name: this.refs.inputName.value,
            join: this.refs.inputJoin.value,
            password: this.refs.inputPassword.value
          })
        }
      },
      clickHandlerJoin(_event) {
        this.join({
          name: this.refs.inputName.value,
          join: this.refs.inputJoin.value,
          password: this.refs.inputPassword.value
        })
      },
      join({name, join, password}) {
        console.log("join", name, join, password)
        // TODO: search for join code & attach
        // write error if not found or password protected not matching
        // write new user to localstorage
        // redirect to table with join code in query
      }
    },
  }
);
