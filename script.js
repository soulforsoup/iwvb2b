document.addEventListener("DOMContentLoaded", () => {
  const downloadBtn = document.getElementById("downloadBtn");
  const headerSearchBar = document.getElementById("headerSearchBar");
  const bottomSearchBar = document.getElementById("bottomSearchBar");
  const headerClearSearch = document.getElementById("headerClearSearch");
  const bottomClearSearch = document.getElementById("bottomClearSearch");
  const productTable = document.querySelector("#productTable tbody");
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

  // Updated Google Spreadsheet ID and API key
  const googleSpreadsheetId = "1TF2hAiXg5KfLARRnVSdT0YroW3su0f3K-iERs2RZjAw";
  const apiKey = "AIzaSyBn1cNKwaNPl9WeK8_gQtU0p8ieBg0pUjQ";
  const sheetName = "Sheet1";
  const googleSheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${googleSpreadsheetId}/values/${sheetName}!A1:D?key=${apiKey}`;

  // Show loading spinner
  loadingSpinner.style.display = "block";

  // Fetch data from Google Sheet
  fetch(googleSheetUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      loadingSpinner.style.display = "none";
      if (data.values) {
        allProducts = data.values.slice(1).map((row) => ({
          productName: row[0] ? row[0].toString() : "",
          unitOfMeasure: row[1] ? row[1].toString() : "",
          salesPrice: row[2] ? row[2].toString() : "",
          indent: row[3] === "TRUE",
        }));
        updateProductDisplay();
      } else {
        throw new Error("No data found in the sheet.");
      }
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

    // Apply search filter
    if (currentSearchTerm) {
      displayedProducts = displayedProducts.filter((product) =>
        product.productName
          .toLowerCase()
          .includes(currentSearchTerm.toLowerCase()),
      );
    }

    // Apply sort
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

      // Store current state
      const originalTableHTML = productTable.innerHTML;

      // Render all products without filters or sorting
      renderProducts(allProducts);

      // Update the print date
      updatePrintDate();

      // Temporarily remove dark mode for printing
      const isDarkMode = document.body.classList.contains("dark-mode");
      if (isDarkMode) {
        document.body.classList.remove("dark-mode");
      }

      // Use setTimeout to allow the DOM to update before printing
      setTimeout(() => {
        window.print();

        // After printing, restore the original state
        productTable.innerHTML = originalTableHTML;

        // Restore dark mode if it was active
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
