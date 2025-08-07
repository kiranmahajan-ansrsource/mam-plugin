import { LitElement, html, css } from "lit";
import { customElement, state } from "lit/decorators.js";
import "@brightspace-ui/core/components/breadcrumbs/breadcrumbs.js";
import "@brightspace-ui/core/components/button/button.js";
import "../components/loader-spinner";
import "../components/details-list";
import "../components/image-container";
import {
  getLtik,
  getStoredImage,
  goToInsert,
  goToSearch,
} from "../utils/helper";
import { sharedStyles } from "../components/shared-styles";

@customElement("details-page")
export class DetailsPage extends LitElement {
  static styles = [sharedStyles, css``];

  @state() private image: any = {};
  private ltik: string = "";

  async firstUpdated() {
    this.ltik = getLtik();
    const { image } = getStoredImage();
    this.image = image;
  }

  render() {
    return html`
      <header class="header-container">
        <d2l-breadcrumbs>
          <d2l-breadcrumb
            href="#"
            text="Search Results"
            @click=${() => goToSearch(this.ltik)}
          ></d2l-breadcrumb>
        </d2l-breadcrumbs>
      </header>

      <main class="main-container mt-1 mb-1">
        <image-container
          .src=${this.image.Path_TR1?.URI || ""}
          .alt=${this.image.Title || this.image.SystemIdentifier || ""}
        ></image-container>

        <details-list .image=${this.image}></details-list>
      </main>

      <footer class="footer-container">
        <d2l-button
          text="Back to Search Results"
          @click=${() => goToSearch(this.ltik)}
          secondary
          >Back to Search Results</d2l-button
        >
        <d2l-button
          class="ml-1"
          text="Use this Image"
          @click=${() => goToInsert(this.ltik)}
          primary
          >Use this Image</d2l-button
        >
      </footer>
    `;
  }
}
