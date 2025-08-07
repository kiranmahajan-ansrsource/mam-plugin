import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { PageableMixin } from "@brightspace-ui/core/components/paging/pageable-mixin.js";

const PageableBase = PageableMixin(LitElement) as typeof LitElement;

@customElement("d2l-pageable-wrapper")
export class D2LPageableWrapper extends PageableBase {
  private _mutationObserver: MutationObserver | null = null;
  render() {
    return html`
      <slot @slotchange=${this._handleSlotChange}></slot>
      ${(this as any)._renderPagerContainer()}
    `;
  }
  _getItems() {
    const container = this.querySelector(".thumbnail-container");
    return container?.querySelectorAll(".thumbnail") ?? [];
  }

  _getItemByIndex(index: number) {
    return this._getItems()[index];
  }

  _getItemShowingCount() {
    return this._getItems().length;
  }

  _handleSlotChange() {
    const list = this.querySelector(".thumbnail-container");
    if (!list) return;

    if (!this._mutationObserver) {
      this._mutationObserver = new MutationObserver(() =>
        (this as any)._updateItemShowingCount()
      );
    } else {
      this._mutationObserver.disconnect();
    }

    this._mutationObserver.observe(list, { childList: true, subtree: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._mutationObserver?.disconnect();
  }
}
