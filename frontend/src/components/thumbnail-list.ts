import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import "@brightspace-ui/core/components/paging/pager-load-more.js";
import "./pageable-wrapper";

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
  @property({ type: Number }) totalCount = 0;
  @property({ type: Number }) pageSize = 12;
  @property({ type: Function }) onSelect: (img: any) => void = () => {};
  @property({ type: Function }) onLoadMore: () => void = () => {};

  render() {
    return html`
      <d2l-pageable-wrapper .itemCount=${this.totalCount}>
        <div class="thumbnail-container">
          ${this.images.map(
            (img) => html`
              <div
                tabindex="0"
                class="thumbnail"
                @click=${() => this.onSelect(img)}
              >
                <img
                  src=${img.Path_TR7?.URI || ""}
                  alt=${img.Title || ""}
                  crossorigin="anonymous"
                />
              </div>
            `
          )}
        </div>

        <d2l-pager-load-more
          slot="pager"
          ?has-more=${this.images.length < this.totalCount}
          .pageSize=${this.pageSize}
          @d2l-pager-load-more=${async (e: CustomEvent) => {
            await this.onLoadMore();
            e.detail.complete();
          }}
        ></d2l-pager-load-more>
      </d2l-pageable-wrapper>
    `;
  }
}
