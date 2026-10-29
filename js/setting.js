const token = localStorage.getItem("token");
if (!token) window.location.href = "../login.html"; 

const $ = (id) => document.getElementById(id);

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
  $("settingsMessage").textContent = text;
  $("settingsMessage").style.color = isError ? "crimson" : "green";
}

// ---------- status note ----------
const STATUS_NOTES = {
  pending: {
    title: "Your shop is awaiting approval",
    text: "An admin is reviewing your shop.",
  },
  rejected: {
    title: "Your shop was not approved",
    text: "Update the details below and save. Your shop will be sent for review again.",
  },
  suspended: {
    title: "Your shop is suspended",
    text: "Customers cannot see your products right now. Contact support for help.",
  },
};

function showStatus(shop) {
  const note = STATUS_NOTES[shop.status];
  if (!note) {
    $("shopStatusNote").hidden = true;
    return;
  }
  const reasonText =
    shop.status === "suspended" ? shop.suspensionReason : shop.rejectionReason;
  $("shopStatusTitle").textContent = note.title;
  $("shopStatusText").textContent =
    note.text + (reasonText ? ` Reason: ${reasonText}` : "");
  $("shopStatusNote").hidden = false;
}

// ---------- load the shop into the form ----------
async function loadShop() {
  const { res, data } = await authFetch("/shops/my-shop");
  if (!res.ok) {
    return showMessage(data.message || "Could not load your shop.");
  }

  const shop = data.shop || data;
  $("shopName").value = shop.name || "";
  $("description").value = shop.description || "";
  $("email").value = shop.contactEmail || "";
  $("phone").value = shop.contactPhone || "";
  $("city").value = shop.address?.city || "";
  $("state").value = shop.address?.state || "";
  showStatus(shop);
}

// ---------- save ----------
$("settingsForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("");

  const phone = $("phone").value.replace(/\s/g, "");
  if (!/^(\+234|0)[789][01]\d{8}$/.test(phone)) {
    return showMessage("Enter a valid phone number, e.g. 08012345678.");
  }

  $("saveButton").disabled = true;
  const { res, data } = await authFetch("/shops/my-shop", {
    method: "PATCH",
    body: JSON.stringify({
      name: $("shopName").value.trim(),
      description: $("description").value.trim(),
      contactEmail: $("email").value.trim().toLowerCase(),
      contactPhone: phone,
      address: {
        city: $("city").value.trim(),
        state: $("state").value.trim(),
        country: "Nigeria",
      },
    }),
  });
  $("saveButton").disabled = false;

  if (!res.ok) return showMessage(data.message || "Could not save your settings.");

  showMessage("Settings saved.", false);
  showStatus(data.shop || data); // refreshes the banner (e.g. rejected → pending)
});

$("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "../login.html";
});

loadShop();