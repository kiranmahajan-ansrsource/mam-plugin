import { LitElement, html } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@brightspace-ui/core/components/alert/alert-toast.js";

@customElement("toast-alert")
export class ToastAlerts extends LitElement {
  @property({ type: String }) message = "";
  @property({ type: Boolean }) isFallback = false;

  render() {
    if (!this.message) return null;
    return html`
      <d2l-alert-toast
        type=${this.isFallback ? "warning" : "critical"}
        open
        aria-label=${this.isFallback ? "Fallback message" : "Critical error"}
      >
        ${this.message}
      </d2l-alert-toast>
    `;
  }
}
