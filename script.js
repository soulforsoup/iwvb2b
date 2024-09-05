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
  const copyToClipboardBtn = document.getElementById("copyToClipboard");

  const MAX_RETRIES = 3;
  const TIMEOUT = 10000; // 10 seconds
  const CACHE_KEY = "iwvProductsCache";
  const CACHE_EXPIRY = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

  let allProducts = [];
  let currentSortColumn = null;
  let isAscending = true;
  let currentSearchTerm = "";
  let isPreparingPrint = false;
  let selectedProducts = new Map(); // Store selected products and their quantities

  async function fetchWithTimeout(url, timeout) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async function fetchProductsWithRetry(url, retries = MAX_RETRIES) {
    try {
      const response = await fetchWithTimeout(url, TIMEOUT);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      // Cache the successful response
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          timestamp: Date.now(),
          data: data,
        }),
      );
      return data;
    } catch (error) {
      if (retries > 0) {
        console.log(
          `Retrying... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`,
        );
        return fetchProductsWithRetry(url, retries - 1);
      } else {
        throw error;
      }
    }
  }

  function getCachedData() {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { timestamp, data } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        return data;
      }
    }
    return null;
  }

  function showLoadingSpinner() {
    loadingSpinner.style.display = "block";
    setTimeout(() => {
      if (loadingSpinner.style.display === "block") {
        loadingSpinner.classList.add("visible");
      }
    }, 200);
  }

  function hideLoadingSpinner() {
    loadingSpinner.classList.remove("visible");
    setTimeout(() => {
      loadingSpinner.style.display = "none";
    }, 300);
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
  }

  async function loadProducts(forceRefresh = false) {
    showLoadingSpinner();

    try {
      let data;
      if (!forceRefresh) {
        data = getCachedData();
      }

      if (!data) {
        data = await fetchProductsWithRetry(
          "https://raw.githubusercontent.com/soulforsoup/iwvb2bproducts/main/whole%20list/products.json",
        );
      }

      if (data && data.length) {
        allProducts = data;
        console.log("Loaded products:", allProducts);
        updateProductDisplay();
      } else {
        throw new Error("No data found in the response");
      }
    } catch (error) {
      console.error("Error loading data:", error);
      showError(
        `Error loading data: ${error.message}. Please try again later.`,
      );
    } finally {
      hideLoadingSpinner();
    }
  }

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
          const priceA =
            parseFloat(a[currentSortColumn].replace(/[^0-9.-]+/g, "")) || 0;
          const priceB =
            parseFloat(b[currentSortColumn].replace(/[^0-9.-]+/g, "")) || 0;
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
    console.log("Rendering products:", products);
    productTable.innerHTML = "";
    if (products.length === 0) {
      noResultsMessage.style.display = "block";
      noResultsMessage.classList.add("fade-in");
    } else {
      noResultsMessage.style.display = "none";
      const fragment = document.createDocumentFragment();
      products.forEach((product) => {
        const row = document.createElement("tr");
        const isSelected = selectedProducts.has(product.productName);
        const quantity = isSelected
          ? selectedProducts.get(product.productName).quantity
          : 0;
        const isKg = product.unitOfMeasure === "/KG";
        row.innerHTML = `
                    <td class="checkbox-column no-print">
                        <input type="checkbox" class="product-checkbox" data-product='${JSON.stringify(product)}' ${isSelected ? "checked" : ""}>
                    </td>
                    <td>${product.productName}</td>
                    <td>${product.unitOfMeasure}</td>
                    <td>${product.salesPrice || "(Check with Customer Service for Pricing)"}</td>
                    <td>
                        <input type="number" class="quantity-input" value="${quantity}" min="0" step="1" ${isKg ? 'data-kg="true"' : ""} style="width: 60px;">
                    </td>
                    <td style="text-align: left !important; padding-left: 20px !important;">${product.indent ? "✓" : ""}</td>
                `;
        fragment.appendChild(row);
      });
      productTable.appendChild(fragment);
      productTable.classList.add("fade-in");
      attachEventListeners();
    }
  }

  function attachEventListeners() {
    document.querySelectorAll(".product-checkbox").forEach((checkbox) => {
      checkbox.addEventListener("change", updateSelectedProducts);
    });

    document.querySelectorAll(".quantity-input").forEach((input) => {
      input.addEventListener("input", handleQuantityInput);
      input.addEventListener("blur", cleanupQuantityInput);
      input.addEventListener("change", updateSelectedProducts);
    });
  }

  function handleQuantityInput(event) {
    const input = event.target;
    const checkbox = input.closest("tr").querySelector(".product-checkbox");

    if (input.dataset.kg === "true") {
      let value = input.value;
      // Allow digits and one decimal point anywhere
      value = value.replace(/[^\d.]/g, "");

      // Ensure only one decimal point
      const parts = value.split(".");
      if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
      }

      input.value = value;
    } else {
      input.value = input.value.replace(/\D/g, "");
    }

    // Ensure checkbox is checked if quantity is greater than 0
    if (parseFloat(input.value) > 0) {
      checkbox.checked = true;
    } else {
      checkbox.checked = false;
    }
  }

  function cleanupQuantityInput(event) {
    const input = event.target;
    const checkbox = input.closest("tr").querySelector(".product-checkbox");

    if (input.dataset.kg === "true") {
      let value = input.value;

      // Remove leading zeros
      value = value.replace(/^0+/, "");

      // If it's empty, set to 0
      if (value === "" || value === ".") {
        value = "0";
      } else if (value.startsWith(".")) {
        // If it starts with a decimal point, add a leading zero
        value = "0" + value;
      }

      // Remove trailing decimal point
      if (value.endsWith(".")) {
        value = value.slice(0, -1);
      }

      // Limit to one decimal place if there's a decimal point
      const parts = value.split(".");
      if (parts.length > 1) {
        value = parts[0] + "." + parts[1].substring(0, 1);
      }

      input.value = value;
    } else {
      input.value = Math.max(0, parseInt(input.value) || 0);
    }

    const quantity = parseFloat(input.value) || 0;
    if (quantity === 0) {
      checkbox.checked = false;
      input.value = "0";
    } else {
      checkbox.checked = true;
    }

    updateSelectedProducts({ target: input });
  }

  function updateSelectedProducts(event) {
    const row = event.target.closest("tr");
    const checkbox = row.querySelector(".product-checkbox");
    const quantityInput = row.querySelector(".quantity-input");
    const product = JSON.parse(checkbox.dataset.product);

    let quantity;
    if (product.unitOfMeasure === "/KG") {
      quantity = parseFloat(quantityInput.value) || 0;
    } else {
      quantity = parseInt(quantityInput.value, 10) || 0;
    }

    if (event.target.type === "checkbox") {
      if (checkbox.checked) {
        quantity = quantity || 1;
        quantityInput.value = quantity;
        selectedProducts.set(product.productName, {
          quantity: quantity,
          product: product,
        });
      } else {
        selectedProducts.delete(product.productName);
        quantityInput.value = "0";
      }
    } else {
      if (quantity > 0) {
        checkbox.checked = true;
        selectedProducts.set(product.productName, {
          quantity: quantity,
          product: product,
        });
      } else {
        checkbox.checked = false;
        selectedProducts.delete(product.productName);
        quantityInput.value = "0";
      }
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
      updateAllDates();
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

  function updateAllDates() {
    const currentDate = getCurrentDate();
    const dateElements = document.querySelectorAll(
      "#generatedDate, #printGeneratedDate",
    );
    dateElements.forEach((element) => {
      element.textContent = currentDate;
    });
  }

  copyToClipboardBtn.addEventListener("click", () => {
    if (selectedProducts.size === 0) {
      alert("Please select at least one product.");
      return;
    }

    let clipboardText = "🛒 Your Order Summary:\n\n";
    let totalPrice = 0;

    selectedProducts.forEach(({ quantity, product }, productName) => {
      const price = parseFloat(product.salesPrice?.replace(/[^0-9.-]+/g, ""));
      const productQuantity =
        product.unitOfMeasure === "/KG"
          ? parseFloat(quantity)
          : parseInt(quantity, 10);

      clipboardText += `${product.productName}/${product.unitOfMeasure}: `;

      if (isNaN(price)) {
        clipboardText += "(Check with Customer Service for Pricing)";
      } else {
        const productTotal = price * productQuantity;
        totalPrice += productTotal;
        clipboardText += `$${price.toFixed(2)}, Quantity: ${formatQuantity(productQuantity, product.unitOfMeasure)}, Total: $${productTotal.toFixed(2)}`;
      }

      clipboardText += "\n----------------------------------------\n";
    });

    const shippingPrice = totalPrice < 80 ? 8 : 0;
    const finalTotal = totalPrice + shippingPrice;

    clipboardText += "\n📦 Shipping Information:\n";
    if (shippingPrice === 0) {
      clipboardText += "   • Free Shipping (Order Value above $80)\n";
    } else {
      clipboardText +=
        "   • $8 (Shipping fee applies for order values below $80)\n";
    }

    clipboardText += "\n💰 Order Summary:\n";
    clipboardText += `   • Subtotal: $${totalPrice.toFixed(2)}\n`;
    clipboardText += `   • Shipping: $${shippingPrice.toFixed(2)}\n`;
    clipboardText += `   • Total: $${finalTotal.toFixed(2)}\n\n`;

    clipboardText +=
      "⚠️ Disclaimer: The prices listed are estimates for reference only and are subject to changes.\n\n";

    clipboardText +=
      "Thank you for your order! Please send this text to our WhatsApp for processing.";

    navigator.clipboard
      .writeText(clipboardText)
      .then(() => {
        showCustomAlert();
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        alert("Failed to copy text. Please try again.");
      });
  });

  function showCustomAlert() {
    const modal = document.getElementById("customAlert");
    const closeBtn = document.getElementById("closeModal");

    modal.style.display = "block";

    closeBtn.onclick = function () {
      modal.style.display = "none";
    };

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    };
  }

  window.addEventListener("beforeunload", function (e) {
    if (selectedProducts.size > 0) {
      e.preventDefault();
      e.returnValue = "";
    }
  });

  function formatQuantity(quantity, unitOfMeasure) {
    if (unitOfMeasure === "/KG") {
      return quantity % 1 === 0 ? quantity.toString() : quantity.toFixed(1);
    } else {
      return quantity.toString();
    }
  }

  // Initial load
  loadProducts();
});

function getCurrentDate() {
  const now = new Date();
  const options = { timeZone: "Asia/Singapore" };
  return now.toLocaleDateString("en-GB", options);
}
