import { defineNewComponent } from "../base_component.js";

const template = `
<div id="wrapper" class="wrapper">
  <span id="text">{{text}}</span>
</div>
`;

const style = `
.wrapper {
  max-width: 100%;
  overflow: hidden;
  white-space: nowrap;
  padding-top: 0.125rem;
  text-overflow: ellipsis;
}
span {
  display: inline-block;
  transform: translateX(0);
  transition: transform 3s 3s ease;
}
`;

const speed = 30; // px/s
const stopTimeout = 2; // s
const maxScrollbackDuration = 1; // s
defineNewComponent(
  "component-scroll-text",
  {
    template,
    style,
    attributes: ["dir", "text", "scrolling"],
    state: {
      scrollTimeout: undefined,
    },
    connected() {
      if (this.dir === "v") this.refs.wrapper.style.whiteSpace = "initial";
      window.addEventListener("resize", this.startScrolling.bind(this));
    },
    disconnected() {
      window.removeEventListener("resize", this.startScrolling.bind(this));
    },
    observer: {
      text() {
        this.startScrolling();
      },
      scrolling(newVal) {
        // explicitly check boolean values or start endless scroll on undefined
        if (newVal === "true") {
          this.startScrolling();
        } else if (newVal === "false") {
          this.stopScrolling();
        } else {
          this.startScrolling();
        }
      },
    },
    methods: {
      startScrolling() {
        // endless scrolling if undefined
        if (this.scrolling && this.scrolling === "false") return;

        this.stopScrolling();
        if (this.dir === "h") this.scrollHorizontally();
        else this.scrollVertically();
      },
      stopScrolling() {
        clearTimeout(this.scrollTimeout);
        this.refs.text.style.transition = `transform 0s linear`;
        this.refs.text.style.transform = `translate(0px, 0px)`;
      },
      scrollVertically() {
        clearTimeout(this.scrollTimeout);
        const scrollDistance = this.refs.text.clientHeight - this.refs.text.parentNode.clientHeight;
        if (scrollDistance < 5) {
          return;
        }
        const time = scrollDistance / speed;
        const scrollbackDuration = Math.min(time, maxScrollbackDuration);
        this.refs.text.style.transition = `transform ${time}s ${stopTimeout}s linear`;
        this.refs.text.style.transform = `translateY(-${scrollDistance}px)`;
        this.scrollTimeout = setTimeout(() => {
          this.refs.text.style.transition = `transform ${scrollbackDuration}s ${stopTimeout}s linear`;
          this.refs.text.style.transform = `translateY(0px)`;
          this.scrollTimeout = setTimeout(
            this.scrollHorizontally.bind(this),
            (scrollbackDuration + stopTimeout) * 1000
          );
        }, (time + stopTimeout) * 1000);
      },
      scrollHorizontally() {
        clearTimeout(this.scrollTimeout);
        const scrollDistance = this.refs.text.clientWidth - this.refs.text.parentNode.clientWidth;
        if (scrollDistance < 5) {
          return;
        }
        const time = scrollDistance / speed;
        const scrollbackDuration = Math.min(time, maxScrollbackDuration);
        this.refs.text.style.transition = `transform ${time}s ${stopTimeout}s linear`;
        this.refs.text.style.transform = `translateX(-${scrollDistance}px)`;
        this.scrollTimeout = setTimeout(() => {
          this.refs.text.style.transition = `transform ${scrollbackDuration}s ${stopTimeout}s linear`;
          this.refs.text.style.transform = `translateX(0px)`;
          this.scrollTimeout = setTimeout(
            this.scrollHorizontally.bind(this),
            (scrollbackDuration + stopTimeout) * 1000
          );
        }, (time + stopTimeout) * 1000);
      },
    },
  }
);
