

// 1. Sample product data
const products = [
  {
    id: 1,
    name: "Men's Casual Shirt",
    category: "Men",
    store: "Style by Zara",
    price: 12000,
    oldPrice: 15000,
    rating: 4.5,
    reviews: 120,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 2,
    name: "Women's Midi Dress",
    category: "Women",
    store: "Luxe Fashion",
    price: 28000,
    oldPrice: 33000,
    rating: 4.7,
    reviews: 98,
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 3,
    name: "Classic Sneakers",
    category: "Shoes",
    store: "Footwear Store",
    price: 18000,
    oldPrice: 20000,
    rating: 4.6,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 4,
    name: "Leather Handbag",
    category: "Bags",
    store: "Bagz Collection",
    price: 22000,
    oldPrice: 29000,
    rating: 4.8,
    reviews: 210,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 5,
    name: "Polarized Sunglasses",
    category: "Accessories",
    store: "VisionStyle",
    price: 8500,
    oldPrice: 10000,
    rating: 4.4,
    reviews: 76,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: 6,
    name: "Tracksuit Set",
    category: "Sportswear",
    store: "Sports World",
    price: 25000,
    oldPrice: 31000,
    rating: 4.5,
    reviews: 92,
    image: "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=600&q=80"
  }
];

// 2. Get homepage elements
const productGrid = document.getElementById("productGrid");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const cartCount = document.getElementById("cartCount");

// 3. Shopping cart and wishlist
const cart = [];
const wishlist = new Set();

// Format prices in Nigerian naira
function formatPrice(price) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(price);
}

// Calculate discount percentage
function getDiscount(price, oldPrice) {
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

// 4. Display products on the homepage
function displayProducts(items) {
  if (!productGrid) return;

  if (items.length === 0) {
    productGrid.innerHTML =
      "<p>No products found. Try another search.</p>";
    return;
  }

  productGrid.innerHTML = items.map(product => {
    const discount = getDiscount(
      product.price,
      product.oldPrice
    );

    return `
      <article class="product-card">
        <div class="product-image">
          <img
            src="${product.image}"
            alt="${product.name}"
            loading="lazy"
          >

          <span class="discount-badge">
            -${discount}%
          </span>

          <button
            class="wishlist-btn"
            data-wishlist="${product.id}"
            aria-label="Add ${product.name} to wishlist"
            aria-pressed="${wishlist.has(product.id)}"
          >
            ${wishlist.has(product.id) ? "♥" : "♡"}
          </button>
        </div>

        <div class="product-info">
          <p class="product-category">${product.category}</p>

          <h3>${product.name}</h3>

          <p class="store-name">${product.store}</p>

          <p class="product-rating">
            <span>★</span> ${product.rating}
            (${product.reviews})
          </p>

          <div class="product-prices">
            <strong>${formatPrice(product.price)}</strong>
            <del>${formatPrice(product.oldPrice)}</del>
          </div>

          <button
            class="add-to-cart"
            data-cart="${product.id}"
          >
            Add to Cart
          </button>
        </div>
      </article>
    `;
  }).join("");
}

// 5. Search products by name, category or store
function searchProducts(query) {
  const term = query.trim().toLowerCase();

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(term) ||
    product.category.toLowerCase().includes(term) ||
    product.store.toLowerCase().includes(term)
  );

  displayProducts(filteredProducts);
}

// Listen for search submissions
if (searchForm && searchInput) {
  searchForm.addEventListener("submit", function(event) {
    event.preventDefault();
    searchProducts(searchInput.value);

    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth"
    });
  });

  // Update results while typing
  searchInput.addEventListener("input", function() {
    searchProducts(searchInput.value);
  });
}

// 6. Handle product buttons
if (productGrid) {
  productGrid.addEventListener("click", function(event) {
    const cartButton = event.target.closest("[data-cart]");
    const wishlistButton = event.target.closest("[data-wishlist]");

    // Add product to cart
    if (cartButton) {
      const productId = Number(cartButton.dataset.cart);
      const product = products.find(item => item.id === productId);

      if (product) {
        cart.push(product);
        updateCartCount();

        cartButton.textContent = "Added!";
        setTimeout(() => {
          cartButton.textContent = "Add to Cart";
        }, 1000);
      }
    }

    // Toggle wishlist
    if (wishlistButton) {
      const productId = Number(
        wishlistButton.dataset.wishlist
      );

      if (wishlist.has(productId)) {
        wishlist.delete(productId);
      } else {
        wishlist.add(productId);
      }

      displayProducts(
        products.filter(product =>
          product.name.toLowerCase().includes(
            searchInput?.value.trim().toLowerCase() || ""
          ) ||
          product.category.toLowerCase().includes(
            searchInput?.value.trim().toLowerCase() || ""
          ) ||
          product.store.toLowerCase().includes(
            searchInput?.value.trim().toLowerCase() || ""
          )
        )
      );
    }
  });
}

// 7. Update the shopping cart counter
function updateCartCount() {
  if (cartCount) {
    cartCount.textContent = cart.length;
  }
}

// 8. Demonstration newsletter form
const newsletterForm =
  document.getElementById("newsletterForm");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", function(event) {
    event.preventDefault();

    alert(
      "Thank you for your interest in StyleHub! " +
      "Newsletter subscriptions will be connected to our backend later."
    );

    newsletterForm.reset();
  });
}

// 9. Load featured products when the page opens
displayProducts(products);

/* =================================
   CATEGORY FILTERING
================================= */

const categoryCards = document.querySelectorAll(
  ".category-card[data-category]"
);

categoryCards.forEach(card => {
  card.addEventListener("click", event => {
    event.preventDefault();

    const selectedCategory = card.dataset.category;

    // Find products belonging to this category.
    const matchingProducts = products.filter(product =>
      product.category.toLowerCase() ===
      selectedCategory.toLowerCase()
    );

    // Display the matching products.
    displayProducts(matchingProducts);

    // Update the search field, if it exists.
    if (searchInput) {
      searchInput.value = "";
    }

    // Scroll down to the products.
    document.getElementById("products")?.scrollIntoView({
      behavior: "smooth"
    });
  });
});

// View All Categories button
const viewAllButton = document.getElementById(
  "viewAllCategories"
);

if (viewAllButton) {
  viewAllButton.addEventListener("click", () => {
    // Show every category card.
    document.getElementById("categories")?.scrollIntoView({
      behavior: "smooth"
    });
  });
}