import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";

@customElement("loader")
export class Loader extends LitElement {
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
      background: rgba(255, 255, 255, 0.8);
      z-index: 9999;
    }
  `;

  @property({ type: Number }) size = 100;

  render() {
    return html`
      <div class="loader-container">
        <d2l-loading-spinner .size=${this.size}></d2l-loading-spinner>
      </div>
    `;
  }
}
