// Authentication helpers

// API helpers

// UI helpers

// Formatting helpers

function handleAuthFailure(response) {
  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/";
    return true;
  }

  return false;
}