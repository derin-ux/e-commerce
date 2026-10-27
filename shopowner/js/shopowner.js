
   //STYLEHUB - SHOP OWNER AUTH FORMS /

// Show or hide a password.
document.querySelectorAll("[data-toggle]").forEach(button => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.toggle);

    if (!input) return;

    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    button.textContent = isHidden ? "Hide" : "Show";
  });
});

// Display an error beside a field.
function showError(fieldId, message) {
  const error = document.getElementById(fieldId + "Error");

  if (error) {
    error.textContent = message;
  }

  const field = document.getElementById(fieldId);

  if (field) {
    field.setAttribute("aria-invalid", message ? "true" : "false");
  }
}

// Clear validation messages.
function clearErrors(form) {
  form.querySelectorAll(".field-error").forEach(error => {
    error.textContent = "";
  });

  form.querySelectorAll("[aria-invalid]").forEach(field => {
    field.removeAttribute("aria-invalid");
  });

  const message = form.querySelector(".form-message");

  if (message) {
    message.textContent = "";
    message.className = "form-message";
  }
}

// Check email format.
function validEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Accept common international phone number formats.
function validPhone(phone) {
  const cleaned = phone.replace(/[\s()-]/g, "");
  return /^\+?\d{10,15}$/.test(cleaned);
}

// Password requirements:
// 8+ characters, uppercase, lowercase, number, special character.
function validPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

// Show a form-level message.
function showMessage(form, message, type) {
  const output = form.querySelector(".form-message");

  if (!output) return;

  output.textContent = message;
  output.className = "form-message " + type;
}


// SHOP OWNER REGISTRATION


const registerForm = document.getElementById("sellerRegisterForm");

if (registerForm) {
  registerForm.addEventListener("submit", event => {
    event.preventDefault();
    clearErrors(registerForm);

    const ownerName = document.getElementById("ownerName").value.trim();
    const shopName = document.getElementById("shopName").value.trim();
    const email = document.getElementById("sellerEmail").value.trim();
    const phone = document.getElementById("sellerPhone").value.trim();
    const category = document.getElementById("shopCategory").value;
    const password = document.getElementById("sellerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const termsAccepted = document.getElementById("sellerTerms").checked;

    let valid = true;

    if (ownerName.length < 2) {
      showError("ownerName", "Enter your full name.");
      valid = false;
    }

    if (shopName.length < 2) {
      showError("shopName", "Enter a valid shop name.");
      valid = false;
    }

    if (!validEmail(email)) {
      showError("sellerEmail", "Enter a valid email address.");
      valid = false;
    }

    if (!validPhone(phone)) {
      showError("sellerPhone", "Enter a valid phone number.");
      valid = false;
    }

    if (!category) {
      showError("shopCategory", "Select your main product category.");
      valid = false;
    }

    if (!validPassword(password)) {
      showError(
        "sellerPassword",
        "Use 8+ characters with uppercase, lowercase, a number and a special character."
      );
      valid = false;
    }

    if (!confirmPassword) {
      showError("confirmPassword", "Please confirm your password.");
      valid = false;
    } else if (password !== confirmPassword) {
      showError("confirmPassword", "The passwords do not match.");
      valid = false;
    }

    if (!termsAccepted) {
      showError("sellerTerms", "You must accept the seller terms.");
      valid = false;
    }

    if (!valid) {
      showMessage(
        registerForm,
        "Please correct the highlighted fields.",
        "error"
      );
      return;
    }

    showMessage(
      registerForm,
      "Validation successful! The registration form is ready for backend integration. No account has been created yet.",
      "success"
    );

    // Do not store passwords in browser storage.
    // We will submit the data securely to the backend in a later step.
  });
}


// SHOP OWNER LOGIN


const loginForm = document.getElementById("sellerLoginForm");

if (loginForm) {
  loginForm.addEventListener("submit", event => {
    event.preventDefault();
    clearErrors(loginForm);

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    let valid = true;

    if (!email) {
      showError("loginEmail", "Enter your email address.");
      valid = false;
    } else if (!validEmail(email)) {
      showError("loginEmail", "Enter a valid email address.");
      valid = false;
    }

    if (!password) {
      showError("loginPassword", "Enter your password.");
      valid = false;
    }

    if (!valid) {
      showMessage(
        loginForm,
        "Please correct the highlighted fields.",
        "error"
      );
      return;
    }

    showMessage(
      loginForm,
      "Your details have passed basic validation. Login will work after we connect the backend.",
      "success"
    );
  });
}


// DEMO FORGOT-PASSWORD MESSAGE


const forgotLink = document.getElementById("forgotPasswordLink");

if (forgotLink) {
  forgotLink.addEventListener("click", event => {
    event.preventDefault();

    showMessage(
      loginForm,
      "Password recovery is not available yet. We will add it when the backend is ready.",
      "error"
    );
  });
}