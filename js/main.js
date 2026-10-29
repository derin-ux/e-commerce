const productGrid = document.getElementById("productGrid");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

window.currentProducts = [];

// Safely display text supplied by the API.
function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value == null ? "" : String(value);
  return div.innerHTML;
}

// Read cart items from browser storage.
function getCart() {
  try {
    const cart = JSON.parse(
      localStorage.getItem("stylehubCart") || "[]"
    );

    return Array.isArray(cart) ? cart : [];
  } catch {
    return [];
  }
}

// Update the number beside Cart in the header.
function updateCartCount() {
  const cart = getCart();

  const count = cart.reduce(
    (total, item) => total + Number(item.quantity || 1),
    0
  );

  const countElement = document.getElementById("cartCount");

  if (countElement) {
    countElement.textContent = String(count);
  }

  localStorage.setItem("cartCount", String(count));
}

// Display the products returned by the API.
function renderProducts(products) {
  window.currentProducts = Array.isArray(products)
    ? products
    : [];

  if (!window.currentProducts.length) {
    productGrid.innerHTML =
      '<p class="empty-message">No products found.</p>';
    return;
  }

  productGrid.innerHTML = window.currentProducts
    .map((product) => {
      const id = String(product._id ?? "");
      const name = product.name || "Untitled product";

      const image =
        Array.isArray(product.images) && product.images.length
          ? product.images[0]
          : "images/placeholder.png";

      const price = Number(product.price || 0);
      const quantity = Number(product.quantity || 0);
      const inStock = quantity > 0;

      return `
        <article class="product-card">

          <a class="product-link"
             href="product.html?id=${encodeURIComponent(id)}">

            <div class="product-image">
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(name)}"
                loading="lazy"
              >
            </div>

            <div class="product-info">
              <h3>${escapeHTML(name)}</h3>

              <p class="store-name">StyleHub Store</p>

              <p class="product-price">
                ₦${price.toLocaleString("en-NG")}
              </p>

              <p class="product-stock">
                ${
                  inStock
                    ? `${quantity} in stock`
                    : "Out of stock"
                }
              </p>
            </div>
          </a>

          <div class="product-actions">
            <button
              type="button"
              class="add-to-cart"
              data-product-id="${escapeHTML(id)}"
              ${inStock ? "" : "disabled"}
            >
              ${inStock ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>

        </article>
      `;
    })
    .join("");
}

// Add a product to the cart.
function addToCart(productId) {
  const product = window.currentProducts.find(
    (item) => String(item._id) === String(productId)
  );

  if (!product) {
    alert("Product not found. Please refresh the page.");
    return;
  }

  const stock = Number(product.quantity || 0);

  if (stock <= 0) {
    alert("Sorry, this product is out of stock.");
    return;
  }

  const cart = getCart();

  const existingItem = cart.find(
    (item) => String(item.productId) === String(product._id)
  );

  if (existingItem) {
    if (Number(existingItem.quantity || 1) >= stock) {
      alert("You have already added the available stock.");
      return;
    }

    existingItem.quantity =
      Number(existingItem.quantity || 1) + 1;
  } else {
    cart.push({
      productId: String(product._id),
      name: String(product.name || "Untitled product"),
      price: Number(product.price || 0),
      image:
        Array.isArray(product.images) && product.images.length
          ? product.images[0]
          : "images/placeholder.png",
      quantity: 1
    });
  }

  localStorage.setItem("stylehubCart", JSON.stringify(cart));

  updateCartCount();

  alert(`${product.name || "Product"} added to your cart.`);
}

// Load products from your backend.
async function loadProducts(query = "") {
  productGrid.innerHTML =
    '<p class="loading-message">Loading products...</p>';

  try {
    if (typeof API_URL === "undefined" || !API_URL) {
      throw new Error("API_URL is not configured in js/api.js");
    }

    const endpoint = query
      ? `${API_URL}/products?search=${encodeURIComponent(query)}`
      : `${API_URL}/products`;

    const response = await fetch(endpoint);

    if (!response.ok) {
      throw new Error(
        `Product request failed: ${response.status}`
      );
    }

    const data = await response.json();

    const products = Array.isArray(data)
      ? data
      : data.products || [];

    renderProducts(products);

  } catch (error) {
    console.error("StyleHub product loading error:", error);

    productGrid.innerHTML = `
      <p class="error-message">
        Could not load products. Check your backend connection
        and API configuration.
      </p>
    `;
  }
}

// Handle Add to Cart clicks.
productGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".add-to-cart");

  if (!button || button.disabled) {
    return;
  }

  addToCart(button.dataset.productId);
});

// Handle product search.
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();

  loadProducts(searchInput.value.trim());

  document.getElementById("products").scrollIntoView({
    behavior: "smooth"
  });
});

// Show Logout instead of Login when a token exists.
function updateLoginLink() {
  const token = localStorage.getItem("token");
  const loginLink = document.getElementById("loginLink");

  if (token && loginLink) {
    loginLink.textContent = "Logout";
    loginLink.href = "#logout";

    loginLink.addEventListener("click", (event) => {
      event.preventDefault();

      localStorage.removeItem("token");
      window.location.reload();
    });
  }
}

// Newsletter demo.
const newsletterForm =
  document.getElementById("newsletterForm");

if (newsletterForm) {
  newsletterForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const message =
      document.getElementById("newsletterMessage");

    if (message) {
      message.textContent =
        "Thanks for your interest! Newsletter signup needs backend support.";
    }

    newsletterForm.reset();
  });
}

// Initialize the homepage.
updateCartCount();
updateLoginLink();
loadProducts();