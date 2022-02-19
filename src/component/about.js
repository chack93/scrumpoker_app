import { defineNewComponent } from "../base_component.js";

const template = `
<h1>Impressum nach Mediengesetz §24</h1>
<pre>
10.Februar 2022

Christian Hackl
Stübegg 9
2871 Zöbern
Österreich
</pre>

<hr />

<h1>License</h1>
<h2>Microns Icon Font</h2>
  Project Homepage: <a href="https://www.s-ings.com/projects/microns-icon-font/">Microns Icon Font</a>
  <br />
  Icons/Artwork: Distributed under <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA</a> licence.
  <br />
  Font: Distributed under <a href="https://scripts.sil.org/cms/scripts/page.php?item_id=OFL_web">SIL Open Font Licence</a> licence.
  <br />
  <br />
`;
const style = `
a {
  color: inherit;
}
`;

defineNewComponent(
  "component-about",
  {
    template,
    style,
  }
);
