(function () {
  function normalizeSpacesMenu() {
    const spacesList = document.querySelector(".spaces-spaces-list");

    if (!spacesList) {
      return;
    }

    spacesList.querySelectorAll(":scope > li").forEach((item, index) => {
      if (index > 0) {
        item.remove();
      }
    });

    spacesList.querySelector(".spaces-spaces-list-item")?.classList.add("is-active");
  }

  function normalizeProductGrid() {
    const grid = document.querySelector(".spaces-grid");

    if (!grid) {
      return;
    }

    const firstCard = grid.querySelector(".spaces-item-wrap");
    const documentsCard = grid.querySelector('[data-spaces-card="documents"]');

    if (firstCard && documentsCard && firstCard.nextElementSibling !== documentsCard) {
      grid.insertBefore(documentsCard, firstCard.nextElementSibling);
    }

    const dropdownItems = Array.from(
      document.querySelectorAll(".spaces-explore-list.is-dropdown > li"),
    );
    const firstDropdownItem = dropdownItems[0];
    const documentsDropdownItem = dropdownItems.find((item) =>
      item.textContent?.includes("Documents"),
    );

    if (
      firstDropdownItem &&
      documentsDropdownItem &&
      firstDropdownItem.nextElementSibling !== documentsDropdownItem
    ) {
      firstDropdownItem.parentElement?.insertBefore(
        documentsDropdownItem,
        firstDropdownItem.nextElementSibling,
      );
    }

    document.querySelectorAll(".spaces-item-name").forEach((element) => {
      if (element.textContent?.trim() === "Projects") {
        element.textContent = "Floor plans";
      }
    });

    document.querySelectorAll(".spaces-explore-list.is-dropdown span").forEach((element) => {
      if (element.textContent?.trim() === "Projects") {
        element.textContent = "Floor plans";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    normalizeSpacesMenu();
    normalizeProductGrid();
  });
})();
