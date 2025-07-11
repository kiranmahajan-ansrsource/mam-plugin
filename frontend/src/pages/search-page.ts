import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/inputs/input-search.js";
import "@brightspace-ui/core/components/loading-spinner/loading-spinner.js";
import "@brightspace-ui/core/components/alert/alert.js";
import "@brightspace-ui/core/components/link/link.js";
import { getLtik } from "../utils/helper";
import axios from "axios";

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
      width: 280px;
      height: 180px;
      border: 1px solid #ccc;
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
  @state() private results: ImageItem[] = [];
  @state() private totalCount = 0;
  @state() private page = 1;
  @state() private loading = false;
  @state() private loadingMore = false;
  @state() private ltik: string | null = null;
  @state() private selected: ImageItem | null = null;

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
    } catch (err) {
      console.error("Search error", err);
      // Fallback: fetch mock images from Lorem Picsum
      try {
        const fallbackRes = await axios.get(
          `https://picsum.photos/v2/list?page=1&limit=${this.limit}`
        );
        const items = fallbackRes.data || [];
        this.results = items.map((item: any) => ({
          id: item.id,
          name: item.author,
          thumbnailUrl: `https://picsum.photos/id/${item.id}/280/180`,
          fullImageUrl: item.download_url,
          imageWidth: item.width,
          imageHeight: item.height,
          createDate: "",
        }));
        this.totalCount = items.length;
        this.page = 1;
      } catch (fallbackErr) {
        console.error("Fallback image fetch error", fallbackErr);
        this.results = [];
        this.totalCount = 0;
      }
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
        params: { q: this.searchTerm, page: nextPage, limit: this.limit },
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
      console.error("Load more error", err);
      // Fallback: fetch more mock images from Lorem Picsum
      try {
        const fallbackRes = await axios.get(
          `https://picsum.photos/v2/list?page=${nextPage}&limit=${this.limit}`
        );
        const items = fallbackRes.data || [];
        const newImages = items.map((item: any) => ({
          id: item.id,
          name: item.author,
          thumbnailUrl: `https://picsum.photos/id/${item.id}/280/180`,
          fullImageUrl: item.download_url,
          imageWidth: item.width,
          imageHeight: item.height,
          createDate: "",
        }));
        this.results = [...this.results, ...newImages];
        this.page = nextPage;
        this.totalCount = this.results.length;
      } catch (fallbackErr) {
        console.error("Fallback load more error", fallbackErr);
      }
    } finally {
      this.loadingMore = false;
    }
  }

  private _select(image: ImageItem) {
    this.selected = image;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `/details?ltik=${this.ltik}`;
    form.style.display = "none";

    const fields = {
      id: image.id,
      name: image.name,
      thumbnailUrl: image.thumbnailUrl,
      fullImageUrl: image.fullImageUrl || "",
      imageWidth: image.imageWidth?.toString() || "",
      imageHeight: image.imageHeight?.toString() || "",
      createDate: image.createDate || "",
    };

    for (const [key, value] of Object.entries(fields)) {
      const input = document.createElement("input");
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
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
      ></d2l-input-search>

      ${this.selected
        ? html`<d2l-alert type="info"
            >Selected: ${this.selected.name}</d2l-alert
          >`
        : null}
      ${this.loading
        ? html`<div class="spinner-container">
            <d2l-loading-spinner size="100"></d2l-loading-spinner>
          </div>`
        : html`
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
          `}
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
