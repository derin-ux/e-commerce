const token = localStorage.getItem("token");
if (!token) window.location.href = "login.html";

const $ = (id) => document.getElementById(id);
let products = [];

const SUBCATEGORIES = {
  Men: ["Shirts", "Trousers", "Native Wear", "Suits", "T-Shirts"],
  Women: ["Dresses", "Tops", "Skirts", "Native Wear", "Jeans"],
  Shoes: ["Sneakers", "Heels", "Sandals", "Formal Shoes"],
  Bags: ["Handbags", "Backpacks", "Clutches"],
  Accessories: ["Watches", "Jewellery", "Belts", "Caps"],
  Sportswear: ["Jerseys", "Tracksuits", "Gym Wear"],
  Kids: ["Boys", "Girls", "Babies"],
};

// ---------- helpers ----------
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
    window.location.href = "login.html";
  }
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function showMessage(text, isError = true) {
  $("formMessage").textContent = text;
  $("formMessage").style.color = isError ? "crimson" : "green";
}

// Shrinks the photo and turns it into text (a data URL) so it can travel in JSON
function imageToDataURL(file, maxSize = 800) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

const splitList = (text) =>
  text.split(",").map((s) => s.trim()).filter(Boolean);

// ---------- table + stats ----------
function renderProducts() {
  const term = $("productSearch").value.trim().toLowerCase();
  const shown = products.filter((p) => p.name.toLowerCase().includes(term));

  $("totalProducts").textContent = products.length;
  $("publishedProducts").textContent = products.filter((p) => p.quantity > 0).length;
  $("pendingProducts").textContent = products.filter((p) => p.quantity === 0).length;

  $("emptyProducts").hidden = shown.length > 0;

  $("productTableBody").innerHTML = shown
    .map(
      (p) => `
      <tr>
        <td>${escapeHTML(p.name)}</td>
        <td>${escapeHTML(p.category)}${p.subcategory ? " / " + escapeHTML(p.subcategory) : ""}</td>
        <td>₦${Number(p.price).toLocaleString()}</td>
        <td>${p.quantity}</td>
        <td>${p.quantity > 0 ? "In stock" : "Out of stock"}</td>
        <td>
          <button type="button" data-action="edit" data-id="${p._id}">Edit</button>
          <button type="button" data-action="delete" data-id="${p._id}">Delete</button>
        </td>
      </tr>`
    )
    .join("");
}

async function loadProducts() {
  const { res, data } = await authFetch("/products/mine");
  if (!res.ok) {
    $("emptyProducts").hidden = false;
    $("emptyProducts").textContent = data.message || "Could not load products.";
    return;
  }
  products = data;
  renderProducts();
}

// ---------- form open/close ----------
function fillSubcategories(category, selected = "") {
  const options = SUBCATEGORIES[category] || [];
  $("productSubcategory").innerHTML =
    `<option value="">${category ? "Select subcategory" : "Select a category first"}</option>` +
    options.map((s) => `<option ${s === selected ? "selected" : ""}>${s}</option>`).join("");
}

function openForm(product = null) {
  $("productForm").reset();
  $("imagePreview").hidden = true;
  showMessage("");
  fillSubcategories("");

  if (product) {
    $("formTitle").textContent = "Edit Product";
    $("productId").value = product._id;
    $("productName").value = product.name;
    $("productCategory").value = product.category;
    fillSubcategories(product.category, product.subcategory);
    $("productPrice").value = product.price;
    $("productStock").value = product.quantity;
    $("productSizes").value = (product.sizes || []).join(", ");
    $("productColors").value = (product.colors || []).join(", ");
    $("productDescription").value = product.description;
    $("productImage").required = false; // keep the old photo unless they pick a new one
    if (product.images && product.images[0]) {
      $("imagePreview").src = product.images[0];
      $("imagePreview").hidden = false;
    }
  } else {
    $("formTitle").textContent = "Add a Product";
    $("productId").value = "";
    $("productImage").required = true;
  }

  $("productFormSection").hidden = false;
  $("productFormSection").scrollIntoView({ behavior: "smooth" });
}

function closeForm() {
  $("productFormSection").hidden = true;
}

// ---------- events ----------
$("showProductForm").addEventListener("click", () => openForm());
$("cancelForm").addEventListener("click", closeForm);
$("cancelFormBottom").addEventListener("click", closeForm);
$("productSearch").addEventListener("input", renderProducts);
$("productCategory").addEventListener("change", (e) => fillSubcategories(e.target.value));

$("productImage").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024) {
    showMessage("Image must be 5 MB or less.");
    e.target.value = "";
    return;
  }
  $("imagePreview").src = URL.createObjectURL(file);
  $("imagePreview").hidden = false;
});

$("productForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  showMessage("");

  const id = $("productId").value;
  const body = {
    name: $("productName").value.trim(),
    description: $("productDescription").value.trim(),
    price: Number($("productPrice").value),
    quantity: Number($("productStock").value),
    category: $("productCategory").value,
    subcategory: $("productSubcategory").value,
    sizes: splitList($("productSizes").value),
    colors: splitList($("productColors").value),
  };

  const file = $("productImage").files[0];
  if (file) {
    try {
      body.images = [await imageToDataURL(file)];
    } catch {
      return showMessage("Could not read that image. Try another one.");
    }
  }

  $("saveProductButton").disabled = true;
  const { res, data } = await authFetch(id ? `/products/${id}` : "/products", {
    method: id ? "PUT" : "POST", // change PUT to PATCH if your update route uses PATCH
    body: JSON.stringify(body),
  });
  $("saveProductButton").disabled = false;

  if (!res.ok) return showMessage(data.message || "Could not save the product.");

  closeForm();
  loadProducts();
});

// One listener on the table handles every Edit/Delete button (even ones added later)
$("productTableBody").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const product = products.find((p) => p._id === btn.dataset.id);

  if (btn.dataset.action === "edit") openForm(product);

  if (btn.dataset.action === "delete") {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    const { res, data } = await authFetch(`/products/${product._id}`, { method: "DELETE" });
    if (!res.ok) return alert(data.message || "Could not delete the product.");
    loadProducts();
  }
});

loadProducts();