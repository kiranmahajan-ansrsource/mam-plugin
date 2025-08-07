import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "./loader-spinner";

@customElement("image-container")
export class ImageContainer extends LitElement {
  static styles = css`
    :host {
      width: 50%;
    }
    .image-container {
      width: 500px;
      height: 310px;
      max-width: 100%;
      display: flex;
      flex: 0 0 50%;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .image-container img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      object-position: center;
    }
  `;

  @property() src = "";
  @property() alt = "";
  @property() crossorigin = "anonymous";
  @state() private loaded = false;

  render() {
    return html`
      <div class="image-container">
        ${!this.loaded ? html`<loader-spinner></loader-spinner>` : null}
        <img
          src=${this.src}
          alt=${this.alt}
          crossorigin=${this.crossorigin}
          style="display: ${this.loaded ? "block" : "none"};"
          @load=${() => (this.loaded = true)}
          @error=${() => (this.loaded = true)}
        />
      </div>
    `;
  }
}
