import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-text.js";
import "@brightspace-ui/core/components/alert/alert.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import { getLtik } from "../utils/helper";
import { Router } from "@vaadin/router";

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
    .ready-indicator {
      margin-top: 1rem;
      padding: 10px;
      background-color: #e8f5e8;
      border: 1px solid #4caf50;
      border-radius: 4px;
      color: #2e7d2e;
    }
  `;

  @state() private ltik: string = "";
  @state() private altText: string = "";
  @state() private submitting = false;
  @state() private submitted = false;
  @state() private error: string | null = null;
  @state() private isReady = false;

  @state() private image = {
    fullImageUrl: "",
    name: "",
  };

  connectedCallback(): void {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    this.ltik = getLtik();
    this.image = {
      fullImageUrl: params.get("fullImageUrl") || "",
      name: params.get("name") || "",
    };
    this.altText = this.image.name;

    this.checkReadiness();
  }
  private checkReadiness() {
    this.isReady = this.altText.trim().length > 0;

    if (this.isReady) {
      this.signalReadyState();
    }
  }
  private signalReadyState() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "deepLinkingReady",
          ready: this.isReady,
          stage: "insert",
          data: {
            imageUrl: this.image.fullImageUrl,
            altText: this.altText,
            canInsert: this.isReady,
          },
        },
        "*"
      );
    }

    const event = new CustomEvent("d2l-content-ready", {
      detail: {
        ready: this.isReady,
        stage: "insert",
        canProceed: this.isReady,
      },
      bubbles: true,
    });
    this.dispatchEvent(event);
  }

  private onAltTextChange(e: any) {
    this.altText = e.target.value;
    this.checkReadiness();
  }
  private goBack() {
    const searchParams = new URLSearchParams({
      ...this.image,
      ltik: this.ltik,
    } as any);
    Router.go(`/details?${searchParams.toString()}`);
  }

  private async submitForm() {
    if (!this.altText.trim()) {
      this.error = "Alt text is required for accessibility.";
      return;
    }

    this.submitting = true;
    this.error = null;

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

      document.body.appendChild(form);
      form.submit();
      this.submitted = true;
    } catch (err: any) {
      this.error = "Image insertion failed.";
      console.error(err);
    } finally {
      this.submitting = false;
    }
  }

  updated(changedProperties: Map<string, any>) {
    super.updated(changedProperties);

    if (changedProperties.has("altText")) {
      this.checkReadiness();
    }
  }

  render() {
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
            @input=${this.onAltTextChange}
          ></d2l-input-text>
        </div>

        ${this.isReady
          ? html`
              <div class="ready-indicator">
                ✓ Ready to insert. Alt text provided.
              </div>
            `
          : ""}
        ${this.error
          ? html`<d2l-alert type="error">${this.error}</d2l-alert>`
          : null}
        ${this.submitted
          ? html`<d2l-alert type="success"
              >Image inserted successfully!</d2l-alert
            >`
          : null}

        <div style="margin-top: 1rem;">
          <d2l-button @click=${this.goBack} secondary>Back</d2l-button>
          <d2l-button
            primary
            style="margin-left: 1rem;"
            @click=${this.submitForm}
            ?disabled=${!this.altText || this.submitting}
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
