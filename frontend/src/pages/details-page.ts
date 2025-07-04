import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/description-list/description-list-wrapper.js";
import { descriptionListStyles } from "@brightspace-ui/core/components/description-list/description-list-wrapper.js";
import { getLtik } from "../utils/helper";
import { Router } from "@vaadin/router";
import axios from "axios";

@customElement("details-page")
export class DetailsPage extends LitElement {
  static styles = [
    descriptionListStyles,
    css`
      .container {
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
      }
      .preview {
        width: 480px;
        border: 1px solid #ccc;
      }
      .preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .validation-message {
        margin-top: 1rem;
        padding: 10px;
        background-color: #e8f5e8;
        border: 1px solid #4caf50;
        border-radius: 4px;
        color: #2e7d2e;
      }
    `,
  ];

  @state() private image = {
    id: "",
    name: "",
    thumbnailUrl: "",
    fullImageUrl: "",
    imageWidth: 0,
    imageHeight: 0,
    createDate: "",
  };

  @state() private isValidated = false;
  @state() private isValidating = false;
  @state() private validationMessage = "";

  private ltik: string = "";

  connectedCallback(): void {
    super.connectedCallback();
    const params = new URLSearchParams(window.location.search);
    this.ltik = getLtik();
    this.image = {
      id: params.get("id") || "",
      name: params.get("name") || "",
      thumbnailUrl: params.get("thumbnailUrl") || "",
      fullImageUrl: params.get("fullImageUrl") || "",
      imageWidth: Number(params.get("imageWidth") || 0),
      imageHeight: Number(params.get("imageHeight") || 0),
      createDate: params.get("createDate") || "",
    };
    this.validateSelection();
    window.addEventListener("message", this.handleParentMessage.bind(this));
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener("message", this.handleParentMessage.bind(this));
  }

  private handleParentMessage(event: MessageEvent) {
    if (event.data.type === "d2l-navigate-next" && this.isValidated) {
      this.goNext();
    }
  }
  private async validateSelection() {
    this.isValidating = true;
    this.validationMessage = "Validating image selection...";

    try {
      const response = await axios.post(
        "/api/validate-selection",
        {
          imageUrl: this.image.fullImageUrl,
          imageId: this.image.id,
          altText: this.image.name,
        },
        {
          headers: {
            Authorization: `Bearer ${this.ltik}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        this.isValidated = true;
        this.validationMessage =
          "Image validated successfully. Ready to proceed.";
        this.signalReadyState();
      } else {
        this.validationMessage = "Validation failed. Please try again.";
      }
    } catch (error) {
      console.error("Validation error:", error);
      this.validationMessage = "Validation failed. Please try again.";
    } finally {
      this.isValidating = false;
    }
  }
  private signalReadyState() {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "deepLinkingReady",
          ready: this.isValidated,
          stage: "details",
          data: {
            imageId: this.image.id,
            imageUrl: this.image.fullImageUrl,
            imageName: this.image.name,
            canProceed: this.isValidated,
          },
        },
        "*"
      );
    }

    const event = new CustomEvent("d2l-content-ready", {
      detail: {
        ready: this.isValidated,
        stage: "details",
        canProceed: this.isValidated,
      },
      bubbles: true,
    });
    this.dispatchEvent(event);
  }
  private goBack() {
    Router.go(`/?ltik=${this.ltik}`);
  }

  private goNext() {
    if (!this.isValidated) {
      this.validateSelection();
      return;
    }

    const searchParams = new URLSearchParams({
      id: this.image.id,
      name: this.image.name,
      thumbnailUrl: this.image.thumbnailUrl,
      fullImageUrl: this.image.fullImageUrl,
      imageWidth: this.image.imageWidth.toString(),
      imageHeight: this.image.imageHeight.toString(),
      createDate: this.image.createDate,
      ltik: this.ltik,
    });
    Router.go(`/insert?${searchParams.toString()}`);
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
            src=${this.image.thumbnailUrl}
            alt=${this.image.name}
            crossorigin="anonymous"
          />
        </div>
        <d2l-dl-wrapper>
          <dl>
            <dt>Title</dt>
            <dd>${this.image.name}</dd>
            <dt>Unique Identifier</dt>
            <dd>${this.image.id}</dd>
            <dt>Content Type</dt>
            <dd>Image</dd>
            <dt>Creation Date</dt>
            <dd>${this.image.createDate || "-"}</dd>
            <dt>Image Size</dt>
            <dd>
              ${this.image.imageWidth && this.image.imageHeight
                ? `${this.image.imageWidth} x ${this.image.imageHeight}`
                : "-"}
            </dd>
          </dl>
        </d2l-dl-wrapper>
      </div>

      ${this.isValidating
        ? html`
            <div class="loading-message">
              <d2l-loading-spinner small></d2l-loading-spinner>
              ${this.validationMessage}
            </div>
          `
        : this.validationMessage
        ? html`
            <div class="validation-message">${this.validationMessage}</div>
          `
        : ""}

      <div style="margin-top: 1rem;">
        <d2l-button @click=${this.goBack} secondary>Back</d2l-button>
        <d2l-button @click=${this.goNext} primary style="margin-left: 1rem;">
          Next
        </d2l-button>
      </div>
    `;
  }
}
