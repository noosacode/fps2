const logoutBtn = document.getElementById("logout-btn");

if (localStorage.getItem("token")) {
  logoutBtn.style.display = "inline-block";
}

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("token");
  alert("Logged out");
  window.location.href = "/";
});
