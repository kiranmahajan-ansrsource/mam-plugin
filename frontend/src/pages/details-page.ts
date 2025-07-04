import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/description-list/description-list-wrapper.js";
import { descriptionListStyles } from "@brightspace-ui/core/components/description-list/description-list-wrapper.js";
import { getLtik } from "../utils/helper";
import { Router } from "@vaadin/router";

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
  }

  private goBack() {
    Router.go(`/?ltik=${this.ltik}`);
  }

  private goNext() {
    const searchParams = new URLSearchParams({
      ...this.image,
      ltik: this.ltik,
    } as any);
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
      <div style="margin-top: 1rem;">
        <d2l-button @click=${this.goBack} secondary>Back</d2l-button>
        <d2l-button @click=${this.goNext} primary style="margin-left: 1rem;">
          Next
        </d2l-button>
      </div>
    `;
  }
}
