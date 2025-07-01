import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@brightspace-ui/core/components/button/button.js";
import "@brightspace-ui/core/components/typography/typography.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import { Router } from "@vaadin/router";

interface ImageData {
  id: string;
  name: string;
  folder: string;
  usageNotes: string;
  size: string;
  createdOn: string;
  keywords: string[];
}

@customElement("details-page")
export class DetailsPage extends LitElement {
  static styles = css`


    .header {
      margin-bottom: 16px;
      font-weight: bold;
      font-size: 20px;
      color: black;
    }
    .subheading {
      font-weight: bold;
      font-size: 16px;
      color: black;
      margin-bottom: 20px;
    }

    d2l-heading {
      color: black;
    }

    d2l-breadcrumbs {
      margin-bottom: 24px;
    }

    .content {
      flex: 1;
      display: flex;
      gap: 32px;
      flex-wrap: wrap;
    }

    .image-box {
      width: 240px;
      height: 240px;
      border: 1px solid #ccc;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #888;
      font-size: 0.9rem;
      background: #f9f9f9;
    }

    .details {
      flex: 1;
      min-width: 300px;
      font-size: 0.9rem;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .detail-row {
      display: flex;
      flex-wrap: wrap;
    }

    .label {
      width: 160px;
      font-weight: bold;
      color: black;
    }

    .value {
      flex: 1;
      color: black;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    const state = history.state;
    if (state?.image) {
      this.image = state.image;
    }
  }

  @property({ type: Object })
  image: ImageData = {
    id: "img-0",
    name: "Image name",
    folder: "name_folder_anything",
    usageNotes: "Additional information on how assets can be used or not used.",
    size: "800 x 1200 px",
    createdOn: "2025-11-24 16:45:43",
    keywords: ["Keyword1", "Keyword2", "Keyword3"],
  };

  private _next(): void {
    history.pushState({ image: this.image }, "", "/insert");
    Router.go("/insert");
  }

  private _back(): void {
    this.dispatchEvent(
      new CustomEvent("back-step", { bubbles: true, composed: true })
    );
  }

  private _cancel(): void {
    this.dispatchEvent(
      new CustomEvent("cancel", { bubbles: true, composed: true })
    );
  }

  render() {
    return html`
      <d2l-breadcrumbs>
        <d2l-breadcrumb
          text="Search Results"
          @click=${this._back}
        ></d2l-breadcrumb>
        <d2l-breadcrumb text="Image Details"></d2l-breadcrumb>
      </d2l-breadcrumbs>

      <div class="content">
        <div class="image-box">IMAGE PLACEHOLDER</div>
        <div class="details">
          <div class="detail-row">
            <div class="label">Title</div>
            <div class="value">${this.image.name}</div>
          </div>
          <div class="detail-row">
            <div class="label">Unique Identifier</div>
            <div class="value">${this.image.folder}</div>
          </div>
          <div class="detail-row">
            <div class="label">Content Type</div>
            <div class="value">Photograph</div>
          </div>
          <div class="detail-row">
            <div class="label">Collection</div>
            <div class="value">General Library</div>
          </div>
          <div class="detail-row">
            <div class="label">Creation Date</div>
            <div class="value">${this.image.createdOn}</div>
          </div>
          <div class="detail-row">
            <div class="label">Image Size</div>
            <div class="value">${this.image.size}</div>
          </div>
          <div class="detail-row">
            <div class="label">Usage Notes</div>
            <div class="value">${this.image.usageNotes}</div>
          </div>
          <div class="detail-row">
            <div class="label">Keywords</div>
            <div class="value">${this.image?.keywords?.join(", ")}</div>
          </div>
        </div>
      </div>
    `;
  }
}
