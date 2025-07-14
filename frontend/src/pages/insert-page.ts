import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-text.js";
import "@brightspace-ui/core/components/alert/alert.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import { getLtik } from "../utils/helper";
import { Router } from "@vaadin/router";
import axios from "axios";

@customElement("insert-page")
export class InsertPage extends LitElement {
  static styles = css`
    .container {
      margin-top: 1.5rem;
    }
    .preview {
      width: 100%;
      max-width: 600px;
      border: 1px solid #ccc;
      margin-bottom: 1rem;
    }
    .preview img {
      width: 100%;
      height: auto;
      object-fit: contain;
    }
    .form-group {
      max-width: 600px;
    }
  `;

  @state() private ltik: string = "";
  @state() private altText: string = "";
  @state() private submitting = false;
  @state() private isLoadingAuth = true;

  @state() private image = {
    fullImageUrl: "",
    name: "",
  };

  async connectedCallback(): Promise<void> {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    this.ltik = getLtik();
    this.image = {
      fullImageUrl: params.get("fullImageUrl") || "",
      name: params.get("name") || "",
    };

    if (!this.image.fullImageUrl || !this.image.name) {
      console.error(
        "Missing fullImageUrl or name in URL parameters. Cannot proceed."
      );
      alert(
        "Image URL or name is missing from the page link. Please go back and select an image again."
      );
      this.goBack();
      return;
    }

    try {
      this.isLoadingAuth = true;
      console.log("Checking D2L authentication status via /oauth/check...");

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

        console.log(
          `D2L Access Token missing or authentication check failed. Redirecting to OAuth login with returnTo: ${returnToUrl}`
        );

        window.location.href = `/oauth/login?returnTo=${encodeURIComponent(
          returnToUrl
        )}`;
        return;
      }
      console.log("D2L Access Token found. Proceeding with page load.");
    } catch (error: any) {
      console.error(
        "Error checking D2L authentication status:",
        error.message || error
      );

      if (axios.isAxiosError(error) && error.response) {
        console.error("Axios error response status:", error.response.status);
        console.error("Axios error response data:", error.response.data);
      }
      alert("Failed to check D2L authentication status. Please try again.");
      window.location.href = "/deeplink";
      return;
    } finally {
      this.isLoadingAuth = false;
    }
  }

  private goBack() {
    const searchParams = new URLSearchParams({
      fullImageUrl: this.image.fullImageUrl,
      name: this.image.name,
      ltik: this.ltik,
    } as any);
    Router.go(`/details?${searchParams.toString()}`);
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
      form.appendChild(altTextInput);

      const titleInput = document.createElement("input");
      titleInput.name = "title";
      titleInput.value = this.image.name;
      form.appendChild(titleInput);

      document.body.appendChild(form);
      form.submit();
    } catch (err: any) {
      console.error(err);
      alert("An error occurred during form submission. Please try again.");
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
          <p style="margin-left: 1rem;">Checking D2L authentication...</p>
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
            >Alt Text (required for accessibility)</d2l-input-label
          >
          <d2l-input-text
            id="alt"
            .value=${this.altText}
            placeholder="e.g. Chest X-ray showing..."
            required
            @input=${(e: any) => (this.altText = e.target.value)}
          ></d2l-input-text>

          <div style="margin-top: 1rem;">
            <d2l-button @click=${this.goBack} secondary>Back</d2l-button>
            <d2l-button
              primary
              style="margin-left: 1rem;"
              @click=${this.submitForm}
              ?disabled=${!this.altText ||
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
      </div>
    `;
  }
}
