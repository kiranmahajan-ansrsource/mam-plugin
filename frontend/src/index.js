import "@brightspace-ui/core/components/button/button.js";
import "@brightspace-ui/core/components/dialog/dialog.js";
import "@brightspace-ui/core/components/inputs/input-search.js";
import "@brightspace-ui/core/components/paging/pager-load-more.js";
import "./components/PageableExample.js";

window.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#open").addEventListener("click", () => {
    document.querySelector("#dialog").opened = true;

    const imageList = document.querySelector(".image-list");
    if (imageList && imageList.children.length === 0) {
      for (let i = 0; i < 10; i++) {
        const card = document.createElement("div");
        card.className = "img-card";
        const img = document.createElement("img");
        img.src = "https://placehold.jp/150x150.png?text=Image+Placeholder";
        img.alt = `image placeholder ${i + 1}`;
        card.appendChild(img);
        imageList.appendChild(card);
      }
    }
  });

  document
    .querySelector("d2l-pager-load-more")
    .addEventListener("d2l-pager-load-more", (e) => {
      const ITEM_COUNT = 50;
      const PAGE_SIZE = 10;
      const list = e.target.parentNode.querySelector(".image-list");
      let remainingCount = ITEM_COUNT - list.children.length;
      const numberToLoad =
        remainingCount < PAGE_SIZE ? remainingCount : PAGE_SIZE;
      for (let i = 0; i < numberToLoad; i++) {
        const card = document.createElement("div");
        card.className = "img-card";
        const img = document.createElement("img");
        img.src = "https://placehold.jp/150x150.png?text=Image+Placeholder";
        img.alt = `image placeholder ${list.children.length + 1}`;
        card.appendChild(img);
        list.appendChild(card);
      }

      if (list.children.length === ITEM_COUNT) {
        e.target.hasMore = false;
      } else {
        remainingCount = ITEM_COUNT - list.children.length;
        if (remainingCount < PAGE_SIZE && e.target.pageSize)
          e.target.pageSize = remainingCount;
      }
      e.detail.complete();
    });
});
