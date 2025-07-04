import { Router } from "@vaadin/router";
import "./pages/search-page.ts";
import "./pages/details-page.ts";
import "./pages/insert-page.ts";

const outlet = document.getElementById("outlet");
if (outlet) {
  const router = new Router(outlet);
  router.setRoutes([
    { path: "/", component: "search-page" },
    { path: "/details", component: "details-page" },
    { path: "/insert", component: "insert-page" },
  ]);
}
