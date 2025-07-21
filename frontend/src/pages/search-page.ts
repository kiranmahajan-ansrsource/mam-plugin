import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-search.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import "@brightspace-ui/core/components/alert/alert-toast.js";
import "@brightspace-ui/core/components/button/button.js";
import "@brightspace-ui/core/components/link/link.js";
import "@brightspace-ui/core/components/paging/pager-load-more.js";
import "../components/pageable-wrapper";
import "../components/search-summary";

import { getLtik } from "../utils/helper";
import axios from "axios";
import { Router } from "@vaadin/router";
import type { ImageItem } from "../types/image-item";

@customElement("search-page")
export class SearchPage extends LitElement {
  static styles = css`
    :host {
      width: 100vw;
      height: 100vh;
    }
    .search-heading {
      margin-top: 1rem;
      margin-bottom: 1rem;
      font-weight: normal;
    }
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
    .spinner-container {
      height: 60vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    d2l-input-search {
      width: 99.5%;
    }
  `;

  @state() private searchTerm = "";
  @state() private lastSearchTerm = "";
  @state() private results: ImageItem[] = [];
  @state() private totalCount = 0;
  @state() private page = 1;
  @state() private loading = false;
  @state() private loadingMore = false;
  @state() private ltik: string | null = null;
  @state() private errorMessage = "";
  @state() private hasSearched = false;

  private readonly limit = 10;

  private _resetSearch() {
    this.searchTerm = "";
    this.lastSearchTerm = "";
    this.results = [];
    this.totalCount = 0;
    this.page = 1;
    this.hasSearched = false;
    this.errorMessage = "";
  }

  firstUpdated() {
    this.ltik = getLtik();
  }

  private _mapImageItems(items: any[]): ImageItem[] {
    return items.map((item: any) => ({
      id: item.SystemIdentifier,
      name: item.Title,
      thumbnailUrl: item.Path_TR7?.URI || "",
      fullImageUrl: item.Path_TR1?.URI || "",
      imageWidth: item.Path_TR1?.Width,
      imageHeight: item.Path_TR1?.Height,
      createDate: item.CreateDate || "",
    }));
  }

  private async _triggerSearch() {
    if (!this.searchTerm.trim()) return;
    this.loading = true;
    this.errorMessage = "";
    try {
      const res = await axios.get("/api/images", {
        params: { q: this.searchTerm, page: 1, limit: this.limit },
        headers: { Authorization: `Bearer ${this.ltik}` },
      });
      const items = res.data.results || [];
      this.results = this._mapImageItems(items);
      this.totalCount = res.data.total || items.length;
      this.page = 1;
      this.lastSearchTerm = this.searchTerm;
      this.hasSearched = true;
    } catch (err) {
      console.error("Search error:", err);
      this.errorMessage = "Something went wrong. Please try again.";

      const fallbackImages: ImageItem[] = [];
      for (let i = 0; i < this.limit; i++) {
        const id = Math.floor(Math.random() * 1000);
        fallbackImages.push({
          id: `picsum-${id}`,
          name: `Picsum Image ${i + 1}`,
          thumbnailUrl: `https://picsum.photos/id/${id}/250/150`,
          fullImageUrl: `https://picsum.photos/id/${id}/600/400`,
          imageWidth: 600,
          imageHeight: 400,
          createDate: new Date().toISOString().split("T")[0],
        });
      }
      this.results = fallbackImages;
      this.totalCount = this.results.length;
    } finally {
      this.loading = false;
    }
  }

  private async loadMore() {
    if (this.loadingMore || this.results.length >= this.totalCount) return;

    this.loadingMore = true;
    const nextPage = this.page + 1;

    try {
      const res = await axios.get("/api/images", {
        params: { q: this.lastSearchTerm, page: nextPage, limit: this.limit },
        headers: { Authorization: `Bearer ${this.ltik}` },
      });

      const items = res.data.results || [];
      const newImages = this._mapImageItems(items);

      this.results = [...this.results, ...newImages];
      this.page = nextPage;
    } catch (err) {
      console.error("Load more error:", err);
      this.errorMessage = "Failed to load more images.";
    } finally {
      this.loadingMore = false;
    }
  }

  private _select(image: ImageItem) {
    sessionStorage.setItem("selectedImage", JSON.stringify(image));
    Router.go(`/details?ltik=${this.ltik}`);
  }

  render() {
    return html`
      <h4 class="search-heading">Search by keyword to find relevant images.</h4>

      <d2l-input-search
        label="Search"
        placeholder="Search..."
        .value=${this.searchTerm}
        @d2l-input-search-searched=${(e: any) => {
          this.searchTerm = e.detail.value;
          if (!this.searchTerm.trim()) {
            this._resetSearch();
          } else {
            this._triggerSearch();
          }
        }}
        @input=${(e: any) => (this.searchTerm = e.target.value)}
      ></d2l-input-search>

      ${this.hasSearched
        ? html`
            <search-summary
              .totalResults=${this.totalCount}
              @clear-search=${() => this._resetSearch()}
            ></search-summary>
          `
        : null}
      ${this.errorMessage
        ? html`<d2l-alert-toast open type="critical"
            >${this.errorMessage}</d2l-alert-toast
          >`
        : null}
      ${this.loading
        ? html`
            <div class="spinner-container">
              <d2l-loading-spinner size="100"></d2l-loading-spinner>
            </div>
          `
        : html`
            <d2l-pageable-wrapper .itemCount=${this.totalCount}>
              <div class="thumbnail-container">
                ${this.results.map(
                  (img) => html`
                    <div class="thumbnail" @click=${() => this._select(img)}>
                      <img
                        src=${img.thumbnailUrl}
                        alt=${img.name}
                        crossorigin="anonymous"
                      />
                    </div>
                  `
                )}
              </div>

              <d2l-pager-load-more
                slot="pager"
                ?has-more=${this.results.length < this.totalCount}
                .pageSize=${this.limit}
                @d2l-pager-load-more=${async (e: CustomEvent) => {
                  await this.loadMore();
                  e.detail.complete();
                }}
              ></d2l-pager-load-more>
            </d2l-pageable-wrapper>
          `}
    `;
  }
}
