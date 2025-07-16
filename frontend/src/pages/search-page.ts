import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-search.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import "@brightspace-ui/core/components/alert/alert.js";
import "@brightspace-ui/core/components/link/link.js";
import "@brightspace-ui/core/components/button/button.js";
import { getLtik } from "../utils/helper";
import axios from "axios";
import { Router } from "@vaadin/router";

interface ImageItem {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullImageUrl?: string;
  imageWidth?: number;
  imageHeight?: number;
  createDate?: string;
}

@customElement("search-page")
export class SearchPage extends LitElement {
  static styles = css`
    :host {
      width: 100%;
      height: 100%;
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
    .load-more-container {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.9rem;
      color: #333;
      background-color: #f9fbff;
      border: 1px solid #d9e7f7;
      border-radius: 6px;
      padding: 12px;
    }
    .spinner-container {
      height: 100%;
      width: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
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

  private readonly limit = 10;

  firstUpdated() {
    this.ltik = getLtik();
  }

  private async _triggerSearch() {
    if (!this.searchTerm.trim()) return;
    this.loading = true;
    try {
      const res = await axios.get("/api/images", {
        params: { q: this.searchTerm, page: 1, limit: this.limit },
        headers: { Authorization: `Bearer ${this.ltik}` },
      });
      const items = res.data.results || [];
      this.results = items.map((item: any) => ({
        id: item.SystemIdentifier,
        name: item.Title,
        thumbnailUrl: item.Path_TR7?.URI || "",
        fullImageUrl: item.Path_TR1?.URI || "",
        imageWidth: item.Path_TR1?.Width,
        imageHeight: item.Path_TR1?.Height,
        createDate: item.CreateDate || "",
      }));
      this.totalCount = res.data.total || items.length;
      this.page = 1;
      this.lastSearchTerm = this.searchTerm;
    } catch (err) {
      console.error("Something went wrong while search on mayo server", err);
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
      const newImages = items.map((item: any) => ({
        id: item.SystemIdentifier,
        name: item.Title,
        thumbnailUrl: item.Path_TR7?.URI || "",
        fullImageUrl: item.Path_TR1?.URI || "",
        imageWidth: item.Path_TR1?.Width,
        imageHeight: item.Path_TR1?.Height,
        createDate: item.CreateDate || "",
      }));

      this.results = [...this.results, ...newImages];
      this.page = nextPage;
    } catch (err) {
      console.error(
        "Something went wrong while loading more on mayo server",
        err
      );
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
        placeholder="e.g. x-ray"
        @input=${(e: any) => (this.searchTerm = e.target.value)}
        @keydown=${(e: KeyboardEvent) =>
          e.key === "Enter" && this._triggerSearch()}
        .value=${this.searchTerm}
        @search=${() => this._triggerSearch()}
        @clear=${() => {
          this.searchTerm = "";
          this.results = [];
          this.totalCount = 0;
          this.page = 1;
          this.lastSearchTerm = "";
        }}
      ></d2l-input-search>

      ${this.loading
        ? html`<div class="spinner-container">
            <d2l-loading-spinner size="100"></d2l-loading-spinner>
          </div>`
        : html`<div class="thumbnail-container">
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
          </div>`}
      ${!this.loading && this.results.length < this.totalCount
        ? html`
            <div class="load-more-container">
              ${this.loadingMore
                ? html`<d2l-loading-spinner small></d2l-loading-spinner>`
                : html` <d2l-link href="#" @click=${this.loadMore}>
                      Load More
                    </d2l-link>
                    | ${this.results.length} of ${this.totalCount}`}
            </div>
          `
        : null}
    `;
  }
}
