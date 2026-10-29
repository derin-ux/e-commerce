const CATEGORIES = [
  "Men",
  "Women",
  "Shoes",
  "Bags",
  "Accessories",
  "Sportswear",
  "Kids"
];

const SUBCATEGORIES = {
  Men: ["Shirts", "Trousers", "Native Wear", "Suits", "T-Shirts"],
  Women: ["Dresses", "Tops", "Skirts", "Native Wear", "Jeans"],
  Shoes: ["Sneakers", "Heels", "Sandals", "Formal Shoes"],
  Bags: ["Handbags", "Backpacks", "Clutches"],
  Accessories: ["Watches", "Jewellery", "Belts", "Caps"],
  Sportswear: ["Jerseys", "Tracksuits", "Gym Wear"],
  Kids: ["Boys", "Girls", "Babies"]
};

const $ = (id) => document.getElementById(id);

let allProducts = [];

const state = {
  category: "All",
  subcategory: "",
  search: ""
};

// ---------- Helpers ----------

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}

function getProductImage(product) {
  if (
    Array.isArray(product.images) &&
    product.images.length > 0 &&
    product.images[0]
  ) {
    return product.images[0];
  }

  return "images/placeholder.png";
}

function getProductPrice(product) {
  const price = Number(product.price);
  return Number.isFinite(price) ? price : 0;
}

function getStock(product) {
  const stock = Number(product.quantity);
  return Number.isFinite(stock) ? stock : 0;
}

function getCartCount(items) {
  return items.reduce(
    (total, item) => total + Number(item.quantity || 0),
    0
  );
}

async function apiFetch(path, options = {}) {
  const headers = {
    ...(options.headers || {})
  };

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const token = localStorage.getItem("token");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  return { response, data };
}

// ---------- Cart count ----------

function updateCartCount(count) {
  localStorage.setItem("cartCount", String(count));

  const countElement = $("cartCount");

  if (countElement) {
    countElement.textContent = count;
  }
}

async function refreshCartCount() {
  if (!localStorage.getItem("token")) {
    updateCartCount(0);
    return;
  }

  try {
    const { response, data } = await apiFetch("/cart");

    if (response.status === 401) {
      localStorage.removeItem("token");
      updateCartCount(0);
      return;
    }

    if (!response.ok) {
      console.warn("Could not refresh cart count:", data.message);
      return;
    }

    const items = Array.isArray(data.items) ? data.items : [];

    updateCartCount(getCartCount(items));
  } catch (error) {
    console.error("Could not refresh cart count:", error);
  }
}

// ---------- Filtering ----------

function matches(product) {
  if (
    state.category !== "All" &&
    product.category !== state.category
  ) {
    return false;
  }

  if (
    state.subcategory &&
    product.subcategory !== state.subcategory
  ) {
    return false;
  }

  if (state.search) {
    const searchableText = [
      product.name,
      product.category,
      product.subcategory,
      product.shop?.name
    ]
      .join(" ")
      .toLowerCase();

    if (!searchableText.includes(state.search.toLowerCase())) {
      return false;
    }
  }

  return true;
}

function hasFilters() {
  return (
    state.category !== "All" ||
    Boolean(state.subcategory) ||
    Boolean(state.search)
  );
}

// ---------- Category tabs ----------

function renderTabs() {
  document.querySelectorAll(".category-tab").forEach((tab) => {
    const active = tab.dataset.category === state.category;

    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
}

function renderCategoryCards() {
  $("categoryGrid").innerHTML = CATEGORIES.map((name) => {
    const count = allProducts.filter(
      (product) => product.category === name
    ).length;

    return `
      <button
        type="button"
        class="category-card"
        data-category="${escapeHTML(name)}"
      >
        <h3>${escapeHTML(name)}</h3>
        <p>${count} ${count === 1 ? "product" : "products"}</p>
      </button>
    `;
  }).join("");

  $("categoryCount").textContent =
    `${allProducts.length} products in ${CATEGORIES.length} categories`;
}

function renderSubcategories() {
  const subcategories =
    state.category === "All"
      ? [...new Set(Object.values(SUBCATEGORIES).flat())]
      : SUBCATEGORIES[state.category] || [];

  $("subcategoryList").innerHTML = subcategories
    .map((subcategory) => `
      <button
        type="button"
        class="subcategory-link ${
          subcategory === state.subcategory ? "active" : ""
        }"
        data-sub="${escapeHTML(subcategory)}"
      >
        ${escapeHTML(subcategory)}
      </button>
    `)
    .join("");
}

// ---------- Product display ----------

function renderProducts() {
  const found = allProducts.filter(matches);
  const shown = hasFilters() ? found : found.slice(0, 12);

  let heading = "Popular Picks";

  if (state.subcategory) {
    heading = state.subcategory;
  } else if (state.category !== "All") {
    heading = state.category;
  }

  if (state.search) {
    heading = `Results for "${state.search}"`;
  }

  $("productsHeading").textContent = heading;

  $("productsDescription").textContent =
    `${found.length} ${found.length === 1 ? "product" : "products"} found`;

  $("emptyState").hidden = shown.length > 0;

  if (shown.length === 0) {
    $("emptyState").textContent =
      "No matching products found. Try another category or search.";
  }

  $("categoryProductGrid").innerHTML = shown
    .map((product) => {
      const image = getProductImage(product);
      const price = getProductPrice(product);
      const stock = getStock(product);

      return `
        <article class="product-card">
          <a href="product.html?id=${encodeURIComponent(product._id)}">
            <img
              src="${escapeHTML(image)}"
              alt="${escapeHTML(product.name)}"
              loading="lazy"
              onerror="this.onerror=null;this.src='images/placeholder.png';"
            >

            <h3>${escapeHTML(product.name)}</h3>
          </a>

          <p class="shop-name">
            ${escapeHTML(product.shop?.name || "")}
          </p>

          <p class="price">
            ₦${price.toLocaleString("en-NG")}
          </p>

          <p class="stock">
            ${stock > 0 ? `${stock} in stock` : "Out of stock"}
          </p>

          <button
            type="button"
            class="add-to-cart-button"
            data-product-id="${escapeHTML(product._id)}"
            ${stock <= 0 ? "disabled" : ""}
          >
            Add to Cart
          </button>
        </article>
      `;
    })
    .join("");
}

function render() {
  renderTabs();
  renderSubcategories();
  renderProducts();
}

// ---------- Category selection ----------

function setCategory(category) {
  state.category = category;
  state.subcategory = "";
  render();
}

$("categoryTabs").addEventListener("click", (event) => {
  const tab = event.target.closest(".category-tab");

  if (tab) {
    setCategory(tab.dataset.category);
  }
});

$("categoryGrid").addEventListener("click", (event) => {
  const card = event.target.closest(".category-card");

  if (!card) return;

  setCategory(card.dataset.category);

  $("category-products").scrollIntoView({
    behavior: "smooth"
  });
});

$("subcategoryList").addEventListener("click", (event) => {
  const button = event.target.closest(".subcategory-link");

  if (!button) return;

  state.subcategory =
    state.subcategory === button.dataset.sub
      ? ""
      : button.dataset.sub;

  render();

  $("category-products").scrollIntoView({
    behavior: "smooth"
  });
});

// ---------- Search ----------

$("categorySearchForm").addEventListener("submit", (event) => {
  event.preventDefault();

  state.search = $("categorySearch").value.trim();

  render();

  $("category-products").scrollIntoView({
    behavior: "smooth"
  });
});

$("clearFilter").addEventListener("click", () => {
  state.category = "All";
  state.subcategory = "";
  state.search = "";

  $("categorySearch").value = "";

  render();
});

// ---------- Add to Cart ----------

$("categoryProductGrid").addEventListener("click", async (event) => {
  const button = event.target.closest(".add-to-cart-button");

  if (!button || button.disabled) return;

  const productId = button.dataset.productId;

  const product = allProducts.find(
    (item) => String(item._id) === String(productId)
  );

  if (!product) {
    alert("Product not found. Refresh the page and try again.");
    return;
  }

  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  if (getStock(product) < 1) {
    alert("This product is out of stock.");
    return;
  }

  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Adding...";

  try {
    // Correct backend route: POST /api/cart
    const { response, data } = await apiFetch("/cart", {
      method: "POST",
      body: JSON.stringify({
        productId: product._id,
        quantity: 1
      })
    });

    if (response.status === 401) {
      localStorage.removeItem("token");

      alert("Your session has expired. Please log in again.");
      window.location.href = "login.html";
      return;
    }

    if (response.status === 403) {
      alert("Only customer accounts can add products to the cart.");
      return;
    }

    if (!response.ok) {
      throw new Error(
        data.message || "Could not add the product to your cart."
      );
    }

    // The backend returns { items, total }.
    const items = Array.isArray(data.items) ? data.items : [];

    updateCartCount(getCartCount(items));

    button.textContent = "Added!";

  } catch (error) {
    console.error("Add to cart failed:", error);

    alert(error.message || "Could not connect to the server.");

    button.textContent = originalText;
  } finally {
    button.disabled = false;
  }
});

// ---------- Load products ----------

async function loadProducts() {
  $("productsDescription").textContent = "Loading products...";

  try {
    const { response, data } = await apiFetch("/products", {
      method: "GET"
    });

    if (!response.ok) {
      throw new Error(
        data.message || "Could not load products."
      );
    }

    allProducts = Array.isArray(data)
      ? data
      : Array.isArray(data.products)
        ? data.products
        : [];

    const params = new URLSearchParams(window.location.search);
    const category = params.get("category");

    if (category && CATEGORIES.includes(category)) {
      state.category = category;
    }

    state.search = (params.get("search") || "").trim();
    $("categorySearch").value = state.search;

    renderCategoryCards();
    render();

    await refreshCartCount();

  } catch (error) {
    console.error("Product loading failed:", error);

    $("emptyState").hidden = false;
    $("emptyState").textContent =
      "Could not load products. Check your server connection and try again.";

    $("productsDescription").textContent = "";
  }
}

loadProducts();