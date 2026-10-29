const REGISTER_PATH = "/auth/register";
const LOGIN_PATH = "/auth/login";
const SHOPS_PATH = "/shops";

const $ = (id) => document.getElementById(id);
const form = $("sellerRegisterForm");

// ---------- show / hide password ----------
document.querySelectorAll(".toggle-password").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = $(btn.dataset.toggle);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    btn.textContent = showing ? "Show" : "Hide";
  });
});

// ---------- validation ----------
function setError(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function clearErrors() {
  document.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  showMessage("");
}

function showMessage(text, isError = true) {
  $("registerMessage").textContent = text;
  $("registerMessage").style.color = isError ? "crimson" : "green";
}

function validate(values) {
  let ok = true;
  const fail = (id, text) => {
    setError(id, text);
    ok = false;
  };

  if (values.ownerName.length < 2) fail("ownerNameError", "Enter your full name.");
  if (values.shopName.length < 2) fail("shopNameError", "Enter your shop name.");

  if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    fail("sellerEmailError", "Enter a valid email address.");
  }

  // Nigerian numbers: 08012345678 or +2348012345678
  if (!/^(\+234|0)[789][01]\d{8}$/.test(values.phone.replace(/\s/g, ""))) {
    fail("sellerPhoneError", "Enter a valid phone number, e.g. 08012345678.");
  }

  const pw = values.password;
  if (
    pw.length < 8 ||
    !/[a-z]/.test(pw) ||
    !/[A-Z]/.test(pw) ||
    !/\d/.test(pw) ||
    !/[^A-Za-z0-9]/.test(pw)
  ) {
    fail(
      "sellerPasswordError",
      "Use at least 8 characters with uppercase, lowercase, a number and a symbol."
    );
  }

  if (values.confirmPassword !== pw) {
    fail("confirmPasswordError", "Passwords do not match.");
  }

  if (!values.terms) fail("sellerTermsError", "You must accept the Seller Terms.");

  return ok;
}

// ---------- submit ----------
async function postJSON(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();

  const values = {
    ownerName: $("ownerName").value.trim(),
    shopName: $("shopName").value.trim(),
    email: $("sellerEmail").value.trim().toLowerCase(),
    phone: $("sellerPhone").value.trim(),
    description: $("shopDescription") ? $("shopDescription").value.trim() : "",
    password: $("sellerPassword").value,
    confirmPassword: $("confirmPassword").value,
    terms: $("sellerTerms").checked,
  };

  if (!validate(values)) return;

  $("registerButton").disabled = true;
  $("registerButton").textContent = "Creating your account...";

  try {
    // Step 1: create the user account
    let step1 = await postJSON(REGISTER_PATH, {
      name: values.ownerName,
      email: values.email,
      password: values.password,
      role: "shopOwner",
    });

    // Email already used: this may be an earlier signup that never got its
    // shop. Try logging in with the same details and carry on to step 2.
    if (step1.res.status === 409) {
      step1 = await postJSON(LOGIN_PATH, {
        email: values.email,
        password: values.password,
      });
      if (!step1.res.ok) {
        showMessage("This email is already registered. Please log in instead.");
        return;
      }
    } else if (!step1.res.ok) {
      showMessage(step1.data.message || "Could not create your account.");
      return;
    }

    const token = step1.data.token;
    if (!token) {
      showMessage("Account created. Please log in to finish setting up your shop.");
      return;
    }

    // Step 2: create the shop, using the account's token
    const step2 = await postJSON(
      SHOPS_PATH,
      {
        name: values.shopName,
        description: values.description,
        contactEmail: values.email,
        contactPhone: values.phone,
      },
      token
    );

    if (!step2.res.ok) {
      showMessage(
        "Your account was created, but the shop could not be saved: " +
          (step2.data.message || "unknown error") +
          ". Fix the problem (for example, choose a different shop name) and submit again."
      );
      return;
    }

    localStorage.setItem("token", token);
    showMessage("Shop created! It is awaiting approval. Redirecting...", false);
    setTimeout(() => (window.location.href = "dashboard.html"), 1200);
  } catch (err) {
    showMessage("Could not reach the server. Try again.");
  } finally {
    $("registerButton").disabled = false;
    $("registerButton").textContent = "Create Seller Account";
  }
});