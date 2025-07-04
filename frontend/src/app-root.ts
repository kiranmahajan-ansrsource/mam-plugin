import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";
import { Routes } from "@lit-labs/router";

import "./pages/search-page.ts";
import "./pages/details-page.ts";
import "./pages/insert-page.ts";

@customElement("app-root")
export class AppRoot extends LitElement {
  private _routes = new Routes(this, [
    { path: "/deeplink", render: () => html`<search-page></search-page>` },
    { path: "/details", render: () => html`<details-page></details-page>` },
    { path: "/insert", render: () => html`<insert-page></insert-page>` },
  ]);

  render() {
    return html`<main>${this._routes.outlet()}</main>`;
  }
}
