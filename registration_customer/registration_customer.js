const loginForm = document.getElementById("customerLoginForm");

loginForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;
  const message = document.getElementById("loginMessage");

  if (!email || !password) {
    message.textContent = "Please enter your email and password.";
    message.style.color = "#c62828";
    return;
  }
  if (password !== confirmPassword) {
    message.textContent = "Passwords do not match.";
    message.style.color = "#c62828";
    return;
  }

  // Authentication will be connected to the Node.js backend.
  message.textContent =
    "Login form is working. Account verification will be connected next.";
  message.style.color = "#078653";
});