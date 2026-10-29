const CATEGORIES = ["Men", "Women", "Shoes", "Bags", "Accessories", "Sportswear", "Kids"];

// Same lists as the seller's product form, so styles match what shops can pick
const SUBCATEGORIES = {
  Men: ["Shirts", "Trousers", "Native Wear", "Suits", "T-Shirts"],
  Women: ["Dresses", "Tops", "Skirts", "Native Wear", "Jeans"],
  Shoes: ["Sneakers", "Heels", "Sandals", "Formal Shoes"],
  Bags: ["Handbags", "Backpacks", "Clutches"],
  Accessories: ["Watches", "Jewellery", "Belts", "Caps"],
  Sportswear: ["Jerseys", "Tracksuits", "Gym Wear"],
  Kids: ["Boys", "Girls", "Babies"],
};

const $ = (id) => document.getElementById(id);

let allProducts = [];
const state = { category: "All", subcategory: "", search: "" };

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// ---------- filtering ----------
function matches(p) {
  if (state.category !== "All" && p.category !== state.category) return false;
  if (state.subcategory && p.subcategory !== state.subcategory) return false;

  if (state.search) {
    const haystack = [p.name, p.category, p.subcategory, p.shop?.name]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(state.search.toLowerCase())) return false;
  }
  return true;
}

const hasFilters = () =>
  state.category !== "All" || state.subcategory || state.search;

// ---------- rendering ----------
function renderTabs() {
  document.querySelectorAll(".category-tab").forEach((tab) => {
    const active = tab.dataset.category === state.category;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-pressed", String(active));
  });
}

function renderCategoryCards() {
  $("categoryGrid").innerHTML = CATEGORIES.map((name) => {
    const count = allProducts.filter((p) => p.category === name).length;
    return `
      <button type="button" class="category-card" data-category="${name}">
        <h3>${name}</h3>
        <p>${count} ${count === 1 ? "product" : "products"}</p>
      </button>`;
  }).join("");

  $("categoryCount").textContent = `${allProducts.length} products in ${CATEGORIES.length} categories`;
}

function renderSubcategories() {
  const subs =
    state.category === "All"
      ? [...new Set(Object.values(SUBCATEGORIES).flat())]
      : SUBCATEGORIES[state.category] || [];

  $("subcategoryList").innerHTML = subs
    .map(
      (s) => `
      <button type="button" class="subcategory-link ${s === state.subcategory ? "active" : ""}"
              data-sub="${escapeHTML(s)}">${escapeHTML(s)}</button>`
    )
    .join("");
}

function renderProducts() {
  const found = allProducts.filter(matches);
  // With no filters, show a taste (12). With filters, show every match.
  const shown = hasFilters() ? found : found.slice(0, 12);

  let heading = "Popular Picks";
  if (state.subcategory) heading = state.subcategory;
  else if (state.category !== "All") heading = state.category;
  if (state.search) heading = `Results for "${state.search}"`;

  $("productsHeading").textContent = heading;
  $("productsDescription").textContent = `${found.length} ${
    found.length === 1 ? "product" : "products"
  } found`;

  $("emptyState").hidden = shown.length > 0;
  if (!shown.length) {
    $("emptyState").textContent =
      "No matching products found. Try another category or search.";
  }

  $("categoryProductGrid").innerHTML = shown
    .map((p) => {
      const image = p.images && p.images.length ? p.images[0] : "images/placeholder.png";
      return `
      <article class="product-card">
        <a href="product.html?id=${p._id}">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(p.name)}">
          <h3>${escapeHTML(p.name)}</h3>
        </a>
        <p class="shop-name">${escapeHTML(p.shop?.name || "")}</p>
        <p class="price">₦${Number(p.price).toLocaleString()}</p>
        <p class="stock">${p.quantity > 0 ? p.quantity + " in stock" : "Out of stock"}</p>
      </article>`;
    })
    .join("");
}

function render() {
  renderTabs();
  renderSubcategories();
  renderProducts();
}

function setCategory(category) {
  state.category = category;
  state.subcategory = ""; // old style may not exist in the new category
  render();
}

// ---------- events ----------
$("categoryTabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".category-tab");
  if (tab) setCategory(tab.dataset.category);
});

$("categoryGrid").addEventListener("click", (e) => {
  const card = e.target.closest(".category-card");
  if (!card) return;
  setCategory(card.dataset.category);
  $("category-products").scrollIntoView({ behavior: "smooth" });
});

$("subcategoryList").addEventListener("click", (e) => {
  const btn = e.target.closest(".subcategory-link");
  if (!btn) return;
  // Clicking the active style again turns it off
  state.subcategory = state.subcategory === btn.dataset.sub ? "" : btn.dataset.sub;
  render();
  $("category-products").scrollIntoView({ behavior: "smooth" });
});

$("categorySearchForm").addEventListener("submit", (e) => {
  e.preventDefault();
  state.search = $("categorySearch").value.trim();
  render();
  $("category-products").scrollIntoView({ behavior: "smooth" });
});

$("clearFilter").addEventListener("click", () => {
  state.category = "All";
  state.subcategory = "";
  state.search = "";
  $("categorySearch").value = "";
  render();
});

// ---------- load ----------
async function loadProducts() {
  $("productsDescription").textContent = "Loading products...";
  try {
    const res = await fetch(`${API_URL}/products`);
    const data = await res.json();
    allProducts = Array.isArray(data) ? data : data.products || [];
  } catch (err) {
    $("emptyState").hidden = false;
    $("emptyState").textContent = "Could not load products. Try again later.";
    $("productsDescription").textContent = "";
    return;
  }

  // Start from ?category=Men or ?search=shirt in the address bar
  const params = new URLSearchParams(window.location.search);
  const cat = params.get("category");
  if (cat && CATEGORIES.includes(cat)) state.category = cat;
  state.search = (params.get("search") || "").trim();
  $("categorySearch").value = state.search;

  renderCategoryCards();
  render();
}

loadProducts();