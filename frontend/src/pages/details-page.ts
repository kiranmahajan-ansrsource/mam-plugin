import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/description-list/description-list-wrapper.js";
import { descriptionListStyles } from "@brightspace-ui/core/components/description-list/description-list-wrapper.js";

import { getLtik } from "../utils/helper";
import { Router } from "@vaadin/router";
import type { ImageItem } from "../types/image-item";
import "@brightspace-ui/core/components/button/button.js";

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
        height: 310px;
        border: 1px solid #ccc;
      }
      .preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `,
  ];

  @state() private image: ImageItem = {
    id: "",
    name: "",
    thumbnailUrl: "",
    fullImageUrl: "",
    imageWidth: 0,
    imageHeight: 0,
    createDate: "",
  };

  private ltik: string = "";

  firstUpdated() {
    this.ltik = getLtik();
    const stored = sessionStorage.getItem("selectedImage");
    if (stored) {
      try {
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
      } catch (e) {
        console.error("DetailsPage: Error parsing selectedImage", e);
      }
    } else {
      console.warn("DetailsPage: No selectedImage found in sessionStorage");
      this.image = {
        id: "",
        name: "",
        thumbnailUrl: "",
        fullImageUrl: "",
        imageWidth: 0,
        imageHeight: 0,
        createDate: "",
      };
    }
  }

  private goBack() {
    Router.go(`/?ltik=${this.ltik}`);
  }

  private goNext() {
    Router.go(`/insert?ltik=${this.ltik}`);
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
        <d2l-button text="Back" @click=${this.goBack} secondary
          >Back</d2l-button
        >
        <d2l-button
          text="Next"
          @click=${this.goNext}
          primary
          style="margin-left: 1rem;"
          >Next</d2l-button
        >
      </div>
    `;
  }
}
