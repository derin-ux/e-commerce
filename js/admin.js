const token = localStorage.getItem("token");
const $ = (id) => document.getElementById(id);
const logoutBtn = document.getElementById("logoutBtn");

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
});

function goToLogin() {
  localStorage.removeItem("token");
  window.location.href = "../login.html"; // adjust to where your login page is
}

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
  if (res.status === 401) goToLogin();
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function setMessage(id, text, isError = true) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "crimson" : "green";
}

// ---------- who is logged in ----------
function showProfile(user) {
  const isSuper = user.role === "superAdmin";

  $("adminName").textContent = user.name;
  $("adminRole").textContent = isSuper ? "Super Admin" : "Admin";
  document.querySelector(".avatar").textContent = (user.name || "A")[0].toUpperCase();

  // Only a super admin sees admin management (the server enforces this too)
  const link = $("adminManagementLink");
  if (isSuper) {
    link.href = "#createAdminSection"; // admins.html doesn't exist yet
    $("createAdminSection").hidden = false;
  } else {
    link.hidden = true;
  }
}

// ---------- pending shops ----------
async function loadPendingShops() {
  const { res, data } = await authFetch("/shops/pending");
  if (!res.ok) {
    $("pendingShopsTable").innerHTML =
      `<tr><td colspan="5" class="empty-state">Could not load shops.</td></tr>`;
    return setMessage("adminMessage", data.message || "Could not load pending shops.");
  }

  const shops = data.shops || [];
  $("pendingShopCount").textContent = shops.length;

  if (!shops.length) {
    $("pendingShopsTable").innerHTML =
      `<tr><td colspan="5" class="empty-state">No shops waiting for approval.</td></tr>`;
    return;
  }

  $("pendingShopsTable").innerHTML = shops
    .map(
      (s) => `
      <tr>
        <td>${escapeHTML(s.name)}</td>
        <td>${escapeHTML(s.owner?.name || "")}<br><small>${escapeHTML(s.owner?.email || "")}</small></td>
        <td>${escapeHTML(s.contactPhone || "")}<br><small>${escapeHTML(s.contactEmail || "")}</small></td>
        <td>${new Date(s.createdAt).toLocaleDateString()}</td>
        <td>
          <button type="button" data-action="approve" data-id="${s._id}">Approve</button>
          <button type="button" data-action="reject" data-id="${s._id}">Reject</button>
        </td>
      </tr>`
    )
    .join("");
}

$("pendingShopsTable").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = btn.dataset.id;
  setMessage("adminMessage", "");
  let result;

  if (btn.dataset.action === "approve") {
    if (!confirm("Approve this shop? Its products will become visible to customers.")) return;
    btn.disabled = true;
    result = await authFetch(`/shops/${id}/approve`, { method: "PATCH" });
  } else {
    // The backend requires a reason, so ask for one
    const reason = prompt("Why is this shop being rejected? The owner will see this.");
    if (!reason || !reason.trim()) return;
    btn.disabled = true;
    result = await authFetch(`/shops/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason: reason.trim() }),
    });
  }

  if (!result.res.ok) {
    btn.disabled = false;
    return setMessage("adminMessage", result.data.message || "Action failed.");
  }

  setMessage("adminMessage", result.data.message || "Done.", false);
  loadPendingShops();
});

// ---------- create admin (super admin only) ----------
$("createAdminForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  setMessage("createAdminMessage", "");

  const { res, data } = await authFetch("/auth/admins", {
    method: "POST",
    body: JSON.stringify({
      name: $("newAdminName").value.trim(),
      email: $("newAdminEmail").value.trim().toLowerCase(),
      password: $("newAdminPassword").value,
    }),
  });

  if (!res.ok) {
    return setMessage("createAdminMessage", data.message || "Could not create the admin.");
  }

  setMessage("createAdminMessage", `Admin ${data.user.email} created.`, false);
  $("createAdminForm").reset();
});

$("logoutBtn").addEventListener("click", goToLogin);

// ---------- start ----------
async function init() {
  if (!token) return goToLogin();

  const { res, data } = await authFetch("/auth/me");
  if (!res.ok || !["admin", "superAdmin"].includes(data.role)) return goToLogin();

  showProfile(data);
  loadPendingShops();
}

init();