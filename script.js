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

  let allProducts = [];
  let currentSortColumn = null;
  let isAscending = true;
  let currentSearchTerm = "";
  let isPreparingPrint = false;
  let selectedProducts = new Map(); // Store selected products and their quantities

  loadingSpinner.style.display = "block";

  fetch("products.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok " + response.statusText);
      }
      return response.json();
    })
    .then((data) => {
      loadingSpinner.style.display = "none";
      if (data && data.length) {
        allProducts = data;
        console.log("Loaded products:", allProducts);
        updateProductDisplay();
      } else {
        throw new Error("No data found in products.json");
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
          : 1;
        const isKg = product.unitOfMeasure === "/KG";
        row.innerHTML = `
          <td class="checkbox-column no-print">
            <input type="checkbox" class="product-checkbox" data-product='${JSON.stringify(product)}' ${isSelected ? "checked" : ""}>
          </td>
          <td>${product.productName}</td>
          <td>${product.unitOfMeasure}</td>
          <td>${product.salesPrice || "(Check with Customer Service for Pricing)"}</td>
          <td>
            <input type="number" class="quantity-input" value="${quantity}" min="1" step="1" ${isKg ? 'data-kg="true"' : ""} style="width: 60px;">
          </td>
          <td style="text-align: left !important; padding-left: 20px !important;">${
            product.indent ? "✓" : ""
          }</td>
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
      input.addEventListener("change", updateSelectedProducts);
    });
  }

  function handleQuantityInput(event) {
    const input = event.target;
    if (input.dataset.kg === "true") {
      // Allow decimal input for /KG items
      let value = input.value.replace(/[^0-9.]/g, "");
      const decimalParts = value.split(".");

      if (decimalParts.length > 2) {
        // More than one decimal point, keep only the first two parts
        value = decimalParts.slice(0, 2).join(".");
      }

      if (decimalParts.length === 2 && decimalParts[1].length > 1) {
        // Limit to one decimal place
        decimalParts[1] = decimalParts[1].slice(0, 1);
        value = decimalParts.join(".");
      }

      input.value = value;
    } else {
      // Only allow whole numbers for non-/KG items
      input.value = input.value.replace(/[^0-9]/g, "");
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

    if (quantity > 0) {
      checkbox.checked = true;
      selectedProducts.set(product.productName, {
        quantity: quantity,
        product: product,
      });
    } else {
      checkbox.checked = false;
      selectedProducts.delete(product.productName);
    }

    // If the event was triggered by changing the quantity, update the checkbox
    if (event.target.classList.contains("quantity-input")) {
      checkbox.checked = quantity > 0;
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

  updateAllDates();

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
      // For /KG items, show one decimal place if it's not a whole number
      return quantity % 1 === 0 ? quantity.toFixed(0) : quantity.toFixed(1);
    } else {
      // For non-/KG items, always show as whole numbers
      return quantity.toFixed(0);
    }
  }
});

function getCurrentDate() {
  const now = new Date();
  const options = { timeZone: "Asia/Singapore" };
  return now.toLocaleDateString("en-GB", options);
}
