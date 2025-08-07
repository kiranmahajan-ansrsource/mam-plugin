import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";

import "@brightspace-ui/core/components/button/button.js";
import "@brightspace-ui/core/components/link/link.js";
import "../components/search-summary";
import "../components/thumbnail-list";
import "../components/search-bar";
import "../components/loader-spinner";
import "../components/toast-alert";
import {
  getLtik,
  goToDetails,
  searchFallbackImages,
  searchImages,
} from "../utils/helper";

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
    d2l-input-search {
      width: 99.5%;
    }
  `;
  @state() private searchTerm = "";
  @state() private lastSearchTerm = "";
  @state() private results: any[] = [];
  @state() private totalCount = 0;
  @state() private page = 1;
  @state() private loading = false;
  @state() private loadingMore = false;
  @state() private ltik: string | null = null;
  @state() private errorMessage = "";
  @state() private hasSearched = false;
  @state() private fromFallback = false;
  private readonly countperpage = 12;

  private _resetSearch() {
    this.searchTerm = "";
    this.lastSearchTerm = "";
    this.results = [];
    this.totalCount = 0;
    this.page = 1;
    this.hasSearched = false;
    this.errorMessage = "";
    this.fromFallback = false;
  }
  firstUpdated() {
    this.ltik = getLtik();
  }
  private async _triggerSearch() {
    if (!this.searchTerm.trim()) return;
    this.loading = true;
    this.errorMessage = "";
    this.fromFallback = false;
    try {
      const data = await searchImages(
        this.searchTerm,
        1,
        this.countperpage,
        this.ltik!
      );
      const items = data.results || [];
      this.results = items;
      this.totalCount = data.total || items.length;
      this.page = 1;
      this.lastSearchTerm = this.searchTerm;
      this.hasSearched = true;
      if (items.length === 0) {
        this.errorMessage =
          "No images found. Please try a different search term.";
      }
    } catch (err) {
      const fallbackWorked = await this.fallbackErrorFunction(true);
      if (!fallbackWorked) {
        this.errorMessage =
          "Mayo image API is down please insert pre-existing images from course files or organization files";
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
      const data = await searchImages(
        this.lastSearchTerm,
        nextPage,
        this.countperpage,
        this.ltik!
      );
      const items = data.results || [];
      this.results = [...this.results, ...items];
      this.page = nextPage;
    } catch (err) {
      const fallbackWorked = await this.fallbackErrorFunction(false);
      if (!fallbackWorked) {
        this.errorMessage =
          "Mayo image API is down please insert pre-existing images from course files or organization files";
      }
      console.error("Load more error:", err);
    } finally {
      this.loadingMore = false;
    }
  }
  private async fallbackErrorFunction(reset: boolean): Promise<boolean> {
    try {
      const data = await searchFallbackImages(this.searchTerm, this.ltik!);
      const items = data || [];
      if (!items || items.length === 0) {
        this.results = [];
        this.totalCount = 0;
        this.page = 1;
        this.lastSearchTerm = this.searchTerm;
        this.errorMessage =
          "Mayo image API is down please insert pre-existing images from course files or organization files";
        this.hasSearched = true;
        return false;
      }
      this.fromFallback = true;
      const mappedImages = items.map((item: any) => ({
        ...item,
      }));
      if (reset) {
        this.results = mappedImages;
        this.page = 1;
        this.totalCount = mappedImages.length;
      } else {
        this.results = [...this.results, ...mappedImages];
        this.page += 1;
      }
      this.errorMessage =
        "Mayo API is down, showing results from your organization";
      this.hasSearched = true;
      return true;
    } catch (err) {
      console.error("Fallback fetch failed:", err);
      return false;
    }
  }
  private _select(image: any) {
    if (!image || typeof image !== "object") return;
    const finalImage = { ...image };
    if ("altText" in finalImage) {
      delete finalImage.altText;
    }
    sessionStorage.setItem("selectedImage", JSON.stringify(finalImage));
    sessionStorage.setItem("searchTerm", JSON.stringify(this.searchTerm));
    if (!this.ltik) return;
    goToDetails(this.ltik);
  }

  render() {
    return html`
      <main
        class="main-container"
        role="main"
        aria-label="Image search results"
      >
        <h4 class="search-heading">
          Search by keyword to find relevant images.
        </h4>

        <search-bar
          .value=${this.searchTerm}
          @search=${(e: any) => {
            this.searchTerm = e.detail.value;
            if (!this.searchTerm.trim()) {
              this._resetSearch();
            } else {
              this._triggerSearch();
            }
          }}
          @input-change=${(e: any) => (this.searchTerm = e.detail)}
        ></search-bar>

        ${this.hasSearched
          ? html`
              <search-summary
                .totalResults=${this.totalCount}
                @clear-search=${() => this._resetSearch()}
              ></search-summary>
            `
          : null}
        ${this.loading
          ? html`<loader-spinner .overlay=${false}></loader-spinner>`
          : html`
              <thumbnail-list
                .images=${this.results}
                .totalCount=${this.totalCount}
                .pageSize=${this.countperpage}
                .onSelect=${(img: any) => this._select(img)}
                .onLoadMore=${() => this.loadMore()}
              >
              </thumbnail-list>
            `}
      </main>
      <toast-alert
        .message=${this.errorMessage}
        .isFallback=${this.fromFallback}
      ></toast-alert>
    `;
  }
}
