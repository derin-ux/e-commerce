/* ==========================================
   STYLEHUB - SHOP OWNER PRODUCT MANAGEMENT
   Frontend demonstration only
========================================== */

const STORAGE_KEY = "stylehub_seller_products_demo";

const subcategories = {
  Men: ["Shirts", "Trousers", "Jackets", "Jeans", "Traditional Wear"],
  Women: ["Dresses", "Tops", "Skirts", "Jeans", "Traditional Wear"],
  Shoes: ["Sneakers", "Heels", "Sandals", "Loafers", "Boots"],
  Bags: ["Handbags", "Backpacks", "Tote Bags", "Travel Bags"],
  Accessories: ["Watches", "Sunglasses", "Jewelry", "Belts", "Hats"],
  Sportswear: ["Tracksuits", "Leggings", "Sports Tops", "Gym Wear"],
  Kids: ["Boys' Clothing", "Girls' Clothing", "Kids' Shoes", "Baby Wear"]
};

const form = document.getElementById("productForm");
const formSection = document.getElementById("productFormSection");
const categorySelect = document.getElementById("productCategory");
const subcategorySelect = document.getElementById("productSubcategory");
const imageInput = document.getElementById("productImage");
const imagePreview = document.getElementById("imagePreview");
const tableBody = document.getElementById("productTableBody");
const searchInput = document.getElementById("productSearch");
const formMessage = document.getElementById("formMessage");

let products = loadProducts();
let imageData = "";
let editingId = null;

// Read demo data safely.
function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Save demo data in this browser.
function saveProducts() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    return true;
  } catch {
    setMessage(
      "Browser storage is full. Try a smaller image. Real image storage will use the backend.",
      "error"
    );
    return false;
  }
}

function setMessage(message, type = "") {
  formMessage.textContent = message;
  formMessage.className = "form-message " + type;
}

function formatPrice(price) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0
  }).format(price);
}

// Safely create text elements instead of inserting user data as HTML.
function createTextElement(tag, text, className) {
  const element = document.createElement(tag);
  element.textContent = text;

  if (className) {
    element.className = className;
  }

  return element;
}

function createActionButton(label, className, callback) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.className = className;
  button.addEventListener("click", callback);
  return button;
}

// Update subcategories when the main category changes.
function updateSubcategories(selected = "") {
  const category = categorySelect.value;
  subcategorySelect.replaceChildren();

  const placeholder = new Option(
    category ? "Select subcategory" : "Select a category first",
    ""
  );

  subcategorySelect.add(placeholder);

  (subcategories[category] || []).forEach(name => {
    subcategorySelect.add(new Option(name, name));
  });

  subcategorySelect.value = selected;
}

categorySelect.addEventListener("change", () => {
  updateSubcategories();
});

// Show the selected image before saving.
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];

  imageData = "";
  imagePreview.removeAttribute("src");
  imagePreview.hidden = true;

  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    setMessage("Choose a JPG, PNG or WebP image.", "error");
    imageInput.value = "";
    return;
  }

  // Keep demo images small to avoid filling browser storage.
  if (file.size > 1024 * 1024) {
    setMessage(
      "For this demo, choose an image smaller than 1 MB.",
      "error"
    );
    imageInput.value = "";
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    imageData = reader.result;
    imagePreview.src = imageData;
    imagePreview.hidden = false;
    setMessage("Image ready to use.", "success");
  };

  reader.onerror = () => {
    setMessage("Could not read this image. Please try another.", "error");
  };

  reader.readAsDataURL(file);
});

// Open a clean form for adding a product.
function openNewProductForm() {
  form.reset();
  editingId = null;
  imageData = "";
  imagePreview.removeAttribute("src");
  imagePreview.hidden = true;

  document.getElementById("productId").value = "";
  document.getElementById("formTitle").textContent = "Add a Product";
  document.getElementById("saveProductButton").textContent = "Save Product";
  imageInput.required = true;

  updateSubcategories();
  setMessage("");

  formSection.hidden = false;
  formSection.scrollIntoView({ behavior: "smooth" });
}

function closeProductForm() {
  formSection.hidden = true;
  form.reset();
  imageData = "";
  editingId = null;
  imagePreview.removeAttribute("src");
  imagePreview.hidden = true;
  setMessage("");
}

document.getElementById("showProductForm")
  .addEventListener("click", openNewProductForm);

document.getElementById("cancelForm")
  .addEventListener("click", closeProductForm);

document.getElementById("cancelFormBottom")
  .addEventListener("click", closeProductForm);

// Validate and save a new or edited product.
form.addEventListener("submit", event => {
  event.preventDefault();
  setMessage("");

  const name = document.getElementById("productName").value.trim();
  const category = categorySelect.value;
  const subcategory = subcategorySelect.value;
  const price = Number(document.getElementById("productPrice").value);
  const stock = Number(document.getElementById("productStock").value);
  const sizes = document.getElementById("productSizes").value.trim();
  const colors = document.getElementById("productColors").value.trim();
  const description = document.getElementById("productDescription").value.trim();

  if (!name || !category || !subcategory || !description) {
    setMessage("Complete all required fields.", "error");
    return;
  }

  if (!Number.isFinite(price) || price <= 0 || price > 100000000) {
    setMessage("Enter a valid product price.", "error");
    return;
  }

  if (!Number.isInteger(stock) || stock < 0 || stock > 1000000) {
    setMessage("Enter a valid whole-number stock quantity.", "error");
    return;
  }

  if (!editingId && !imageData) {
    setMessage("Please choose a product photo.", "error");
    return;
  }

  const existing = products.find(product => product.id === editingId);

  const product = {
    id: editingId || (
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : String(Date.now()) + Math.random().toString(16).slice(2)
    ),
    name,
    category,
    subcategory,
    price,
    stock,
    sizes: sizes.split(",").map(s => s.trim()).filter(Boolean),
    colors: colors.split(",").map(c => c.trim()).filter(Boolean),
    description,
    image: imageData || existing?.image || "",
    // Sellers cannot approve their own products.
    status: existing?.status || "Pending Review",
    updatedAt: new Date().toISOString()
  };

  const previousProducts = [...products];

  if (editingId) {
    products = products.map(item =>
      item.id === editingId ? product : item
    );
  } else {
    products.unshift(product);
  }

  if (!saveProducts()) {
    products = previousProducts;
    return;
  }

  renderProducts();
  closeProductForm();
});

// Render the catalogue.
function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();

  const visibleProducts = products.filter(product =>
    [
      product.name,
      product.category,
      product.subcategory
    ].some(value => value.toLowerCase().includes(query))
  );

  tableBody.replaceChildren();

  visibleProducts.forEach(product => {
    const row = document.createElement("tr");

    const productCell = document.createElement("td");
    const productInfo = document.createElement("div");
    productInfo.className = "product-cell";

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.name;

    const productName = createTextElement("strong", product.name);

    productInfo.append(image, productName);
    productCell.append(productInfo);

    const categoryCell = createTextElement(
      "td",
      `${product.category} / ${product.subcategory}`
    );

    const priceCell = createTextElement("td", formatPrice(product.price));
    const stockCell = createTextElement("td", String(product.stock));

    const statusCell = document.createElement("td");
    const status = createTextElement(
      "span",
      product.status,
      "status" + (product.status === "Published" ? " published" : "")
    );
    statusCell.append(status);

    const actionCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "action-buttons";

    actions.append(
      createActionButton("Edit", "", () => editProduct(product.id)),
      createActionButton("Delete", "delete-button", () => deleteProduct(product.id))
    );

    actionCell.append(actions);

    row.append(
      productCell,
      categoryCell,
      priceCell,
      stockCell,
      statusCell,
      actionCell
    );

    tableBody.append(row);
  });

  document.getElementById("totalProducts").textContent = products.length;

  document.getElementById("publishedProducts").textContent =
    products.filter(item => item.status === "Published").length;

  document.getElementById("pendingProducts").textContent =
    products.filter(item => item.status === "Pending Review").length;

  document.getElementById("emptyProducts").hidden = products.length > 0;
}

function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  editingId = id;
  imageData = product.image;

  document.getElementById("productId").value = id;
  document.getElementById("productName").value = product.name;
  categorySelect.value = product.category;
  updateSubcategories(product.subcategory);

  document.getElementById("productPrice").value = product.price;
  document.getElementById("productStock").value = product.stock;
  document.getElementById("productSizes").value = product.sizes.join(", ");
  document.getElementById("productColors").value = product.colors.join(", ");
  document.getElementById("productDescription").value = product.description;

  imagePreview.src = product.image;
  imagePreview.hidden = !product.image;

  document.getElementById("formTitle").textContent = "Edit Product";
  document.getElementById("saveProductButton").textContent = "Update Product";

  // A new image is optional when editing.
  imageInput.required = false;
  imageInput.value = "";

  setMessage(
    `Current status: ${product.status}. Editing does not approve the product.`,
    ""
  );

  formSection.hidden = false;
  formSection.scrollIntoView({ behavior: "smooth" });
}

function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (!window.confirm(`Delete "${product.name}" from this demo catalogue?`)) {
    return;
  }

  const previousProducts = [...products];
  products = products.filter(item => item.id !== id);

  if (!saveProducts()) {
    products = previousProducts;
    return;
  }

  renderProducts();
}

searchInput.addEventListener("input", renderProducts);

// Initial display.
updateSubcategories();
renderProducts();