import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-text.js";
import "@brightspace-ui/core/components/inputs/input-textarea.js";
import "@brightspace-ui/core/components/inputs/input-checkbox.js";
import "@brightspace-ui/core/components/alert/alert-toast.js";
import "@brightspace-ui/core/components/button/button.js";
import "@brightspace-ui/core/components/tooltip/tooltip.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import "../components/loader-spinner";
import "@brightspace-ui/core/components/button/button.js";

import { getLtik } from "../utils/helper";
import { Router } from "@vaadin/router";
import axios from "axios";
import type { ImageItem } from "../types/image-item";

@customElement("insert-page")
export class InsertPage extends LitElement {
  static styles = [
    css`
      .container {
        display: flex;
        margin-top: 1rem;
        flex-direction: column;
        align-items: flex-start;
      }
      .horizontal-flex {
        display: flex;
        width: 100%;
        gap: 2rem;
      }
      .preview {
        width: 500px;
        height: 310px;
        max-width: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .preview img {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        object-position: center;
      }
      .form-group {
        max-width: 400px;
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        padding-right: 0.5rem;
      }
      .form-actions {
        margin-top: 1rem;
        display: flex;
        gap: 1rem;
      }
      .checkbox-margin {
        margin-top: 0.5rem;
      }

      d2l-button {
        --d2l-button-padding-inline-end: 2rem;
        --d2l-button-padding-inline-start: 2rem;
      }

      d2l-button button {
        border-radius: 5px;
      }

      d2l-button[primary] {
        --d2l-color-celestine: #0070f2;
        --d2l-color-celestine-minus-1: #0358b8ff;
      }

      d2l-button[secondary] {
        --d2l-color-gypsum: #e0e5ebff;
        --d2l-color-mica: #d1d5d9;
      }
    `,
  ];

  @state() private ltik: string = "";
  @state() private altText: string = "";
  @state() private isDecorative: boolean = false;
  @state() private submitting = false;
  @state() private isAuthenticatedUser = false;
  @state() private errorMessage: string = "";

  @state() private image: ImageItem = {
    id: "",
    name: "",
    thumbnailUrl: "",
    fullImageUrl: "",
    imageWidth: 0,
    imageHeight: 0,
    createDate: "",
  };
  @state() public title: string = "";

  async firstUpdated() {
    this.ltik = getLtik();
    const stored = sessionStorage.getItem("selectedImage");
    if (stored) {
      const img: ImageItem = JSON.parse(stored);
      this.image = {
        id: img.id || "",
        name: img.name || "",
        thumbnailUrl: img.thumbnailUrl || "",
        fullImageUrl: img.fullImageUrl || "",
        imageWidth: img.imageWidth || 0,
        imageHeight: img.imageHeight || 0,
        createDate: img.createDate || "",
      };
      this.title = img.name || "";
    } else {
      this.image = {
        id: "",
        name: "",
        thumbnailUrl: "",
        fullImageUrl: "",
        imageWidth: 0,
        imageHeight: 0,
        createDate: "",
      };
      this.title = "";
    }

    try {
      const response = await axios.get("/oauth/check", {
        withCredentials: true,
      });

      console.log(
        "Response from /oauth/check:",
        response.status,
        response.data
      );

      if (
        response.status === 200 &&
        response.data &&
        response.data.authenticated
      ) {
        this.isAuthenticatedUser = true;
        return;
      } else {
        const currentPath = window.location.pathname;
        const currentSearchParams = window.location.search;
        const returnToUrl = `${currentPath}${currentSearchParams}`;
        setTimeout(() => {
          window.location.href = `/oauth/login?returnTo=${encodeURIComponent(
            returnToUrl
          )}`;
        }, 500);
        return;
      }
    } catch (error: any) {
      console.error(
        "Error checking D2L authentication status:",
        error.message || error
      );

      if (axios.isAxiosError(error) && error.response) {
        console.error("Axios error response status:", error.response.status);
        console.error("Axios error response data:", error.response.data);
      }
      console.error(
        "Failed to check D2L authentication status. Please try again."
      );
      setTimeout(() => {
        window.location.href = "/deeplink";
      }, 500);
      return;
    }
  }

  private goBack() {
    Router.go(`/details?ltik=${this.ltik}`);
  }
  private goToSearch() {
    Router.go(`/deeplink?ltik=${this.ltik}`);
  }

  private async submitForm() {
    if (this.submitting) return;
    this.submitting = true;
    this.errorMessage = "";

    try {
      const form = document.createElement("form");
      form.method = "POST";
      form.action = `/insert?ltik=${this.ltik}`;
      form.style.display = "none";

      const imageUrlInput = document.createElement("input");
      imageUrlInput.name = "imageUrl";
      imageUrlInput.value = this.image.fullImageUrl;
      form.appendChild(imageUrlInput);

      const altTextInput = document.createElement("input");
      altTextInput.name = "altText";
      altTextInput.value = this.altText;
      altTextInput.disabled = this.isDecorative;
      form.appendChild(altTextInput);

      const isDecorativeInput = document.createElement("input");
      isDecorativeInput.name = "isDecorative";
      isDecorativeInput.value = this.isDecorative ? "true" : "false";
      isDecorativeInput.type = "hidden";
      form.appendChild(isDecorativeInput);

      const titleInput = document.createElement("input");
      titleInput.name = "title";
      titleInput.value = this.title;
      form.appendChild(titleInput);

      if (this.image.id) {
        const imageIdInput = document.createElement("input");
        imageIdInput.name = "imageId";
        imageIdInput.value = this.image.id;
        form.appendChild(imageIdInput);
      }

      document.body.appendChild(form);
      sessionStorage.removeItem("selectedImage");
      form.submit();
    } catch (err: any) {
      console.error(err);
      this.errorMessage =
        "An error occurred during form submission. Please try again.";
    } finally {
      this.submitting = false;
    }
  }

  render() {
    if (!this.isAuthenticatedUser) {
      return html`<loader-spinner .overlay=${true}></loader-spinner>`;
    }

    return html`
      <d2l-breadcrumbs>
        <d2l-breadcrumb
          href="#"
          text="Search Results"
          @click=${this.goToSearch}
          style="cursor:pointer;"
        ></d2l-breadcrumb>
        <d2l-breadcrumb
          href="#"
          text="Details"
          @click=${this.goBack}
          style="cursor:pointer;"
        ></d2l-breadcrumb>
      </d2l-breadcrumbs>
      <div class="container">
        <div class="horizontal-flex">
          <div class="preview">
            <img
              src=${this.image.fullImageUrl}
              alt=${this.image.name}
              crossorigin="anonymous"
            />
          </div>
          <div class="form-group">
            <d2l-input-textarea
              id="tooltip-error"
              label="Alternative Text (Describe your image)"
              .value=${this.altText}
              rows="2"
              max-rows="5"
              ?disabled=${this.isDecorative}
              @input=${(e: any) => (this.altText = e.target.value)}
              style="font-size: 1.1em;"
            ></d2l-input-textarea>

            ${!this.altText && !this.isDecorative
              ? html`<d2l-tooltip for="tooltip-error" state="error">
                  Provide alt text or mark image as decorative
                </d2l-tooltip>`
              : ""}

            <d2l-input-checkbox
              class="checkbox-margin"
              .checked=${this.isDecorative}
              @change=${(e: any) => {
                this.isDecorative = e.target.checked;
                if (this.isDecorative) this.altText = "";
              }}
              >This image is decorative</d2l-input-checkbox
            >
          </div>
        </div>
        <div class="form-actions">
          <d2l-button text="Back" @click=${this.goBack} secondary
            >Back</d2l-button
          >
          <d2l-button
            text="Insert"
            primary
            @click=${this.submitForm}
            ?disabled=${this.isDecorative
              ? false
              : !this.altText || this.submitting}
          >
          </d2l-button>
        </div>
      </div>
      ${this.errorMessage
        ? html`<d2l-alert-toast open type="critical"
            >${this.errorMessage}</d2l-alert-toast
          >`
        : null}
    `;
  }
}
