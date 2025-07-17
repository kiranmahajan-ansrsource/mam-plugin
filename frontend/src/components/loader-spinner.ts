import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";

@customElement("loader-spinner")
export class LoaderSpinner extends LitElement {
  static styles = css`
    .loader-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 100vw;
      position: fixed;
      top: 0;
      left: 0;
      z-index: 50;
    }
    .spinner-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(255, 255, 255, 1);
      z-index: 50;
    }
  `;

  @property({ type: Number }) size = 100;
  @property({ type: Boolean }) overlay = true;

  render() {
    return html`
      <div class="loader-container">
        ${this.overlay
          ? html`<div class="spinner-overlay">
              <d2l-loading-spinner .size=${this.size}></d2l-loading-spinner>
            </div>`
          : html`<d2l-loading-spinner
              .size=${this.size}
            ></d2l-loading-spinner>`}
      </div>
    `;
  }
}
