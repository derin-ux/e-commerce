const productGrid = document.getElementById("productGrid");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

const savedCount = localStorage.getItem("cartCount");
if (savedCount && document.getElementById("cartCount")) {
  document.getElementById("cartCount").textContent = savedCount;
}
// Product names come from shop owners, so we escape them before putting
function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

function renderProducts(products) {
  if (!products.length) {
    productGrid.innerHTML = "<p>No products found.</p>";
    return;
  }

  productGrid.innerHTML = products
    .map((p) => {
      const image = p.images && p.images.length ? p.images[0] : "images/placeholder.png";
      return `
        <article class="productcard">
          <a href="product.html?id=${p._id}">
            <img src="${escapeHTML(image)}" alt="${escapeHTML(p.name)}">
            <h3>${escapeHTML(p.name)}</h3>
          </a>
          <p class="price">₦${Number(p.price).toLocaleString()}</p>
          <p class="stock">${p.quantity > 0 ? p.quantity + " in stock" : "Out of stock"}</p>
        </article>
      `;
    })
    .join("");
}

async function loadProducts(query = "") {
  productGrid.innerHTML = "<p>Loading...</p>";
  try {
    const url = query
      ? `${API_URL}/products?search=${encodeURIComponent(query)}`
      : `${API_URL}/products`;
    const res = await fetch(url);
    const data = await res.json();

    // works whether your API returns [..] or { products: [..] }
    const products = Array.isArray(data) ? data : data.products || [];
    renderProducts(products);
  } catch (err) {
    productGrid.innerHTML = "<p>Could not load products. Try again later.</p>";
  }
}

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loadProducts(searchInput.value.trim());
  document.getElementById("products").scrollIntoView({ behavior: "smooth" });
});

// Swap Login for Logout when a token is saved
function updateLoginLink() {
  const token = localStorage.getItem("token");
  const loginLink = document.querySelector('.headerlinks a[href="customer/login.html"]');
  if (token && loginLink) {
    loginLink.textContent = "Logout";
    loginLink.href = "#";
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      window.location.reload();
    });
  }
}

updateLoginLink();
loadProducts();