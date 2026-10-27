document.addEventListener("DOMContentLoaded", function () {
  const storageKey = "stylehubShopOrders";
  const table = document.getElementById("ordersTable");

  function renderOrders() {
    const orders = JSON.parse(localStorage.getItem(storageKey)) || [];

    table.replaceChildren();

    if (orders.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");

      cell.colSpan = 5;
      cell.style.padding = "16px";
      cell.textContent = "No orders yet.";

      row.appendChild(cell);
      table.appendChild(row);
      return;
    }

    orders.forEach((order, index) => {
      const row = document.createElement("tr");

      [
        order.id || `ORD-${index + 1}`,
        order.customer || "Customer",
        `₦${Number(order.amount || 0).toLocaleString("en-NG")}`
      ].forEach(value => {
        const cell = document.createElement("td");
        cell.style.padding = "12px";
        cell.textContent = value;
        row.appendChild(cell);
      });

      const statusCell = document.createElement("td");
      statusCell.style.padding = "12px";
      statusCell.textContent = order.status || "Pending";
      row.appendChild(statusCell);

      const actionCell = document.createElement("td");
      actionCell.style.padding = "12px";

      const select = document.createElement("select");

      ["Pending", "Processing", "Shipped", "Completed", "Cancelled"]
        .forEach(status => {
          const option = document.createElement("option");
          option.value = status;
          option.textContent = status;
          select.appendChild(option);
        });

      select.value = order.status || "Pending";

      select.addEventListener("change", function () {
        const latestOrders =
          JSON.parse(localStorage.getItem(storageKey)) || [];

        if (!latestOrders[index]) return;

        latestOrders[index].status = select.value;
        localStorage.setItem(storageKey, JSON.stringify(latestOrders));
        renderOrders();
      });

      actionCell.appendChild(select);
      row.appendChild(actionCell);
      table.appendChild(row);
    });
  }

  document.getElementById("logoutBtn").addEventListener("click", function () {
    if (confirm("Are you sure you want to log out?")) {
      localStorage.removeItem("stylehubShopLoggedIn");
      window.location.href = "login.html";
    }
  });

  renderOrders();
});