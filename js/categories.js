/* ======================================
   STYLEHUB - SHOP BY CATEGORY PAGE
====================================== */

// Category information and subcategories.
const categoryData = [
  {
    name: "Men",
    description: "Everyday essentials and modern menswear.",
    subcategories: ["Shirts", "Trousers", "Jackets", "Jeans", "Traditional Wear"],
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=700&q=80"
  },
  {
    name: "Women",
    description: "Find your next favourite outfit.",
    subcategories: ["Dresses", "Tops", "Skirts", "Jeans", "Traditional Wear"],
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=700&q=80"
  },
  {
    name: "Shoes",
    description: "Step out in style and comfort.",
    subcategories: ["Sneakers", "Heels", "Sandals", "Loafers", "Boots"],
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80"
  },
  {
    name: "Bags",
    description: "Carry your essentials in style.",
    subcategories: ["Handbags", "Backpacks", "Tote Bags", "Travel Bags"],
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80"
  },
  {
    name: "Accessories",
    description: "The finishing touches to every look.",
    subcategories: ["Watches", "Sunglasses", "Jewelry", "Belts", "Hats"],
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80"
  },
  {
    name: "Sportswear",
    description: "Comfortable pieces for active days.",
    subcategories: ["Tracksuits", "Leggings", "Sports Tops", "Gym Wear"],
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=80"
  },
  {
    name: "Kids",
    description: "Comfortable fashion for little ones.",
    subcategories: ["Boys' Clothing", "Girls' Clothing", "Kids' Shoes", "Baby Wear"],
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=700&q=80"
  }
];

// Sample catalogue.
// Later, these records will come from MongoDB.
const categoryProducts = [
  {
    id: 1,
    name: "Classic Casual Shirt",
    category: "Men",
    subcategory: "Shirts",
    price: 12000,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    name: "Everyday Denim Jeans",
    category: "Men",
    subcategory: "Jeans",
    price: 16000,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    name: "Elegant Midi Dress",
    category: "Women",
    subcategory: "Dresses",
    price: 28000,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    name: "Everyday Fashion Top",
    category: "Women",
    subcategory: "Tops",
    price: 14000,
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 5,
    name: "Classic Sneakers",
    category: "Shoes",
    subcategory: "Sneakers",
    price: 18000,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 6,
    name: "Elegant Handbag",
    category: "Bags",
    subcategory: "Handbags",
    price: 22000,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 7,
    name: "Classic Sunglasses",
    category: "Accessories",
    subcategory: "Sunglasses",
    price: 8500,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 8,
    name: "Active Tracksuit",
    category: "Sportswear",
    subcategory: "Tracksuits",
    price: 25000,
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=600&q=80"
  }
];

const categoryGrid = document.getElementById("categoryGrid");
const categoryTabs = document.getElementById("categoryTabs");
const subcategoryList = document.getElementById("subcategoryList");
const productGrid = document.getElementById("categoryProductGrid");
const searchInput = document.getElementById("categorySearch");
const searchForm = document.getElementById("categorySearchForm");
const categoryCount = document.getElementById("categoryCount");
const productsHeading = document.getElementById("productsHeading");
const productsDescription = document.getElementById("productsDescription");
const emptyState = document.getElementById("emptyState");

let selectedCategory = "All";
let selectedSubcategory = "All";
let searchTerm = "";

function formatNaira(price) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(price);
}

// Display category cards.
function renderCategories() {
  const visibleCategories = categoryData.filter(category => {
    const matchesCategory =
      selectedCategory === "All" ||
      category.name === selectedCategory;

    const matchesSearch =
      !searchTerm ||
      category.name.toLowerCase().includes(searchTerm) ||
      category.description.toLowerCase().includes(searchTerm) ||
      category.subcategories.some(item =>
        item.toLowerCase().includes(searchTerm)
      );

    return matchesCategory && matchesSearch;
  });

  categoryGrid.innerHTML = visibleCategories.map(category => `
    <article class="category-card">
      <a href="#category-products"
         class="category-image-link"
         data-open-category="${category.name}"
         aria-label="Explore ${category.name}">
        <div class="category-image">
          <img src="${category.image}"
               alt="${category.name} fashion"
               loading="lazy">
        </div>
      </a>

      <div class="category-info">
        <h3>${category.name}</h3>
        <p>${category.description}</p>
        <a href="#category-products"
           class="category-link"
           data-open-category="${category.name}">
          Explore ${category.name} →
        </a>
      </div>
    </article>
  `).join("");

  categoryCount.textContent =
    `${visibleCategories.length} ${visibleCategories.length === 1 ? "category" : "categories"} found`;
}

// Display subcategories for the selected category.
function renderSubcategories() {
  let subcategories = [];

  if (selectedCategory === "All") {
    subcategories = [
      ...new Set(categoryData.flatMap(category => category.subcategories))
    ];
  } else {
    const category = categoryData.find(
      item => item.name === selectedCategory
    );

    subcategories = category ? category.subcategories : [];
  }

  subcategoryList.innerHTML = `
    <button type="button"
      class="subcategory-chip ${selectedSubcategory === "All" ? "active" : ""}"
      data-subcategory="All">
      All styles
    </button>
    ${subcategories.map(item => `
      <button type="button"
        class="subcategory-chip ${selectedSubcategory === item ? "active" : ""}"
        data-subcategory="${item}">
        ${item}
      </button>
    `).join("")}
  `;
}

// Display matching products.
function renderProducts() {
  const matchingProducts = categoryProducts.filter(product => {
    const matchesCategory =
      selectedCategory === "All" ||
      product.category === selectedCategory;

    const matchesSubcategory =
      selectedSubcategory === "All" ||
      product.subcategory === selectedSubcategory;

    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.subcategory.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSubcategory && matchesSearch;
  });

  productsHeading.textContent =
    selectedSubcategory !== "All"
      ? selectedSubcategory
      : selectedCategory === "All"
        ? "Popular Picks"
        : `${selectedCategory} Collection`;

  productsDescription.textContent =
    `${matchingProducts.length} sample ${matchingProducts.length === 1 ? "product" : "products"} available`;

  productGrid.innerHTML = matchingProducts.map(product => `
    <article class="product-card">
      <div class="product-image">
        <img src="${product.image}"
             alt="${product.name}"
             loading="lazy">
      </div>
      <div class="product-details">
        <p class="product-category">
          ${product.category} · ${product.subcategory}
        </p>
        <h3>${product.name}</h3>
        <p class="product-price">${formatNaira(product.price)}</p>
      </div>
    </article>
  `).join("");

  emptyState.hidden = matchingProducts.length > 0;
}

// Select a main category.
function selectCategory(category) {
  selectedCategory = category;
  selectedSubcategory = "All";

  categoryTabs.querySelectorAll("[data-category]").forEach(button => {
    const active = button.dataset.category === category;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  renderCategories();
  renderSubcategories();
  renderProducts();
}

// Category filter buttons.
categoryTabs.addEventListener("click", event => {
  const button = event.target.closest("[data-category]");

  if (button) {
    selectCategory(button.dataset.category);
  }
});

// Category card clicks.
categoryGrid.addEventListener("click", event => {
  const link = event.target.closest("[data-open-category]");

  if (!link) return;

  event.preventDefault();
  selectCategory(link.dataset.openCategory);

  document.getElementById("category-products")
    .scrollIntoView({ behavior: "smooth" });
});

// Subcategory filter buttons.
subcategoryList.addEventListener("click", event => {
  const button = event.target.closest("[data-subcategory]");

  if (!button) return;

  selectedSubcategory = button.dataset.subcategory;

  subcategoryList.querySelectorAll("[data-subcategory]")
    .forEach(item => {
      item.classList.toggle(
        "active",
        item.dataset.subcategory === selectedSubcategory
      );
    });

  renderProducts();

  document.getElementById("category-products")
    .scrollIntoView({ behavior: "smooth" });
});

// Search categories and products.
function applySearch() {
  searchTerm = searchInput.value.trim().toLowerCase();
  renderCategories();
  renderProducts();
}

searchForm.addEventListener("submit", event => {
  event.preventDefault();
  applySearch();

  document.getElementById("category-products")
    .scrollIntoView({ behavior: "smooth" });
});

searchInput.addEventListener("input", applySearch);

// Clear category, subcategory and search filters.
document.getElementById("clearFilter").addEventListener("click", () => {
  searchInput.value = "";
  searchTerm = "";
  selectCategory("All");
  document.getElementById("category-product")?.scrollIntoView({
    behavior: "smooth"
  });
});

// Initial page load.
selectCategory("All");