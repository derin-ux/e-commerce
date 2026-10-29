// js/cart.js
const API_URL = "http://localhost:5000/api"; // same base URL as your other files

// Guesses: change these to match your real cart routes
const CART_PATH = "/cart";
const itemPath = (productId) => `/cart/items/${productId}`;

const token = localStorage.getItem("token");
const $ = (id) => document.getElementById(id);

let items = []; // [{ product: {...}, quantity }]

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

async function authFetch(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function showMessage(text, isError = true) {
  $("cartMessage").textContent = text;
  $("cartMessage").style.color = isError ? "#b3261e" : "var(--green)";
}

function showEmpty(text) {
  $("cartLayout").hidden = true;
  $("emptyCart").hidden = false;
  $("emptyCartText").textContent = text;
}

// ---------- header: Login/Logout + cart count ----------
function setupHeader() {
  const link = $("authLink");
  if (token) {
    link.textContent = "Logout";
    link.href = "#";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("cartCount");
      window.location.href = "index.html";
    });
  }
}

function setCartCount(n) {
  $("cartCount").textContent = n;
  localStorage.setItem("cartCount", String(n)); // the home page reads this
}

// ---------- rendering ----------
function render() {
  if (!items.length) {
    setCartCount(0);
    return showEmpty("Your cart is empty.");
  }

  $("emptyCart").hidden = true;
  $("cartLayout").hidden = false;

  let total = 0;
  let totalQty = 0;
  let hasProblem = false;

  $("cartItems").innerHTML = items
    .map(({ product: p, quantity }) => {
      const stock = Number(p.quantity);
      const tooMany = quantity > stock;
      if (tooMany) hasProblem = true;

      total += Number(p.price) * quantity;
      totalQty += quantity;

      const image = p.images && p.images.length ? p.images[0] : "images/placeholder.png";
      const warning =
        stock === 0
          ? "Out of stock. Remove it to continue."
          : tooMany
          ? `Only ${stock} left. Reduce the quantity to continue.`
          : "";

      return `
      <article class="cart-item">
        <a class="cart-item-image" href="product.html?id=${p._id}">
          <img src="${escapeHTML(image)}" alt="${escapeHTML(p.name)}">
        </a>

        <div class="cart-item-info">
          <p class="cart-item-shop">${escapeHTML(p.shop?.name || "")}</p>
          <h3>${escapeHTML(p.name)}</h3>
          <p class="cart-item-price">₦${Number(p.price).toLocaleString()}</p>
          ${warning ? `<p class="cart-item-warning">${warning}</p>` : ""}
        </div>

        <div class="cart-item-side">
          <div class="qty-control">
            <button type="button" data-action="dec" data-id="${p._id}"
                    aria-label="Decrease quantity" ${quantity <= 1 ? "disabled" : ""}>−</button>
            <span>${quantity}</span>
            <button type="button" data-action="inc" data-id="${p._id}"
                    aria-label="Increase quantity" ${quantity >= stock ? "disabled" : ""}>+</button>
          </div>
          <button type="button" class="remove-button" data-action="remove"
                  data-id="${p._id}">Remove</button>
        </div>
      </article>`;
    })
    .join("");

  $("summaryCount").textContent = totalQty;
  $("summaryTotal").textContent = `₦${total.toLocaleString()}`;
  $("checkoutButton").classList.toggle("disabled", hasProblem);
  setCartCount(totalQty);
}

// ---------- load ----------
async function loadCart() {
  if (!token) {
    $("cartLayout").hidden = true;
    $("emptyCart").hidden = false;
    $("emptyCartText").innerHTML =
      'Please <a href="login.html" class="continue-link">log in</a> to see your cart.';
    return;
  }

  const { res, data } = await authFetch(CART_PATH);

  if (res.status === 403) {
    return showEmpty("Only customer accounts have a cart. Log in as a customer to shop.");
  }
  if (!res.ok) {
    return showMessage(data.message || "Could not load your cart.");
  }

  const cart = data.cart || data;
  // Keep only items whose product still exists (a deleted product comes back empty)
  items = (cart.items || []).filter(
    (i) => i.product && typeof i.product === "object"
  );
  render();
}

// ---------- buttons: + / − / remove ----------
$("cartItems").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  const current = items.find((i) => i.product._id === id);
  if (!current) return;

  showMessage("");
  btn.disabled = true;
  let result;

  if (btn.dataset.action === "remove") {
    result = await authFetch(itemPath(id), { method: "DELETE" });
  } else {
    const quantity = current.quantity + (btn.dataset.action === "inc" ? 1 : -1);
    result = await authFetch(itemPath(id), {
      method: "PATCH",
      body: JSON.stringify({ quantity }),
    });
  }

  if (!result.res.ok) {
    showMessage(result.data.message || "Could not update your cart.");
  }
  loadCart(); // always reload so the page matches the server
});

setupHeader();
loadCart();