import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-text.js";
import "@brightspace-ui/core/components/inputs/input-textarea.js";
import "@brightspace-ui/core/components/inputs/input-checkbox.js";
import "@brightspace-ui/core/components/button/button.js";
import "@brightspace-ui/core/components/tooltip/tooltip.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "../components/loader-spinner";
import "../components/image-container";
import "../components/toast-alert";
import {
  checkAuthOrRedirect,
  createInsertForm,
  getLtik,
  getStoredImage,
  goToDetails,
  goToSearch,
  submitInsertForm,
  validateAltText,
} from "../utils/helper";
import { sharedStyles } from "../components/shared-styles";

@customElement("insert-page")
export class InsertPage extends LitElement {
  static styles = [
    sharedStyles,
    css`
      .alt-text-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }
      d2l-input-textarea {
        width: 99.5%;
      }
      .checkbox {
        margin-top: 0.5rem;
        cursor: pointer;
      }
    `,
  ];

  @state() private ltik: string = "";
  @state() private altText: string = "";
  @state() private isDecorative: boolean = false;
  @state() private isSubmitting = false;
  @state() private isAuthenticatedUser = false;
  @state() private errorMessage: string = "";
  @state() private image: any = {};

  async firstUpdated() {
    this.ltik = getLtik();
    const { image, altText, isDecorative } = getStoredImage();
    this.image = image;
    this.altText = altText;
    this.isDecorative = isDecorative;

    this.isAuthenticatedUser = await checkAuthOrRedirect();
  }

  private async submitForm() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.errorMessage = "";

    const validationError = validateAltText(this.altText, this.isDecorative);
    if (validationError) {
      this.errorMessage = validationError;
      this.isSubmitting = false;
      return;
    }

    try {
      const form = createInsertForm({
        image: this.image,
        altText: this.altText,
        isDecorative: this.isDecorative,
        ltik: this.ltik,
      });

      submitInsertForm(form);
    } catch (err: any) {
      this.isSubmitting = false;
      this.errorMessage = "";
      await this.updateComplete;
      this.errorMessage =
        "An error occurred during form submission. Please try again.";
    }
  }

  render() {
    if (!this.isAuthenticatedUser || this.isSubmitting) {
      return html`<loader-spinner></loader-spinner>`;
    }
    return html`
      <header class="header-container">
        <d2l-breadcrumbs>
          <d2l-breadcrumb
            href="#"
            text="Search Results"
            @click=${() => goToSearch(this.ltik)}
          ></d2l-breadcrumb>
          <d2l-breadcrumb
            href="#"
            text="Details"
            @click=${() => goToDetails(this.ltik)}
          ></d2l-breadcrumb>
        </d2l-breadcrumbs>
      </header>

      <main class="main-container mt-1 mb-1" aria-label="Image insert page">
        <image-container
          .src=${this.image.Path_TR1?.URI || ""}
          .alt=${this.image.Title || this.image.SystemIdentifier || ""}
        ></image-container>

        <div class="alt-text-container">
          <d2l-input-textarea
            id="tooltip-error"
            label="Alternative Text (Describe your image)"
            .value=${this.altText}
            rows="2"
            max-rows="5"
            ?disabled=${this.isDecorative}
            @input=${(e: any) => (this.altText = e.target.value)}
          ></d2l-input-textarea>

          ${!this.altText && !this.isDecorative
            ? html`<d2l-tooltip for="tooltip-error" state="error">
                Provide alt text or mark image as decorative
              </d2l-tooltip>`
            : ""}

          <d2l-input-checkbox
            class="checkbox"
            .checked=${this.isDecorative}
            @change=${(e: any) => {
              this.isDecorative = e.target.checked;
              if (this.isDecorative) this.altText = "";
            }}
            >This image is decorative</d2l-input-checkbox
          >
        </div>
      </main>

      <footer class="footer-container">
        <d2l-button
          text="Back to Image Details"
          @click=${() => goToDetails(this.ltik)}
          secondary
          >Back to Image Details</d2l-button
        >
        <d2l-button
          class="ml-1"
          text="Insert Image"
          primary
          @click=${this.submitForm}
          ?disabled=${this.isDecorative
            ? false
            : !this.altText || this.isSubmitting}
        >
          Insert Image
        </d2l-button>
      </footer>

      <toast-alert
        .message=${this.errorMessage}
        .isFallback=${false}
      ></toast-alert>
    `;
  }
}
