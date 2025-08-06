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
import "../components/thumbnail-list";

import { getLtik } from "../utils/helper";
import axios from "axios";
import { Router } from "@vaadin/router";

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
    .spinner-container {
      height: 65vh;
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
      const res = await axios.get("/api/images", {
        params: {
          query: this.searchTerm,
          pagenumber: 1,
          countperpage: this.countperpage,
        },
        headers: { Authorization: `Bearer ${this.ltik}` },
      });
      const items = res.data.results || [];
      this.results = items;
      this.totalCount = res.data.total || items.length;
      this.page = 1;
      this.lastSearchTerm = this.searchTerm;
      this.hasSearched = true;
      if (items.length === 0) {
        this.errorMessage =
          "No images found. Please try a different search term.";
      }
    } catch (err) {
      // fallbackErrorFunction in case of error
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
      const res = await axios.get("/api/images", {
        params: {
          query: this.lastSearchTerm,
          pagenumber: nextPage,
          countperpage: this.countperpage,
        },
        headers: { Authorization: `Bearer ${this.ltik}` },
      });

      const items = res.data.results || [];
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
      const res = await axios.get("/search-db", {
        params: { query: this.searchTerm },
        headers: { Authorization: `Bearer ${this.ltik}` },
      });

      const items = res.data || [];
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
    const finalImage = { ...image };

    if ("altText" in finalImage) {
      delete finalImage.altText;
    }

    sessionStorage.setItem("selectedImage", JSON.stringify(finalImage));
    sessionStorage.setItem("searchTerm", JSON.stringify(this.searchTerm));

    Router.go(`/details?ltik=${this.ltik}`);
  }

  render() {
    return html`
      <main class="main-container">
        <h4 class="search-heading">
          Search by keyword to find relevant images.
        </h4>

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
        ${this.loading
          ? html`<loader-spinner
              .size=${100}
              .overlay=${false}
            ></loader-spinner>`
          : html`
              <d2l-pageable-wrapper .itemCount=${this.totalCount}>
                <thumbnail-list
                  .images=${this.results}
                  .onSelect=${(img: any) => this._select(img)}
                ></thumbnail-list>

                <d2l-pager-load-more
                  slot="pager"
                  ?has-more=${this.results.length < this.totalCount}
                  .pageSize=${this.countperpage}
                  @d2l-pager-load-more=${async (e: CustomEvent) => {
                    await this.loadMore();
                    e.detail.complete();
                  }}
                ></d2l-pager-load-more>
              </d2l-pageable-wrapper>
            `}
      </main>

      ${this.fromFallback
        ? html`<d2l-alert-toast open type="warning"
            >${this.errorMessage}</d2l-alert-toast
          >`
        : null}
      ${this.errorMessage
        ? html`<d2l-alert-toast open type="critical"
            >${this.errorMessage}</d2l-alert-toast
          >`
        : null}
    `;
  }
}
