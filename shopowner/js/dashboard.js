document.addEventListener("DOMContentLoaded", function () {
  // Demo product data saved by the product listing page.
  const products =
    JSON.parse(localStorage.getItem("stylehubShopProducts")) || [];

  // Demo order data. We will replace this with real orders later.
  const orders =
    JSON.parse(localStorage.getItem("stylehubShopOrders")) || [];

  const pending = orders.filter(
    order => order.status === "Pending"
  );

  const completed = orders.filter(
    order => order.status === "Completed"
  );

  const totalSales = completed.reduce(
    (sum, order) => sum + Number(order.amount || 0),
    0
  );

  document.getElementById("totalProducts").textContent =
    products.length;

  document.getElementById("pendingOrders").textContent =
    pending.length;

  document.getElementById("completedOrders").textContent =
    completed.length;

  document.getElementById("totalSales").textContent =
    totalSales.toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0
    });

  const recentOrdersMessage =
    document.getElementById("recentOrdersMessage");

  if (orders.length > 0) {
    recentOrdersMessage.textContent =
      `${orders.length} demo order(s) recorded. Open Orders to review them.`;
  }

  document.getElementById("logoutBtn").addEventListener(
    "click",
    function () {
      const confirmLogout = confirm("Are you sure you want to log out?");

      if (confirmLogout) {
        // Clear only the demo login marker.
        // Do not delete products, orders, or shop settings.
        localStorage.removeItem("stylehubShopLoggedIn");

        window.location.href = "login.html";
      }
    }
  );
});