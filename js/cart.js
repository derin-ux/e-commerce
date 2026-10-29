(() => {
  "use strict";

  const BASE =
    typeof API_URL !== "undefined"
      ? API_URL
      : "http://localhost:5000/api";

  const CART_PATH = "/cart";

  const $ = (id) => document.getElementById(id);

  let items = [];
  let busy = false;

  // ---------- Helpers ----------

  function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
  }

  function formatPrice(value) {
    const price = Number(value);
    return `₦${(Number.isFinite(price) ? price : 0).toLocaleString("en-NG")}`;
  }

  function getProductImage(product) {
    if (
      Array.isArray(product.images) &&
      product.images.length &&
      product.images[0]
    ) {
      return product.images[0];
    }

    return "images/placeholder.png";
  }

  function getTotalQuantity(cartItems = items) {
    return cartItems.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }

  function getCartTotal(cartItems = items) {
    return cartItems.reduce((total, item) => {
      return (
        total +
        Number(item.product?.price || 0) *
          Number(item.quantity || 0)
      );
    }, 0);
  }

  function setCartCount(count) {
    localStorage.setItem("cartCount", String(count));

    const element = $("cartCount");

    if (element) {
      element.textContent = count;
    }
  }

  // ---------- API ----------

  async function authFetch(path, options = {}) {
    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "login.html";
      return {
        res: { ok: false, status: 401 },
        data: {}
      };
    }

    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    };

    if (options.body) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }

    return { res, data };
  }

  // ---------- Messages ----------

  function showMessage(message, isError = true) {
    const element = $("cartMessage");

    if (!element) return;

    element.textContent = message;
    element.style.color = isError ? "#b3261e" : "var(--green)";
  }

  function showEmpty(message) {
    $("cartLayout").hidden = true;
    $("emptyCart").hidden = false;
    $("emptyCartText").textContent = message;
  }

  // ---------- Header ----------

  function setupHeader() {
    const authLink = $("authLink");

    if (!authLink) return;

    if (localStorage.getItem("token")) {
      authLink.textContent = "Logout";
      authLink.href = "#";

      authLink.addEventListener("click", (event) => {
        event.preventDefault();

        localStorage.removeItem("token");
        localStorage.removeItem("cartCount");

        window.location.href = "index.html";
      });
    } else {
      authLink.textContent = "Login";
      authLink.href = "login.html";
    }
  }

  // ---------- Render cart ----------

  function render() {
    const validItems = items.filter(
      (item) =>
        item.product &&
        typeof item.product === "object" &&
        item.product._id
    );

    items = validItems;

    const count = getTotalQuantity();
    setCartCount(count);

    if (items.length === 0) {
      $("cartItems").innerHTML = "";
      $("summaryCount").textContent = "0";
      $("summaryTotal").textContent = formatPrice(0);

      $("checkoutButton").classList.add("disabled");
      $("checkoutButton").setAttribute("aria-disabled", "true");

      showEmpty("Your cart is empty.");
      return;
    }

    $("emptyCart").hidden = true;
    $("cartLayout").hidden = false;

    let hasProblem = false;

    $("cartItems").innerHTML = items
      .map(({ product, quantity }) => {
        const stock = Number(product.quantity) || 0;
        const price = Number(product.price) || 0;
        const qty = Number(quantity) || 1;

        const tooMany = qty > stock;
        const outOfStock = stock <= 0;

        if (tooMany || outOfStock) {
          hasProblem = true;
        }

        let warning = "";

        if (outOfStock) {
          warning = "Out of stock. Remove this item to continue.";
        } else if (tooMany) {
          warning = `Only ${stock} left. Reduce the quantity to continue.`;
        }

        const image = getProductImage(product);

        return `
          <article class="cart-item">

            <a
              class="cart-item-image"
              href="product.html?id=${encodeURIComponent(product._id)}"
            >
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(product.name)}"
                loading="lazy"
                onerror="this.onerror=null;this.src='images/placeholder.png';"
              >
            </a>

            <div class="cart-item-info">
              <p class="cart-item-shop">
                ${escapeHTML(product.shop?.name || "")}
              </p>

              <h3>${escapeHTML(product.name)}</h3>

              <p class="cart-item-price">
                ${formatPrice(price)}
              </p>

              ${
                warning
                  ? `<p class="cart-item-warning">${escapeHTML(warning)}</p>`
                  : ""
              }
            </div>

            <div class="cart-item-side">

              <div class="qty-control">

                <button
                  type="button"
                  data-action="dec"
                  data-id="${escapeHTML(product._id)}"
                  aria-label="Decrease quantity"
                  ${qty <= 1 || busy ? "disabled" : ""}
                >−</button>

                <span>${qty}</span>

                <button
                  type="button"
                  data-action="inc"
                  data-id="${escapeHTML(product._id)}"
                  aria-label="Increase quantity"
                  ${qty >= stock || busy ? "disabled" : ""}
                >+</button>

              </div>

              <button
                type="button"
                class="remove-button"
                data-action="remove"
                data-id="${escapeHTML(product._id)}"
                ${busy ? "disabled" : ""}
              >
                Remove
              </button>

            </div>
          </article>
        `;
      })
      .join("");

    $("summaryCount").textContent = count;
    $("summaryTotal").textContent = formatPrice(getCartTotal());

    const checkoutButton = $("checkoutButton");

    checkoutButton.classList.toggle("disabled", hasProblem);

    if (hasProblem) {
      checkoutButton.setAttribute("aria-disabled", "true");
      showMessage(
        "Some items are out of stock or exceed available stock. Update your cart before checkout."
      );
    } else {
      checkoutButton.removeAttribute("aria-disabled");
      showMessage("");
    }
  }

  // ---------- Load cart ----------

  async function loadCart() {
    if (!localStorage.getItem("token")) {
      setCartCount(0);
      showEmpty("Please log in to see your cart.");
      return;
    }

    showMessage("Loading your cart...", false);

    try {
      const { res, data } = await authFetch(CART_PATH);

      if (res.status === 401) return;

      if (res.status === 403) {
        showEmpty(
          "Only customer accounts have a cart. Please log in as a customer."
        );
        return;
      }

      if (!res.ok) {
        showMessage(
          data.message || "Could not load your cart. Please try again."
        );
        return;
      }

      // Backend returns { items, total }, not necessarily { cart: { items } }.
      const cart = data.cart || data;

      items = Array.isArray(cart.items) ? cart.items : [];

      render();
    } catch (error) {
      console.error("Cart loading error:", error);

      showMessage(
        "Could not connect to the server. Check that your backend is running."
      );
    }
  }

  // ---------- Quantity, remove and clear ----------

  $("cartItems").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button || busy) return;

    const productId = button.dataset.id;
    const action = button.dataset.action;

    const current = items.find(
      (item) => String(item.product._id) === String(productId)
    );

    if (!current) return;

    let method;
    let path;
    let body;

    if (action === "remove") {
      method = "DELETE";
      path = `${CART_PATH}/${encodeURIComponent(productId)}`;
    } else if (action === "inc" || action === "dec") {
      const currentQuantity = Number(current.quantity);
      const newQuantity =
        currentQuantity + (action === "inc" ? 1 : -1);

      if (newQuantity < 1) return;

      const stock = Number(current.product.quantity) || 0;

      if (newQuantity > stock) {
        showMessage(`Only ${stock} in stock.`);
        return;
      }

      method = "PUT";
      path = `${CART_PATH}/${encodeURIComponent(productId)}`;
      body = JSON.stringify({ quantity: newQuantity });
    } else {
      return;
    }

    busy = true;
    button.disabled = true;
    showMessage("");

    try {
      const { res, data } = await authFetch(path, {
        method,
        ...(body ? { body } : {})
      });

      if (res.status === 401) return;

      if (!res.ok) {
        throw new Error(
          data.message || "Could not update your cart."
        );
      }

      const cart = data.cart || data;

      if (Array.isArray(cart.items)) {
        items = cart.items;
        render();
      } else {
        await loadCart();
      }
    } catch (error) {
      console.error("Cart update error:", error);
      showMessage(error.message || "Could not update your cart.");
    } finally {
      busy = false;
      render();
    }
  });

  // ---------- Initialization ----------

  setupHeader();
  loadCart();
})();