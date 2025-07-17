import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-text.js";
import "@brightspace-ui/core/components/inputs/input-checkbox.js";
import "@brightspace-ui/core/components/alert/alert.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import "@brightspace-ui/core/components/button/button.js";

import { getLtik } from "../utils/helper";
import { Router } from "@vaadin/router";
import axios from "axios";
import type { ImageItem } from "../types/image-item";

@customElement("insert-page")
export class InsertPage extends LitElement {
  static styles = css`
    .container {
      display: flex;
      gap: 2rem;
      margin-top: 1rem;
    }
    .preview {
      height: 310px;
      min-width: 310px;
      max-width: 400px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .form-group {
      max-width: 400px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .form-actions {
      margin-top: 1rem;
      display: flex;
      gap: 1rem;
    }
  `;

  @state() private ltik: string = "";
  @state() private altText: string = "";
  @state() private isDecorative: boolean = false;
  @state() private submitting = false;
  @state() private isLoadingAuth = true;

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

    if (!this.image.fullImageUrl || !this.image.name) {
      console.error(
        "Missing fullImageUrl or name in sessionStorage. Cannot proceed."
      );
      console.warn(
        "Image URL or name is missing. Please go back and select an image again."
      );
      this.goBack();
      return;
    }

    try {
      this.isLoadingAuth = true;
      const response = await axios.get("/oauth/check", {
        withCredentials: true,
      });

      console.log(
        "Response from /oauth/check:",
        response.status,
        response.data
      );

      if (
        response.status !== 200 ||
        !response.data ||
        !response.data.authenticated
      ) {
        const currentPath = window.location.pathname;
        const currentSearchParams = window.location.search;
        const returnToUrl = `${currentPath}${currentSearchParams}`;

        window.location.href = `/oauth/login?returnTo=${encodeURIComponent(
          returnToUrl
        )}`;
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
      window.location.href = "/deeplink";
      return;
    } finally {
      this.isLoadingAuth = false;
    }
  }

  private goBack() {
    Router.go(`/details?ltik=${this.ltik}`);
  }

  private async submitForm() {
    this.submitting = true;

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
      form.submit();
    } catch (err: any) {
      console.error(err);
      console.error(
        "An error occurred during form submission. Please try again."
      );
    } finally {
      this.submitting = false;
    }
  }

  render() {
    if (this.isLoadingAuth) {
      return html`
        <div
          style="display: flex; justify-content: center; align-items: center; height: 100vh;"
        >
          <d2l-loading-spinner size="100"></d2l-loading-spinner>
        </div>
      `;
    }

    return html`
      <d2l-breadcrumbs>
        <d2l-breadcrumb
          href="#"
          text="Search Results"
          @click=${this.goBack}
          style="cursor:pointer;"
        ></d2l-breadcrumb>
      </d2l-breadcrumbs>
      <div class="container">
        <div class="preview">
          <img
            src=${this.image.fullImageUrl}
            alt=${this.image.name}
            crossorigin="anonymous"
          />
        </div>
        <div class="form-group">
          <d2l-input-label for="alt"
            >Alt Text (for accessibility, optional)</d2l-input-label
          >
          <d2l-input-text
            label="alt text"
            id="alt"
            .value=${this.altText}
            placeholder="e.g. Chest X-ray showing..."
            ?disabled=${this.isDecorative}
            @input=${(e: any) => (this.altText = e.target.value)}
          ></d2l-input-text>
          <d2l-input-checkbox
            label="Mark image as decorative"
            .checked=${this.isDecorative}
            @change=${(e: any) => {
              this.isDecorative = e.target.checked;
              if (this.isDecorative) this.altText = "";
            }}
          ></d2l-input-checkbox>
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
              : !this.altText ||
                this.submitting ||
                !this.image.fullImageUrl ||
                !this.image.name}
          >
            ${this.submitting
              ? html`<d2l-loading-spinner small></d2l-loading-spinner>`
              : "Insert"}
          </d2l-button>
        </div>
      </div>
    `;
  }
}
