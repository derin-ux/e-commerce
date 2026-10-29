const MY_ORDERS_PATH = "/orders/shop";
const updateItemPath = (orderId, itemId) => `/orders/${orderId}/items/${itemId}/status`;

const ITEM_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

// Payment is simulated for now. Set to true once payment works, so shops
// can't ship unpaid orders.
const REQUIRE_PAID_TO_UPDATE = false;

const token = localStorage.getItem("token");
if (!token) window.location.href = "../login.html"; // adjust to your login page location

const $ = (id) => document.getElementById(id);
let rows = []; // one entry per item: { order, item }

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
    window.location.href = "../login.html";
  }
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function showMessage(text, isError = true) {
  const box = $("ordersMessage");
  box.textContent = text;
  box.style.color = isError ? "crimson" : "green";
}

function shipTo(order) {
  const a = order.shippingAddress || {};
  return [a.fullName, a.phone, a.address, [a.city, a.state].filter(Boolean).join(", ")]
    .filter(Boolean)
    .map(escapeHTML)
    .join("<br>");
}

function renderRows() {
  if (!rows.length) {
    $("ordersTable").innerHTML =
      `<tr><td colspan="8" style="padding:16px">No orders yet.</td></tr>`;
    return;
  }

  $("ordersTable").innerHTML = rows
    .map(({ order, item }) => {
      const cancelled = order.orderStatus === "cancelled";
      const blockedByPayment =
        REQUIRE_PAID_TO_UPDATE && order.paymentStatus !== "paid";
      const locked = cancelled || blockedByPayment;
      const amount = Number(item.price) * Number(item.quantity);
      const key = `${order._id}:${item._id}`;

      return `
      <tr>
        <td style="padding:12px">#${escapeHTML(String(order._id).slice(-6))}</td>
        <td style="padding:12px">${new Date(order.createdAt).toLocaleDateString()}</td>
        <td style="padding:12px">${shipTo(order)}</td>
        <td style="padding:12px">${escapeHTML(item.name)} x${item.quantity}</td>
        <td style="padding:12px">₦${amount.toLocaleString()}</td>
        <td style="padding:12px">${escapeHTML(order.paymentStatus)}</td>
        <td style="padding:12px">${cancelled ? "cancelled" : escapeHTML(item.status)}</td>
        <td style="padding:12px">
          ${
            locked
              ? `<small>${cancelled ? "Order cancelled" : "Awaiting payment"}</small>`
              : `<select data-select="${key}">
                  ${ITEM_STATUSES.map(
                    (s) => `<option ${s === item.status ? "selected" : ""}>${s}</option>`
                  ).join("")}
                </select>
                <button type="button" data-update="${key}">Update</button>`
          }
        </td>
      </tr>`;
    })
    .join("");
}

async function loadOrders() {
  const { res, data } = await authFetch(MY_ORDERS_PATH);
  if (!res.ok) {
    $("ordersTable").innerHTML =
      `<tr><td colspan="8" style="padding:16px">Could not load orders.</td></tr>`;
    return showMessage(data.message || "Could not load orders.");
  }

  const orders = (Array.isArray(data) ? data : data.orders || []).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Flatten: one row per item. This assumes the backend only sends THIS
  // shop's items in each order (see the note below).
  rows = orders.flatMap((order) =>
    (order.items || []).map((item) => ({ order, item }))
  );
  renderRows();
}

$("ordersTable").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-update]");
  if (!btn) return;

  const key = btn.dataset.update;
  const [orderId, itemId] = key.split(":");
  const status = document.querySelector(`select[data-select="${key}"]`).value;

  btn.disabled = true;
  const { res, data } = await authFetch(updateItemPath(orderId, itemId), {
    method: "PUT", // change to PATCH if your route uses PATCH
    body: JSON.stringify({ status }),
  });
  btn.disabled = false;

  if (!res.ok) return showMessage(data.message || "Could not update the status.");

  showMessage("Item status updated.", false);
  loadOrders();
});

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../login.html";
});

loadOrders();