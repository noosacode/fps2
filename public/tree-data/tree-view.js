const viewParams = new URLSearchParams(window.location.search);
const viewTag = viewParams.get("tag"); const viewMessage = document.getElementById("message"); const table = document.getElementById("tree-data"); const actions = document.getElementById("actions");
const fields = [["Tag", "tag"], ["Position", "position"], ["Colour", "colour"], ["WooCommerce status", "wcStatus"], ["WooCommerce last changed", "wcLastChanged", "date"], ["Sell score", "sellScore"], ["Bag size", "bagSize"], ["Price", "price"], ["Photo quality", "photoQuality"], ["Best photo date", "bestPhotoDate", "date"], ["Recent photo date", "recentPhotoDate", "date"], ["Transport size", "transportSize"], ["Relative size", "relativeSize"], ["Soil percent", "soilPercent"], ["Date added", "dateAdded", "date"], ["Notes", "notes"]];
function displayValue(value, type) { if (value === null || value === undefined || value === "") return "—"; return type === "date" ? new Date(value).toLocaleDateString() : String(value); }
async function loadTree() {
  if (!viewTag) { viewMessage.textContent = "No tree tag was supplied."; return; }
  try {
    const response = await fetch(`/api/trees/${encodeURIComponent(viewTag)}`, { headers: { Authorization: localStorage.getItem("token") } }); const tree = await response.json();
    if (!response.ok) { viewMessage.textContent = tree.message || "Unable to load this tree."; return; }
    const body = table.querySelector("tbody"); fields.forEach(([label, key, type]) => { const row = document.createElement("tr"); const heading = document.createElement("th"); const value = document.createElement("td"); heading.textContent = label; value.textContent = displayValue(tree[key], type); row.append(heading, value); body.appendChild(row); });
    document.getElementById("update-link").href = `/forms/edit-tree.html?mode=update&tag=${encodeURIComponent(tree.tag)}`; table.hidden = false; actions.hidden = false;
  } catch { viewMessage.textContent = "Unable to connect to the server."; }
}
loadTree();
