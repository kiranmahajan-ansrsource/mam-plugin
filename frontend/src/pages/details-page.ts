import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import "../components/loader-spinner";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";

import { getLtik } from "../utils/helper";
import { Router } from "@vaadin/router";
import "@brightspace-ui/core/components/button/button.js";
import "../components/details-list";

@customElement("details-page")
export class DetailsPage extends LitElement {
  static styles = [
    css`
      .main-container {
        width: 100%;
        height: 100%;
        display: flex;
        gap: 2rem;
      }
      .image-container {
        width: 500px;
        height: 310px;
        max-width: 50%;
        display: flex;
        flex: 0 0 50%;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .image-container img {
        max-width: 100%;
        max-height: 100%;
        width: auto;
        height: auto;
        object-fit: contain;
        object-position: center;
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
      d2l-breadcrumb {
        cursor: pointer;
      }
      .ml-1 {
        margin-left: 1rem;
      }
      .mt-1 {
        margin-top: 1rem;
      }
      .mb-1 {
        margin-bottom: 1rem;
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
      <header class="header-container">
        <d2l-breadcrumbs>
          <d2l-breadcrumb
            href="#"
            text="Search Results"
            @click=${this.goBack}
          ></d2l-breadcrumb>
        </d2l-breadcrumbs>
      </header>

      <main class="main-container mt-1 mb-1">
        <div class="image-container">
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
        <details-list .image=${this.image}></details-list>
      </main>

      <footer class="footer-container">
        <d2l-button
          text="Back to Search Results"
          @click=${this.goBack}
          secondary
          >Back to Search Results</d2l-button
        >
        <d2l-button
          class="ml-1"
          text="Use this Image"
          @click=${this.goNext}
          primary
          >Use this Image</d2l-button
        >
      </footer>
    `;
  }
}
