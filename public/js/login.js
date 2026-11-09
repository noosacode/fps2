const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");

const loginForm = document.getElementById("login-form");
const loggedInArea = document.getElementById("logged-in-area");

function updateLoginDisplay(isLoggedIn) {
  loginForm.style.display = isLoggedIn ? "none" : "block";
  loggedInArea.style.display = isLoggedIn ? "block" : "none";
}

// Check whether a token already exists when the page loads
updateLoginDisplay(!!localStorage.getItem("token"));

// LOGIN
loginBtn.addEventListener("click", async () => {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    await withLoading(async () => {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        updateLoginDisplay(true);
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        alert("Login successful!");
      } else {
        alert(data.message || "Login failed");
      }
    });
  } catch (err) {
    console.error(err);
    alert("Error connecting to server");
  }
});

// LOGOUT
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  updateLoginDisplay(false);
  alert("Logged out");
});
