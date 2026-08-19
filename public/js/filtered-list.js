const searchForm = document.getElementById("searchForm");
const results = document.getElementById("results");

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
  })[character]);
}

function displayValue(value) {
  return value === undefined || value === null || value === "" ? "—" : escapeHtml(value);
}

async function searchTrees(event) {
  event.preventDefault();
  const parameters = new URLSearchParams(new FormData(searchForm));

  for (const [key, value] of parameters.entries()) {
    if (!value.trim()) parameters.delete(key);
  }

  results.innerHTML = "<p>Searching…</p>";

  try {
    const response = await fetch(`/api/trees/search?${parameters}`, {
      headers: { Authorization: localStorage.getItem("token") },
    });
    const trees = await response.json();

    if (!response.ok) throw new Error(trees.error || "Unable to search for trees.");

    if (!trees.length) {
      results.innerHTML = "<p>No trees match those filters.</p>";
      return;
    }

    results.innerHTML = `
      <h2>${trees.length} tree${trees.length === 1 ? "" : "s"} found</h2>
      <table class="job-list">
        <thead><tr><th>Tag</th><th>Position</th><th>Colour</th><th>WC Status</th><th>Sell Score</th><th>Bag Size</th></tr></thead>
        <tbody>${trees.map((tree) => `<tr>
          <td><a href="/forms/tree.html?tag=${encodeURIComponent(tree.tag)}">${escapeHtml(tree.tag)}</a></td>
          <td>${displayValue(tree.position)}</td><td>${displayValue(tree.colour)}</td>
          <td>${displayValue(tree.wcStatus)}</td><td>${displayValue(tree.sellScore)}</td>
          <td>${displayValue(tree.bagSize)}</td>
        </tr>`).join("")}</tbody>
      </table>`;
  } catch (error) {
    results.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

searchForm.addEventListener("submit", searchTrees);
document.getElementById("clearButton").addEventListener("click", () => {
  results.innerHTML = "";
});
