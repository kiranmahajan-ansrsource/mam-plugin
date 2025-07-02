import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "./pages/search-page.ts";
import "./pages/details-page.ts";
import "./pages/insert-page.ts";
import { configureModal } from "./utils/configure-modal";

@customElement("insert-stuff-app")
export class InsertStuffApp extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 16px;
    }
  `;

  @state() private view: "search" | "details" | "insert" = "search";
  @state() private selectedImage: any = null;

  firstUpdated() {
    this._updateModal();
  }

  updated() {
    this._updateModal();
  }

  private _updateModal() {
    configureModal({
      back:
        this.view === "details"
          ? this._goToSearch
          : this.view === "insert"
          ? this._goToDetails
          : null,
      next:
        this.view === "search"
          ? null
          : this.view === "details"
          ? this._goToInsert
          : this._handleInsert,
      cancel: () => {
        if (confirm("Are you sure you want to cancel?")) {
          window.parent.postMessage({ subject: "lti.close" }, "*");
        }
      },
      insertMode: this.view === "insert",
    });
  }

  private _goToSearch = async () => {
    this.view = "search";
    await this.updateComplete;
    this._updateModal();
  };

  private _goToDetails = async () => {
    this.view = "details";
    await this.updateComplete;
    this._updateModal();
  };

  private _goToInsert = async () => {
    this.view = "insert";
    await this.updateComplete;
    this._updateModal();
  };

  private _handleImageSelected = (e: CustomEvent) => {
    const image = e.detail;
    if (image) {
      this.selectedImage = image;
      this._goToDetails();
    } else {
      this._goToSearch();
    }
  };
  private _handleProceedToInsert = (e: CustomEvent) => {
    this.selectedImage = e.detail;
    this._goToInsert();
  };

  private _handleInsert = () => {
    const insertComponent = this.shadowRoot!.querySelector(
      "insert-page"
    ) as any;
    insertComponent?.triggerInsert?.();
  };

  render() {
    return html`
      ${this.view === "search"
        ? html`<search-page
            @image-selected=${this._handleImageSelected}
          ></search-page>`
        : this.view === "details"
        ? html`<details-page
            .image=${this.selectedImage}
            @proceed-to-insert=${this._handleProceedToInsert}
            @image-selected=${this._handleImageSelected}
          ></details-page>`
        : html`<insert-page
            .image=${this.selectedImage}
            @image-selected=${this._handleImageSelected}
          ></insert-page>`}
    `;
  }
}
