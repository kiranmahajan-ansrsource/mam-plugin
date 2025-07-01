import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-textarea.js";
import "@brightspace-ui/core/components/inputs/input-checkbox.js";
import "@brightspace-ui/core/components/button/button.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import { Router } from "@vaadin/router";
import { configureModal } from "../utils/configure-modal";

interface ImageData {
  id: string;
  name: string;
}

@customElement("insert-page")
export class InsertPage extends LitElement {
  static styles = css`
    d2l-breadcrumbs {
      margin-bottom: 24px;
    }

    .main {
      flex: 1;
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }

    .preview {
      width: 280px;
      height: 280px;
      background-color: #ddd;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 1rem;
      color: #999;
      border: 1px solid #ccc;
    }

    .form-section {
      flex: 1;
      min-width: 300px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .checkbox {
      margin-top: 8px;
    }
  `;

  @state() private image: ImageData = { id: "", name: "" };
  @state() private altText: string = "";
  @state() private isDecorative: boolean = false;

  private _handleAltTextChange(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    this.altText = target.value;
  }

  private _toggleDecorative(e: Event) {
    const target = e.target as HTMLInputElement;
    this.isDecorative = target.checked;
    if (this.isDecorative) this.altText = "";
  }

  private _insert() {
    const payload = {
      image: this.image,
      altText: this.isDecorative ? null : this.altText,
      decorative: this.isDecorative,
    };

    console.log("Insert payload:", payload);

    this.dispatchEvent(
      new CustomEvent("insert-image", {
        detail: payload,
        bubbles: true,
        composed: true,
      })
    );

    alert("Image inserted successfully!");
  }

  connectedCallback() {
    super.connectedCallback();
    const state = history.state;
    if (state?.image) {
      this.image = state.image;
    } else {
      Router.go("/deeplink");
    }

    configureModal({
      back: () => {
        history.pushState({ image: this.image }, "", "/details");
        Router.go("/details");
      },
      next: () => this._insert(),
      cancel: () => Router.go("/deeplink"),
      insertMode: true,
    });
  }

  render() {
    return html`
      <d2l-breadcrumbs>
        <d2l-breadcrumb text="Search"></d2l-breadcrumb>
        <d2l-breadcrumb text="Details"></d2l-breadcrumb>
        <d2l-breadcrumb text="Insert"></d2l-breadcrumb>
      </d2l-breadcrumbs>

      <div class="main">
        <div class="preview">IMAGE PLACEHOLDER</div>

        <div class="form-section">
          <d2l-input-textarea
            label="Alternative Text (Describe your image)"
            .value=${this.altText}
            ?disabled=${this.isDecorative}
            @input=${this._handleAltTextChange}
          ></d2l-input-textarea>

          <div class="checkbox">
            <d2l-input-checkbox
              label="This image is decorative"
              .checked=${this.isDecorative}
              @change=${this._toggleDecorative}
            ></d2l-input-checkbox>
          </div>
        </div>
      </div>
    `;
  }
}
