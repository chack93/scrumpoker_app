import { defineNewComponent } from "../base_component.js";

const template = `
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

const style = `
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
    template,
    style,
    attributes: ["description", "cardselectionlist", "joincode"],
    state: {
      joinLink: "",
      cardSelectionList: [{key: "", idx: 0, value: "1", active: true}],
      cardCount: 1,
    },
    connected() {
      this.joinLink = `${location.origin}${location.pathname}?join=${this.joincode}`
      this.setCardSelectionList(this.cardselectionlist)
    },
    observer: {
      joincode(newValue) {
        this.joinLink = `${location.origin}${location.pathname}?join=${newValue}`
      },
      cardselectionlist(newValue) {
        this.setCardSelectionList(newValue)
      },
      cardSelectionList(newValue) {
        const value = newValue
          .map(({value, active}) => `${value}=${active}`)
          .join(",")
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
        this.cardSelectionList = this.parseCardSelectionString(str)
        if (this.cardSelectionList.length > 0) {
          this.cardCount = parseInt(this.cardSelectionList.length)
        }
      },
      parseCardSelectionString(str) {
        return str.split(",").map((el, idx) => {
          const [value,active] = el.split("=")
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
        const value = parseInt(event.detail.value)
        if (value.isNaN) return

        const newList = this.cardSelectionList.slice(0, value)

        const cardSelListLen = this.cardSelectionList.length
        const missingCount = value - cardSelListLen
        let newElements = []
        if (missingCount > 0) {
          let lastValue = 0
          if (cardSelListLen > 0) 
            lastValue = parseInt(this.cardSelectionList[cardSelListLen-1].value) || 0
          newElements = Array(missingCount).fill().map((_,idx) => ({
            key: this.getCardKey(cardSelListLen+1, lastValue+1, true),
            idx: cardSelListLen+idx,
            value: lastValue+idx+1,
            active: true,
          }))
        }
        this.cardSelectionList = [...newList, ...newElements]
      },
      clickCopyJoinCodeHandler() {
        navigator.clipboard.writeText(this.joinLink)
        this.refs.iconCopy.classList.add("anim-logo-jump")
        setTimeout(() => this.refs.iconCopy.classList.remove("anim-logo-jump"), 700)
      },
      clickHandlerSetDefault() {
        this.setCardSelectionList("☕=true,1=true,2=true,3=true,4=true,5=true,6=true,7=true,8=true,9=true,10=true"        )
      },
      updateEstimationCardHandler(event) {
        if (event.detail && event.detail.index) {
          const idx = event.detail.index
          const el = this.cardSelectionList.find(el => el.idx == idx)
          el.active = event.detail.active
          el.value = event.detail.value
          el.key = this.getCardKey(el.idx, el.value, el.active)
          const copy = [...this.cardSelectionList]
          this.cardSelectionList = copy
        }
      }
    },
  }
);
