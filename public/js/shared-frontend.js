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

// Loading message - See ms notes doc.
async function withLoading(task) {
  const loading = document.getElementById("loading");
  loading.style.display = "block";
  try {
    await task();
  } finally {
    loading.style.display = "none";
  }
}
