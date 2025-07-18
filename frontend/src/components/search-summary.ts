import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("search-summary")
export class SearchSummary extends LitElement {
  static styles = css`
    .summary-bar {
      width: 100%;
      background-color: var(--d2l-color-regolith);
      border: 1px solid var(--d2l-color-sylvite);
      font-family: inherit;
      display: flex;
      gap: 1rem;
      justify-content: start;
      align-items: center;
      padding: 0.75rem 1rem;
      border-radius: 5px;
      margin-top: 1rem;
      cursor: pointer;
    }
    .summary-bar:hover {
      background-color: var(--d2l-color-sylvite);
      border-color: var(--d2l-color-gypsum);
    }
    .action {
      color: var(--d2l-color-celestine);
      font-weight: 700;
      font-size: 0.7rem 11.2px;
      letter-spacing: 0.2px;
      line-height: 0.9rem;
    }

    .info {
      color: var(--d2l-color-galena);
      font-weight: 400;
      font-size: 0.7rem 11.2px;
      letter-spacing: 0.2px;
      line-height: 0.9rem;
    }
  `;

  @property({ type: Number }) totalResults = 0;

  render() {
    return html`
      <button class="summary-bar" @click=${this._clearSearch}>
        <div class="info">${this.totalResults} Search Results</div>
        <span class="action"> Clear Search </span>
      </button>
    `;
  }

  private _clearSearch() {
    this.dispatchEvent(
      new CustomEvent("clear-search", { bubbles: true, composed: true })
    );
  }
}
