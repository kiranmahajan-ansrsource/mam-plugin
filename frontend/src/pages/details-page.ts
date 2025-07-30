import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import "../components/loader-spinner";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/description-list/description-list-wrapper.js";
import { descriptionListStyles } from "@brightspace-ui/core/components/description-list/description-list-wrapper.js";

import { getLtik } from "../utils/helper";
import { Router } from "@vaadin/router";
import "@brightspace-ui/core/components/button/button.js";

@customElement("details-page")
export class DetailsPage extends LitElement {
  static styles = [
    descriptionListStyles,
    css`
      .container {
        width: 100%;
        height: 100%;
        display: flex;
        gap: 2rem;
        margin-top: 1rem;
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
      d2l-dl-wrapper {
        width: 60%;
      }
      d2l-button {
        --d2l-button-padding-inline-end: 2rem;
        --d2l-button-padding-inline-start: 2rem;
      }

      d2l-button button {
        border-radius: 5px;
      }

      d2l-button[primary] {
        --d2l-color-celestine: #006fbf;
        --d2l-color-celestine-minus-1: rgba(5, 84, 173, 1);
      }

      d2l-button[secondary] {
        --d2l-color-gypsum: #e3e9f1;
        --d2l-color-mica: #d8dee6ff;
      }
    `,
  ];

  @state() private image: any = {};
  @state() private isImageLoading = true;

  private ltik: string = "";

  async firstUpdated() {
    this.ltik = getLtik();
    const stored = sessionStorage.getItem("selectedImage");
    if (stored) {
      try {
        this.image = JSON.parse(stored);
      } catch (e) {
        console.error("DetailsPage: Error parsing selectedImage", e);
        this.image = {};
      }
    } else {
      this.image = {};
      console.warn("DetailsPage: No selectedImage found in sessionStorage");
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
          ${this.isImageLoading
            ? html`<loader-spinner></loader-spinner>`
            : null}
          <img
            src=${this.image.Path_TR1?.URI || ""}
            alt="${this.image.Title || this.image.SystemIdentifier || ""}"
            crossorigin="anonymous"
            style="display:${this.isImageLoading ? "none" : "block"};"
            @load=${() => (this.isImageLoading = false)}
            @error=${() => (this.isImageLoading = false)}
          />
        </div>
        <d2l-dl-wrapper>
          <dl>
            ${this.image.Title
              ? html`<dt>Title</dt>
                  <dd>${this.image.Title}</dd>`
              : null}
            ${this.image.SystemIdentifier
              ? html`<dt>Unique Identifier</dt>
                  <dd>${this.image.SystemIdentifier}</dd>`
              : null}
            ${this.image.mimetype
              ? html`<dt>Content Type</dt>
                  <dd>${this.image.mimetype}</dd>`
              : null}
            ${this.image.DocSubType
              ? html`<dt>Collection</dt>
                  <dd>${this.image.DocSubType}</dd>`
              : null}
            ${this.image.CreateDate
              ? html`<dt>Creation Date</dt>
                  <dd>${this.image.CreateDate}</dd>`
              : null}
            ${this.image.Path_TR1?.Width && this.image.Path_TR1?.Height
              ? html`<dt>Image Size</dt>
                  <dd>
                    ${this.image.Path_TR1.Width} x ${this.image.Path_TR1.Height}
                  </dd>`
              : null}
            ${this.image.UsageDescription
              ? html`<dt>Usage Notes</dt>
                  <dd>${this.image.UsageDescription}</dd>`
              : null}
            ${this.image.Keyword
              ? html`<dt>Keyword</dt>
                  <dd>${this.image.Keyword}</dd>`
              : null}
          </dl>
        </d2l-dl-wrapper>
      </div>
      <div style="margin-top: 1rem;">
        <d2l-button
          text="Back to Search Results"
          @click=${this.goBack}
          secondary
          >Back to Search Results</d2l-button
        >
        <d2l-button
          text="Use this Image"
          @click=${this.goNext}
          primary
          style="margin-left: 1rem;"
          >Use this Image</d2l-button
        >
      </div>
    `;
  }
}
