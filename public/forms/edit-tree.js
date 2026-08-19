const editParams = new URLSearchParams(window.location.search);
const editTag = editParams.get("tag");
const mode = editParams.get("mode");
const editForm = document.getElementById("tree-form");
const editMessage = document.getElementById("message");
let isDirty = false;
const requiredDefaults = { position: 0, colour: "Not recorded yet", wcStatus: "Never added to WC", sellScore: 0, bagSize: "Not recorded yet", transportSize: "Not recorded yet", relativeSize: "Not recorded yet" };
const fieldNames = ["position", "colour", "wcStatus", "wcLastChanged", "sellScore", "bagSize", "price", "photoQuality", "bestPhotoDate", "recentPhotoDate", "transportSize", "relativeSize", "soilPercent", "dateAdded", "notes"];
const numericFields = new Set(["position", "sellScore", "price", "photoQuality", "soilPercent"]);
const dateFields = new Set(["wcLastChanged", "bestPhotoDate", "recentPhotoDate", "dateAdded"]);

function dateValue(value) { return value ? new Date(value).toISOString().slice(0, 10) : ""; }
function fillForm(tree) {
  document.getElementById("tag").value = tree.tag;
  fieldNames.forEach((name) => { const input = editForm.elements[name]; const value = tree[name] ?? requiredDefaults[name] ?? ""; input.value = dateFields.has(name) ? dateValue(value) : value; });
  editForm.hidden = false;
  isDirty = false;
}
function searchAnotherTree() {
  if (!isDirty || confirm("Leave this form? Any unsaved changes will be lost.")) window.location.href = "/forms/find-tree.html";
}
async function loadForm() {
  if (!editTag || !["add", "update"].includes(mode)) { editMessage.textContent = "This edit request is missing its tree tag or mode."; return; }
  document.getElementById("page-title").textContent = mode === "add" ? "Add a Tree" : "Update Tree";
  if (mode === "add") { fillForm({ tag: editTag, dateAdded: new Date() }); return; }
  try {
    const response = await fetch(`/api/trees/${encodeURIComponent(editTag)}`, { headers: { Authorization: localStorage.getItem("token") } }); const tree = await response.json();
    if (!response.ok) { editMessage.textContent = tree.message || "Unable to load this tree."; return; }
    fillForm(tree);
  } catch { editMessage.textContent = "Unable to connect to the server."; }
}
editForm.addEventListener("input", () => { isDirty = true; });
document.getElementById("search-button").addEventListener("click", searchAnotherTree);
window.addEventListener("beforeunload", (event) => { if (isDirty) { event.preventDefault(); event.returnValue = ""; } });
editForm.addEventListener("submit", async (event) => {
  event.preventDefault(); editMessage.textContent = "";
  const payload = {};
  fieldNames.forEach((name) => { const value = editForm.elements[name].value.trim(); payload[name] = numericFields.has(name) ? (value === "" ? undefined : Number(value)) : value || undefined; });
  try {
    const url = mode === "add" ? "/api/trees" : `/api/trees/${encodeURIComponent(editTag)}`;
    const response = await fetch(url, { method: mode === "add" ? "POST" : "PUT", headers: { "Content-Type": "application/json", Authorization: localStorage.getItem("token") }, body: JSON.stringify(mode === "add" ? { ...payload, tag: editTag } : payload) });
    const tree = await response.json();
    if (!response.ok) { editMessage.textContent = tree.message || "Unable to save this tree."; return; }
    isDirty = false; window.location.href = `/tree-data/tree-view.html?tag=${encodeURIComponent(tree.tag)}`;
  } catch { editMessage.textContent = "Unable to connect to the server."; }
});
loadForm();
