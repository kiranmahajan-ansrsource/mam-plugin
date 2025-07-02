import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { configureModal } from "../utils/configure-modal";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";

@customElement("insert-page")
export class InsertPage extends LitElement {
  static styles = css`
    .main {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .preview {
      width: 280px;
      height: 180px;
      border: 1px solid #ccc;
    }
    .preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `;

  @property({ type: Object }) image: any = null;
  @state() private altText = "";
  @state() private decorative = false;

  firstUpdated() {
    this.altText = this.image?.name || "";
    configureModal({
      back: () =>
        this.dispatchEvent(
          new CustomEvent("image-selected", {
            detail: this.image,
            bubbles: true,
            composed: true,
          })
        ),
      next: this.triggerInsert,
      cancel: () => window.parent.postMessage({ subject: "lti.close" }, "*"),
      insertMode: true,
    });
  }

  triggerInsert = () => {
    const payload = {
      image: this.image,
      altText: this.decorative ? null : this.altText,
      decorative: this.decorative,
    };
    console.log("Insert payload:", payload);
    alert(" Inserted!");
    window.parent.postMessage({ subject: "lti.close" }, "*");
  };
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
        <div class="main">
          <div class="preview">
            <img
              src=${this.image?.thumbnailUrl}
              alt="preview"
              crossorigin="anonymous"
            />
          </div>
          <div>
            <d2l-input-textarea
              label="Alt Text"
              .value=${this.altText}
              ?disabled=${this.decorative}
              @input=${(e: any) => (this.altText = e.target.value)}
            ></d2l-input-textarea>
            <d2l-input-checkbox
              label="This image is decorative"
              .checked=${this.decorative}
              @change=${(e: any) => {
                this.decorative = e.target.checked;
                if (this.decorative) this.altText = "";
              }}
            ></d2l-input-checkbox>
          </div>
        </div>
      </d2l-breadcrumbs>
    `;
  }
}
