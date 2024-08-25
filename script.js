import PocketBase from "https://unpkg.com/pocketbase@0.21.1/dist/pocketbase.es.mjs";

document.addEventListener("DOMContentLoaded", () => {
  const downloadBtn = document.getElementById("downloadBtn");
  const headerSearchBar = document.getElementById("headerSearchBar");
  const bottomSearchBar = document.getElementById("bottomSearchBar");
  const headerClearSearch = document.getElementById("headerClearSearch");
  const bottomClearSearch = document.getElementById("bottomClearSearch");
  const productTable = document.querySelector("#productTable");
  const themeToggle = document.getElementById("themeToggle");
  const contactBtn = document.getElementById("contactBtn");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const errorMessage = document.getElementById("errorMessage");
  const backToTopButton = document.getElementById("backToTop");
  const noResultsMessage = document.getElementById("noResults");

  let allProducts = [];
  let currentSortColumn = null;
  let isAscending = true;
  let currentSearchTerm = "";
  let isPreparingPrint = false;

  const pb = new PocketBase("https://iwvb2b.pockethost.io");

  async function fetchProducts() {
    try {
      const records = await pb.collection("wholesalepricelist").getFullList({
        sort: "productName",
      });
      return records.map((record) => ({
        productName: record.productName,
        unitOfMeasure: record.unitOfMeasure,
        salesPrice: record.salesPrice,
        indent:
          record.indent === true ||
          record.indent === "true" ||
          record.indent === 1,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  }

  loadingSpinner.style.display = "block";

  fetchProducts()
    .then((products) => {
      loadingSpinner.style.display = "none";
      allProducts = products;
      updateProductDisplay();
    })
    .catch((error) => {
      loadingSpinner.style.display = "none";
      console.error("Error fetching data:", error);
      errorMessage.textContent = "Error loading data. Please try again later.";
      errorMessage.style.display = "block";
    });

  function updateProductDisplay() {
    removeAnimationClasses();
    let displayedProducts = allProducts;

    if (currentSearchTerm) {
      displayedProducts = displayedProducts.filter((product) =>
        product.productName
          .toLowerCase()
          .includes(currentSearchTerm.toLowerCase()),
      );
    }

    if (currentSortColumn) {
      displayedProducts.sort((a, b) => {
        if (currentSortColumn === "indent") {
          return isAscending
            ? a[currentSortColumn]
              ? 1
              : -1
            : b[currentSortColumn]
              ? 1
              : -1;
        } else if (currentSortColumn === "salesPrice") {
          const priceA = parseFloat(
            a[currentSortColumn].replace(/[^0-9.-]+/g, ""),
          );
          const priceB = parseFloat(
            b[currentSortColumn].replace(/[^0-9.-]+/g, ""),
          );
          return isAscending ? priceA - priceB : priceB - priceA;
        }
        return isAscending
          ? a[currentSortColumn].localeCompare(b[currentSortColumn])
          : b[currentSortColumn].localeCompare(a[currentSortColumn]);
      });
    }

    renderProducts(displayedProducts);
  }

  function renderProducts(products) {
    productTable.innerHTML = "";
    if (products.length === 0) {
      noResultsMessage.style.display = "block";
      noResultsMessage.classList.add("fade-in");
    } else {
      noResultsMessage.style.display = "none";
      const fragment = document.createDocumentFragment();
      products.forEach((product) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${product.productName}</td>
          <td>${product.unitOfMeasure}</td>
          <td>${product.salesPrice}</td>
          <td>${product.indent ? "✓" : ""}</td>
        `;
        fragment.appendChild(row);
      });
      productTable.appendChild(fragment);
      productTable.classList.add("fade-in");
    }
  }

  function handleSearch(searchTerm) {
    removeAnimationClasses();
    currentSearchTerm = searchTerm;
    updateProductDisplay();
  }

  headerSearchBar.addEventListener("input", (e) => {
    handleSearch(e.target.value);
    bottomSearchBar.value = e.target.value;
  });

  bottomSearchBar.addEventListener("input", (e) => {
    handleSearch(e.target.value);
    headerSearchBar.value = e.target.value;
  });

  function clearSearch() {
    headerSearchBar.value = "";
    bottomSearchBar.value = "";
    currentSearchTerm = "";
    updateProductDisplay();
  }

  headerClearSearch.addEventListener("click", clearSearch);
  bottomClearSearch.addEventListener("click", clearSearch);

  document.querySelectorAll("th").forEach((th) => {
    th.addEventListener("click", () => {
      const column = th.dataset.column;
      if (currentSortColumn === column) {
        isAscending = !isAscending;
      } else {
        currentSortColumn = column;
        isAscending = true;
      }
      updateProductDisplay();
      updateSortIndicators(th, isAscending);
    });
  });

  function updateSortIndicators(clickedTh, ascending) {
    document.querySelectorAll("th").forEach((th) => {
      th.removeAttribute("aria-sort");
      th.classList.remove("sorted");
      th.querySelector(".fa-sort-up")?.classList.add("fa-sort");
      th.querySelector(".fa-sort-down")?.classList.add("fa-sort");
      th.querySelector(".fa-sort-up")?.classList.remove("fa-sort-up");
      th.querySelector(".fa-sort-down")?.classList.remove("fa-sort-down");
    });

    clickedTh.setAttribute("aria-sort", ascending ? "ascending" : "descending");
    clickedTh.classList.add("sorted");
    const icon = clickedTh.querySelector(".fa-sort");
    icon.classList.remove("fa-sort");
    icon.classList.add(ascending ? "fa-sort-up" : "fa-sort-down");
    icon.classList.add("fade-in");
  }

  downloadBtn.addEventListener("click", () => {
    if (!isPreparingPrint) {
      isPreparingPrint = true;

      const originalTableHTML = productTable.innerHTML;

      renderProducts(allProducts);

      updatePrintDate();

      const isDarkMode = document.body.classList.contains("dark-mode");
      if (isDarkMode) {
        document.body.classList.remove("dark-mode");
      }

      setTimeout(() => {
        window.print();

        productTable.innerHTML = originalTableHTML;

        if (isDarkMode) {
          document.body.classList.add("dark-mode");
        }

        isPreparingPrint = false;
      }, 100);
    }
  });

  contactBtn.addEventListener("click", () => {
    window.location.href = "https://wa.me/+6587680491";
  });

  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    document.querySelector("footer").classList.toggle("dark-mode");
    const icon = themeToggle.querySelector("i");
    if (document.body.classList.contains("dark-mode")) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    } else {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
    localStorage.setItem(
      "theme",
      document.body.classList.contains("dark-mode") ? "dark" : "light",
    );
  });

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    document.querySelector("footer").classList.add("dark-mode");
    const icon = themeToggle.querySelector("i");
    icon.classList.remove("fa-moon");
    icon.classList.add("fa-sun");
  }

  window.onscroll = function () {
    if (
      document.body.scrollTop > 20 ||
      document.documentElement.scrollTop > 20
    ) {
      backToTopButton.style.display = "block";
    } else {
      backToTopButton.style.display = "none";
    }
  };

  backToTopButton.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  function removeAnimationClasses() {
    document.querySelectorAll(".fade-in").forEach((el) => {
      el.classList.remove("fade-in");
    });
  }

  function updateGeneratedDate() {
    const generatedDateElement = document.getElementById("generatedDate");
    if (generatedDateElement) {
      const currentDate = new Date().toLocaleDateString("en-GB");
      generatedDateElement.textContent = currentDate;
    }
  }

  updateGeneratedDate();
});

function getCurrentDate() {
  const now = new Date();
  const options = { timeZone: "Asia/Singapore" };
  return now.toLocaleDateString("en-GB", options);
}

function updatePrintDate() {
  const printDateElement = document.getElementById("printGeneratedDate");
  const headerDateElement = document.getElementById("generatedDate");
  if (printDateElement && headerDateElement) {
    const currentDate = getCurrentDate();
    printDateElement.textContent = currentDate;
    headerDateElement.textContent = currentDate;
  }
}
