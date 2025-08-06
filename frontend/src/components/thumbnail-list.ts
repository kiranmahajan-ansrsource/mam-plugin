import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("thumbnail-list")
export class ThumbnailList extends LitElement {
  static styles = css`
    .thumbnail-container {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-top: 1rem;
      margin-bottom: 1rem;
    }
    .thumbnail {
      width: 250px;
      height: 150px;
      cursor: pointer;
      transition: transform 0.2s ease;
    }
    .thumbnail:hover {
      transform: scale(1.02);
    }
    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `;

  @property({ type: Array }) images: any[] = [];
  @property({ type: Function }) onSelect: (img: any) => void = () => {};

  render() {
    return html`
      <div class="thumbnail-container">
        ${this.images.map(
          (img) => html`
            <div class="thumbnail" @click=${() => this.onSelect(img)}>
              <img
                src=${img.Path_TR7?.URI || ""}
                alt=${img.Title || ""}
                crossorigin="anonymous"
              />
            </div>
          `
        )}
      </div>
    `;
  }
}
