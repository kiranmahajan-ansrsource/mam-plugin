import { Router } from "@vaadin/router";
import "./index.css";
import "./pages/search-page.ts";
import "./pages/details-page.ts";
import "./pages/insert-page.ts";

const outlet: HTMLElement | null = document.getElementById("outlet");

if (outlet) {
  const router = new Router(outlet);

  router.setRoutes([
    { path: "/lti/deeplink", component: "search-page" },
    { path: "/lti/details", component: "details-page" },
    { path: "/lti/insert", component: "insert-page" },
  ]);
} else {
  console.error("Router outlet not found");
}
