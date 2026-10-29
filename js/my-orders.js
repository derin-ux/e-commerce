// js/my-orders.js
(() => {
  const BASE = typeof API_URL !== "undefined" ? API_URL : "http://localhost:5000/api";

  const token = localStorage.getItem("token");
  const $ = (id) => document.getElementById(id);

  let orders = [];
  let filter = "all";

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
    $("ordersMessage").textContent = text;
    $("ordersMessage").style.color = isError ? "#b3261e" : "var(--green)";
  }

  function showEmpty(text, linkHtml) {
    $("ordersList").innerHTML = "";
    $("orderTabs").hidden = true;
    $("emptyOrders").hidden = false;
    $("emptyOrdersText").innerHTML = text;
    $("emptyOrdersLink").style.display = linkHtml ? "" : "none";
  }

  // ---------- header: Login / Logout ----------
  function setupHeader() {
    const link = $("authLink");
    if (!token) return;
    link.textContent = "Logout";
    link.href = "#";
    link.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("token");
      localStorage.removeItem("cartCount");
      window.location.href = "index.html";
    });
  }

  // ---------- working out an order's status ----------
  // Payment and cancellation are on the order; shipping is on each item.
  function summarize(order) {
    if (order.orderStatus === "cancelled") {
      return { key: "cancelled", label: "Cancelled", kind: "cancelled" };
    }
    if (order.paymentStatus === "failed") {
      return { key: "unpaid", label: "Payment failed", kind: "failed" };
    }
    if (order.paymentStatus !== "paid") {
      return { key: "unpaid", label: "Awaiting payment", kind: "" };
    }

    const statuses = (order.items || []).map((i) => i.status);
    const all = (s) => statuses.length > 0 && statuses.every((x) => x === s);

    if (all("delivered")) return { key: "delivered", label: "Delivered", kind: "paid" };
    if (statuses.includes("shipped") || statuses.includes("delivered")) {
      return { key: "active", label: "Shipped", kind: "info" };
    }
    if (statuses.includes("processing")) {
      return { key: "active", label: "Processing", kind: "info" };
    }
    return { key: "active", label: "Confirmed", kind: "info" };
  }

  // Matches the backend rule: no cancelling once any item has shipped
  function canCancel(order) {
    if (order.orderStatus === "cancelled") return false;
    return !(order.items || []).some((i) => ["shipped", "delivered"].includes(i.status));
  }

  const itemKind = (status) =>
    ({ delivered: "paid", shipped: "info", processing: "info", cancelled: "cancelled" }[status] ||
      "neutral");

  // ---------- rendering ----------
  function renderTabs() {
    document.querySelectorAll("#orderTabs .category-tab").forEach((tab) => {
      const active = tab.dataset.filter === filter;
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-pressed", String(active));
    });
  }

  function orderCard(order) {
    const status = summarize(order);
    const a = order.shippingAddress || {};
    const unpaid = status.key === "unpaid";

    const items = (order.items || [])
      .map(
        (i) => `
        <li>
          <span class="item-name">${escapeHTML(i.name)} x${i.quantity}</span>
          <span class="item-price">₦${(Number(i.price) * Number(i.quantity)).toLocaleString()}</span>
          <span class="status-pill item-status ${itemKind(i.status)}">${escapeHTML(i.status)}</span>
        </li>`
      )
      .join("");

    const address = [a.fullName, a.phone, a.address, [a.city, a.state].filter(Boolean).join(", ")]
      .filter(Boolean)
      .map(escapeHTML)
      .join("<br>");

    let actions = "";
    if (unpaid) {
      actions += `<a class="checkout-button" href="payment.html?order=${order._id}">Pay now</a>`;
    }
    if (canCancel(order)) {
      actions += `<button type="button" class="secondary-button danger" data-cancel="${order._id}">Cancel order</button>`;
    }

    let note = "";
    if (order.orderStatus === "cancelled" && order.refundRequired) {
      note = "This order was paid before it was cancelled, so a refund will need to be processed.";
    } else if (status.key === "active" && !canCancel(order)) {
      note = "Part of this order has shipped, so it can no longer be cancelled.";
    }

    return `
    <article class="order-card">
      <div class="order-head">
        <div>
          <h3>Order #${escapeHTML(String(order._id).slice(-6))}</h3>
          <p class="order-date">Placed on ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <span class="status-pill ${status.kind}">${status.label}</span>
      </div>

      <div class="order-body">
        <div>
          <h4>ITEMS</h4>
          <ul class="order-items">${items}</ul>
        </div>
        <div>
          <h4>DELIVERING TO</h4>
          <p class="order-address">${address}</p>
        </div>
      </div>

      <div class="order-foot">
        <p class="order-total">Total: <span>₦${Number(order.total).toLocaleString()}</span></p>
        <div class="order-actions">${actions}</div>
        ${note ? `<p class="order-note">${note}</p>` : ""}
      </div>
    </article>`;
  }

  function render() {
    renderTabs();

    const shown = orders.filter((o) => filter === "all" || summarize(o).key === filter);

    if (!shown.length) {
      $("ordersList").innerHTML = "";
      $("emptyOrders").hidden = false;
      $("emptyOrdersText").textContent = "No orders in this view.";
      $("emptyOrdersLink").style.display = "none";
      return;
    }

    $("emptyOrders").hidden = true;
    $("ordersList").innerHTML = shown.map(orderCard).join("");
  }

  // ---------- load ----------
  async function loadOrders() {
    if (!token) {
      return showEmpty(
        'Please <a href="login.html" class="continue-link">log in</a> to see your orders.',
        false
      );
    }

    const { res, data } = await authFetch("/orders");

    if (res.status === 403) {
      return showEmpty("Only customer accounts have orders. Log in as a customer to shop.", false);
    }
    if (!res.ok) {
      return showMessage(data.message || "Could not load your orders.");
    }

    orders = Array.isArray(data) ? data : data.orders || [];

    if (!orders.length) {
      return showEmpty("You haven't placed any orders yet.", true);
    }

    $("orderTabs").hidden = false;
    render();
  }

  // ---------- events ----------
  $("orderTabs").addEventListener("click", (e) => {
    const tab = e.target.closest(".category-tab");
    if (!tab) return;
    filter = tab.dataset.filter;
    render();
  });

  $("ordersList").addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-cancel]");
    if (!btn) return;

    if (!confirm("Cancel this order? Your items will go back into stock.")) return;

    showMessage("");
    btn.disabled = true;
    const { res, data } = await authFetch(`/orders/${btn.dataset.cancel}/cancel`, {
      method: "PATCH",
    });

    if (!res.ok) {
      btn.disabled = false;
      return showMessage(data.message || "Could not cancel the order.");
    }

    showMessage(data.message || "Order cancelled.", false);
    loadOrders(); // reload so the card matches the server
  });

  setupHeader();
  loadOrders();
})();