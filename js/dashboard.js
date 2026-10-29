const MY_SHOP_PATH = "/shops/my-shop";
const MY_ORDERS_PATH = "/orders/shop/incoming";

const PENDING_STATUSES = ["pending", "processing", "shipped"];
const itemAmount = (i) => Number(i.price || 0) * Number(i.quantity || 1);

const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

const $ = (id) => document.getElementById(id);

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

async function authFetch(path) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

// Works whether the API returns [..] or { orders: [..] } / { products: [..] }
const toArray = (data, key) =>
  Array.isArray(data) ? data : data[key] || [];

// ---------- shop status ----------
const STATUS_MESSAGES = {
  pending: {
    title: "Your shop is awaiting approval",
    text: "An admin is reviewing your shop. You can add products once it is approved.",
  },
  approved: null, // nothing to warn about
  rejected: {
    title: "Your shop was not approved",
    text: "Please update your shop details and try again.",
  },
  suspended: {
    title: "Your shop is suspended",
    text: "Customers cannot see your products right now. Contact support for help.",
  },
};

function showShopStatus(shop) {
  if ($("welcomeTitle") && shop.name) {
    $("welcomeTitle").textContent = `Welcome to ${shop.name}!`;
  }

  const info = STATUS_MESSAGES[shop.status];
  const banner = $("shopStatusBanner");
  if (info && banner) {
    $("shopStatusTitle").textContent = info.title;
    // rejectionReason is a guess at your field name
    const reason = shop.rejectionReason ? ` Reason: ${shop.rejectionReason}` : "";
    $("shopStatusText").textContent = info.text + reason;
    banner.hidden = false;
  }

  // Lock "Add a Product" until the shop is approved
  const addLink =
    $("addProductLink") || document.querySelector('.action-card[href="products.html"]');
  if (addLink && shop.status !== "approved") {
    addLink.style.opacity = "0.5";
    addLink.style.pointerEvents = "none";
    addLink.title = "Available once your shop is approved";
  }
}

// ---------- orders ----------
function orderTotal(order) {
  if (order.total != null) return Number(order.total);
  if (order.totalPrice != null) return Number(order.totalPrice);
  return (order.items || []).reduce(
    (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 1),
    0
  );
}

function showOrders(orders) {
  const rows = orders.flatMap((order) =>
    (order.items || []).map((item) => ({ order, item }))
  );

  $("pendingOrders").textContent = rows.filter((r) =>
    PENDING_STATUSES.includes(r.item.status)
  ).length;

  const delivered = rows.filter((r) => r.item.status === "delivered");
  $("completedOrders").textContent = delivered.length;

  // Sales = delivered items (the backend only sends paid orders)
  const sales = delivered.reduce((sum, r) => sum + itemAmount(r.item), 0);
  $("totalSales").textContent = `₦${sales.toLocaleString()}`;

  const message = $("recentOrdersMessage");
  if (!rows.length) return; // keep "No order information" text

  message.hidden = true;
  let list = $("recentOrdersList");
  if (!list) {
    list = document.createElement("div");
    list.id = "recentOrdersList";
    message.after(list);
  }

  const recent = [...rows]
    .sort((a, b) => new Date(b.order.createdAt) - new Date(a.order.createdAt))
    .slice(0, 5);

  list.innerHTML = `
    <table>
      <thead><tr><th>Order</th><th>Date</th><th>Item</th><th>Amount</th><th>Status</th></tr></thead>
      <tbody>
        ${recent
          .map(
            ({ order, item }) => `
          <tr>
            <td>#${escapeHTML(String(order.orderId).slice(-6))}</td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>${escapeHTML(item.name)} x${item.quantity}</td>
            <td>₦${itemAmount(item).toLocaleString()}</td>
            <td>${escapeHTML(item.status)}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
}

// ---------- load everything ----------
async function loadDashboard() {
  // Each request is separate, so one failing doesn't blank the whole page
  const [shopResult, productsResult, ordersResult] = await Promise.all([
    authFetch(MY_SHOP_PATH),
    authFetch("/products/mine"),
    authFetch(MY_ORDERS_PATH),
  ]);

  if (shopResult.res.ok) {
    showShopStatus(shopResult.data.shop || shopResult.data);
  }

  if (productsResult.res.ok) {
    $("totalProducts").textContent = toArray(productsResult.data, "products").length;
  }

  if (ordersResult.res.ok) {
    showOrders(toArray(ordersResult.data, "orders"));
  }
}

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

loadDashboard();