const form = document.getElementById("find-tree-form");
const tagInput = document.getElementById("tag");
const message = document.getElementById("message");
const normaliseTag = (value) => value.trim().toLowerCase();
const isValidTag = (tag) => /^(?:[1-9]\d{2}|\d+[a-z]+)$/.test(tag);
form.addEventListener("submit", async (event) => {
  event.preventDefault(); const tag = normaliseTag(tagInput.value); message.textContent = "";
  if (!isValidTag(tag)) { message.textContent = "Enter a three-digit tag (101–999) or digits followed by letters, such as 12w."; return; }
  try {
    const response = await fetch(`/api/trees/${encodeURIComponent(tag)}`, { headers: { Authorization: localStorage.getItem("token") } });
    if (response.ok) { window.location.href = `/tree-data/tree-view.html?tag=${encodeURIComponent(tag)}`; return; }
    if (response.status === 404) { window.location.href = `/forms/add-tree.html?tag=${encodeURIComponent(tag)}`; return; }
    const data = await response.json().catch(() => ({})); message.textContent = data.message || "Unable to search for that tree.";
  } catch { message.textContent = "Unable to connect to the server."; }
});
