import { Router } from "@vaadin/router";
import "./pages/search-page.ts";
import "./pages/details-page.ts";
import "./pages/insert-page.ts";
import "./pages/not-found-page.ts";
import "./pages/prohibited-page.ts";

const outlet = document.getElementById("outlet");
if (outlet) {
  const router = new Router(outlet);
  router.setRoutes([
    { path: "/", redirect: "/deeplink" },
    { path: "/prohibited", component: "prohibited-page" },
    { path: "/deeplink", component: "search-page" },
    { path: "/details", component: "details-page" },
    { path: "/insert", component: "insert-page" },
    { path: "(.*)", component: "not-found-page" },
  ]);
}
