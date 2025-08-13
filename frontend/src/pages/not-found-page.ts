import { css, html, LitElement } from "lit";
import { customElement } from "lit/decorators.js";

@customElement("not-found-page")
export class NotFoundPage extends LitElement {
  static styles = css`
    .main-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  `;
  render() {
    return html`
      <main class="main-container" role="main" aria-label="Not Found">
        <h1>404 - Page Not Found</h1>
        <p>The page you are looking for does not exist.</p>
      </main>
    `;
  }
}
