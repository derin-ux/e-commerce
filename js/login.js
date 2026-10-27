const form = document.getElementById("loginForm");
const errorBox = document.getElementById("error");
const submitBtn = form.querySelector("button[type='submit']");

const roleHome = {
  customer: "index.html",
  shopOwner: "shop-dashboard.html",
  admin: "admin.html",
  superAdmin: "admin.html",
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.textContent = "";

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    errorBox.textContent = "Please enter your email and password.";
    return;
  }

  submitBtn.disabled = true; // prevents double-clicking
  submitBtn.textContent = "Logging in...";

  try {
    const data = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    saveSession(data.token, data.user);
    window.location.href = roleHome[data.user.role] || "index.html";
  } catch (err) {
    errorBox.textContent = err.message;
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Log in";
  }
});