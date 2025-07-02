import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { configureModal } from "../utils/configure-modal";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/description-list/description-list-wrapper.js";
import { descriptionListStyles } from "@brightspace-ui/core/components/description-list/description-list-wrapper.js";

interface ImageItem {
  id: string;
  name: string;
  thumbnailUrl: string;
}

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
        /* height: 580px; */
        border: 1px solid #ccc;
      }
      .preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `,
  ];

  @property({ type: Object }) image: ImageItem = {
    id: "",
    name: "",
    thumbnailUrl: "",
  };

  firstUpdated() {
    configureModal({
      back: () =>
        this.dispatchEvent(
          new CustomEvent("image-selected", {
            detail: null,
            bubbles: true,
            composed: true,
          })
        ),
      next: () =>
        this.dispatchEvent(
          new CustomEvent("proceed-to-insert", {
            detail: this.image,
            bubbles: true,
            composed: true,
          })
        ),
      cancel: () => window.parent.postMessage({ subject: "lti.close" }, "*"),
    });
  }
  handleBackToSearch = (e: Event) => {
    e.preventDefault();
    this.dispatchEvent(
      new CustomEvent("image-selected", {
        detail: null,
        bubbles: true,
        composed: true,
      })
    );
  };

  render() {
    return html`
      <d2l-breadcrumbs>
        <d2l-breadcrumb
          href="#"
          text="Search Results"
          @click=${this.handleBackToSearch}
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
            <dt>Collection</dt>
            <dd>-</dd>
            <dt>Creation Date</dt>
            <dd>-</dd>
            <dt>Image Size</dt>
            <dd>-</dd>
            <dt>Usage Notes</dt>
            <dd>-</dd>
            <dt>Keywords</dt>
            <dd>-</dd>
          </dl>
        </d2l-dl-wrapper>
      </div>
    `;
  }
}
