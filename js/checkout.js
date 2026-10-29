
(() => {
  const BASE = typeof API_URL !== "undefined" ? API_URL : "http://localhost:5000/api";

  // Guess: change to match your real cart route (same as in cart.js)
  const CART_PATH = "/cart";

  const token = localStorage.getItem("token");
  const $ = (id) => document.getElementById(id);
  const FIELDS = ["fullName", "phone", "address", "city", "state"];

  function escapeHTML(text) {
    const div = document.createElement("div");
    div.textContent = text ?? "";
    return div.innerHTML;
  }

  async function authFetch(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
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
    $("checkoutMessage").textContent = text;
    $("checkoutMessage").style.color = isError ? "#b3261e" : "var(--green)";
  }

  function showEmpty(html) {
    $("checkoutLayout").hidden = true;
    $("emptyCheckout").hidden = false;
    $("emptyCheckoutText").innerHTML = html;
  }

  // ---------- order summary from the cart ----------
  function renderSummary(items) {
    let total = 0;
    let qty = 0;
    let problem = false;

    $("summaryItems").innerHTML = items
      .map(({ product: p, quantity }) => {
        if (quantity > Number(p.quantity)) problem = true;
        const line = Number(p.price) * quantity;
        total += line;
        qty += quantity;
        return `<li>
          <span>${escapeHTML(p.name)} x${quantity}</span>
          <span>₦${line.toLocaleString()}</span>
        </li>`;
      })
      .join("");

    $("summaryCount").textContent = qty;
    $("summaryTotal").textContent = `₦${total.toLocaleString()}`;

    if (problem) {
      showMessage("Some items are out of stock or above the stock available. Go back to your cart to fix this.");
      $("placeOrderButton").disabled = true;
    }
  }

  async function loadCart() {
    if (!token) {
      return showEmpty('Please <a href="login.html" class="continue-link">log in</a> to check out.');
    }

    const { res, data } = await authFetch(CART_PATH);
    if (res.status === 403) {
      return showEmpty("Only customer accounts can check out. Log in as a customer to shop.");
    }
    if (!res.ok) {
      return showEmpty(escapeHTML(data.message || "Could not load your cart."));
    }

    const cart = data.cart || data;
    const items = (cart.items || []).filter(
      (i) => i.product && typeof i.product === "object"
    );
    if (!items.length) return showEmpty("Your cart is empty.");

    $("emptyCheckout").hidden = true;
    $("checkoutLayout").hidden = false;
    renderSummary(items);

    // Pre-fill the name from the account (optional, ignored if it fails)
    authFetch("/auth/me").then(({ res: r, data: me }) => {
      if (r.ok && me.name && !$("fullName").value) $("fullName").value = me.name;
    });
  }

  // ---------- validation ----------
  function validate(v) {
    const errors = {};
    if (v.fullName.length < 2) errors.fullName = "Enter your full name.";
    if (!/^(\+234|0)[789][01]\d{8}$/.test(v.phone.replace(/\s/g, ""))) {
      errors.phone = "Enter a valid phone number, e.g. 08012345678.";
    }
    if (v.address.length < 5) errors.address = "Enter your street address.";
    if (v.city.length < 2) errors.city = "Enter your city.";
    if (v.state.length < 2) errors.state = "Enter your state.";
    return errors;
  }

  function clearErrors() {
    FIELDS.forEach((f) => {
      $(`${f}Error`).textContent = "";
      $(f).classList.remove("invalid");
    });
    showMessage("");
  }

  // ---------- place the order ----------
  $("checkoutForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const values = {};
    FIELDS.forEach((f) => (values[f] = $(f).value.trim()));

    const errors = validate(values);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, text]) => {
        $(`${field}Error`).textContent = text;
        $(field).classList.add("invalid");
      });
      return;
    }

    const button = $("placeOrderButton");
    button.disabled = true;
    button.textContent = "Placing order...";

    try {
      const { res, data } = await authFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          shippingAddress: { ...values, phone: values.phone.replace(/\s/g, "") },
        }),
      });

      if (!res.ok) {
        // e.g. "Not enough stock for ..." or "Your cart is empty"
        showMessage(data.message || "Could not place your order.");
        return;
      }

      localStorage.setItem("cartCount", "0"); // the cart was emptied
      window.location.href = `payment.html?order=${data._id}`;
    } catch (err) {
      showMessage("Could not reach the server. Try again.");
    } finally {
      button.disabled = false;
      button.textContent = "Place Order";
    }
  });

  loadCart();
})();