import { LitElement, css, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-search.js";

@customElement("search-bar")
export class SearchBar extends LitElement {
  static styles = css`
    d2l-input-search {
      width: 99.5%;
    }
  `;
  @property({ type: String }) value = "";

  render() {
    return html`
      <d2l-input-search
        label="Search"
        placeholder="Search..."
        .value=${this.value}
        aria-label="Search for images"
        @d2l-input-search-searched=${(e: any) =>
          this.dispatchEvent(new CustomEvent("search", { detail: e.detail }))}
        @input=${(e: any) =>
          this.dispatchEvent(
            new CustomEvent("input-change", { detail: e.target.value })
          )}
      ></d2l-input-search>
    `;
  }
}
