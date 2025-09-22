import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/alert/alert-toast.js";

@customElement("toast-alert")
export class ToastAlerts extends LitElement {
  @property({ type: String }) message = "";
  @property({ type: Boolean }) isFallback = false;
  @state() private _open = false;

  updated(changed: Map<string, unknown>) {
    if (changed.has("message")) {
      const prev = changed.get("message") as string | undefined;
      const next = this.message;
      if (next) {
             this._open = false;
        setTimeout(() => {
          this._open = true;
          this.requestUpdate();
        }, 0);
      } else if (prev && !next) {
        this._open = false;
      }
    }
  }

  render() {
    if (!this.message) return null;
    return html`
      <d2l-alert-toast
        type=${this.isFallback ? "warning" : "critical"}
        .open=${this._open}
        aria-label=${this.isFallback ? "Fallback message" : "Critical error"}
      >
        ${this.message}
      </d2l-alert-toast>
    `;
  }
}
