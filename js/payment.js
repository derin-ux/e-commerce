// js/payment.js
(() => {
  const BASE = typeof API_URL !== "undefined" ? API_URL : "http://localhost:5000/api";

  const token = localStorage.getItem("token");
  const orderId = new URLSearchParams(window.location.search).get("order");
  const $ = (id) => document.getElementById(id);

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
    $("paymentMessage").textContent = text;
    $("paymentMessage").style.color = isError ? "#b3261e" : "var(--green)";
  }

  function showEmpty(html) {
    $("paymentLayout").hidden = true;
    $("resultPanel").hidden = true;
    $("emptyPayment").hidden = false;
    $("emptyPaymentText").innerHTML = html;
  }

  function showResult(kind, title, text, reference) {
    $("paymentLayout").hidden = true;
    $("emptyPayment").hidden = true;
    $("resultPanel").hidden = false;
    $("resultPanel").className = `result-panel ${kind}`;
    $("resultTitle").textContent = title;
    $("resultText").textContent = text;
    $("resultRef").hidden = !reference;
    $("resultRef").textContent = reference ? `Payment reference: ${reference}` : "";
    showMessage("");
  }

  function setBusy(busy) {
    ["payButton", "failButton", "cancelButton"].forEach((id) => {
      $(id).disabled = busy;
    });
  }

  // ---------- show the order ----------
  function render(order) {
    if (order.orderStatus === "cancelled") {
      return showResult(
        "cancelled",
        "This order was cancelled",
        order.refundRequired
          ? "A refund will need to be processed."
          : "Your items have been returned to stock."
      );
    }

    if (order.paymentStatus === "paid") {
      return showResult(
        "success",
        "Payment received",
        "Thank you! Your order is confirmed and the shops will start preparing it.",
        order.paymentReference
      );
    }

    $("emptyPayment").hidden = true;
    $("resultPanel").hidden = true;
    $("paymentLayout").hidden = false;

    $("orderRef").textContent = `#${String(order._id).slice(-6)}`;
    $("orderItems").innerHTML = (order.items || [])
      .map(
        (i) => `<li>
          <span>${escapeHTML(i.name)} x${i.quantity}</span>
          <span>₦${(Number(i.price) * Number(i.quantity)).toLocaleString()}</span>
        </li>`
      )
      .join("");

    const a = order.shippingAddress || {};
    $("shipTo").innerHTML = [a.fullName, a.phone, a.address, [a.city, a.state].filter(Boolean).join(", ")]
      .filter(Boolean)
      .map(escapeHTML)
      .join("<br>");

    $("payTotal").textContent = `₦${Number(order.total).toLocaleString()}`;
    $("payButton").textContent = `Pay ₦${Number(order.total).toLocaleString()}`;

    const pill = $("payStatus");
    pill.textContent = order.paymentStatus === "failed" ? "Payment failed" : "Unpaid";
    pill.className = `status-pill ${order.paymentStatus === "failed" ? "failed" : ""}`;

    if (order.paymentStatus === "failed") {
      showMessage("Your last payment failed. You can try again.");
    }
  }

  async function loadOrder() {
    if (!token) {
      return showEmpty('Please <a href="login.html" class="continue-link">log in</a> to continue.');
    }
    if (!orderId) {
      return showEmpty("No order selected.");
    }

    const { res, data } = await authFetch(`/orders/${orderId}`);
    if (!res.ok) {
      return showEmpty(escapeHTML(data.message || "Could not load this order."));
    }
    render(data);
  }

  // ---------- pay ----------
  async function pay(simulate) {
    showMessage("");
    setBusy(true);

    try {
      const { res, data } = await authFetch(`/orders/${orderId}/pay`, {
        method: "POST",
        body: JSON.stringify({ simulate }),
      });

      if (res.ok) {
        return render(data); // paid: shows the success panel
      }

      // 402 = the simulated payment failed; the order is kept so they can retry
      showMessage(data.message || "Payment could not be completed.");
      if (data.order) render(data.order);
      setBusy(false);
    } catch (err) {
      showMessage("Could not reach the server. Try again.");
      setBusy(false);
    }
  }

  $("payButton").addEventListener("click", () => pay("success"));
  $("failButton").addEventListener("click", () => pay("fail"));

  // ---------- cancel ----------
  $("cancelButton").addEventListener("click", async () => {
    if (!confirm("Cancel this order? Your items will go back into stock.")) return;
    showMessage("");
    setBusy(true);

    try {
      const { res, data } = await authFetch(`/orders/${orderId}/cancel`, { method: "PATCH" });
      if (!res.ok) {
        showMessage(data.message || "Could not cancel the order.");
        setBusy(false);
        return;
      }
      showResult("cancelled", "Order cancelled", data.message || "Your order was cancelled.");
    } catch (err) {
      showMessage("Could not reach the server. Try again.");
      setBusy(false);
    }
  });

  loadOrder();
})();