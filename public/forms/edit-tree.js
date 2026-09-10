const editParams = new URLSearchParams(window.location.search);
const editTag = editParams.get("tag");
const mode = editParams.get("mode");
const editForm = document.getElementById("tree-form");
const editMessage = document.getElementById("message");
const featureSelect = editForm.elements.feature;
const featureScoreSelect = editForm.elements.featureScore;
let isDirty = false;
const requiredDefaults = {
  position: 0,
  colour: "Not recorded yet",
  wcStatus: "Never added to WC",
  sellScore: 0,
  bagSize: "Not recorded yet",
  transportSize: "Not recorded yet",
  relativeSize: "Not recorded yet",
};
const fieldNames = [
  "position",
  "colour",
  "wcStatus",
  "wcLastChanged",
  "sellScore",
  "bagSize",
  "price",
  "photoQuality",
  "bestPhotoDate",
  "recentPhotoDate",
  "transportSize",
  "relativeSize",
  "soilPercent",
  "dateAdded",
  "notes",
  "notesGeneral",
  "outsideTasks",
  "insideTasks",
];
const numericFields = new Set([
  "position",
  "sellScore",
  "price",
  "photoQuality",
  "soilPercent",
]);
const dateFields = new Set([
  "wcLastChanged",
  "bestPhotoDate",
  "recentPhotoDate",
  "dateAdded",
]);

function dateValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}
function fillForm(tree) {
  document.getElementById("tag").value = tree.tag;
  fieldNames.forEach((name) => {
    const input = editForm.elements[name];
    const value = tree[name] ?? requiredDefaults[name] ?? "";
    input.value = dateFields.has(name) ? dateValue(value) : value;
  });
  editForm.hidden = false;
  updateFeatureScore();
  isDirty = false;
}
function updateFeatureScore() {
  if (featureSelect.value === "sellScore") {
    featureScoreSelect.value = editForm.elements.sellScore.value;
  } else {
    featureScoreSelect.value = "";
  }
}
function getFeatureUpdate() {
  const feature = featureSelect.value;
  const score = featureScoreSelect.value;

  if (feature === "sellScore") {
    return { sellScore: Number(score) };
  }

  if (feature === "bentTrunk") {
    return { bentTrunk: Number(score), sellScore: Number(score) };
  }

  if (feature === "cutoffBranch") {
    return { cutoffBranch: Number(score), sellScore: Number(score) };
  }

  if (feature === "fertilize") {
    return { fertilize: Number(score), sellScore: Number(score) };
  }

  if (feature === "flowerColourUnknown") {
    return { flowerColourUnknown: Number(score), sellScore: Number(score) };
  }

  if (feature === "gatherStats") {
    return { gatherStats: Number(score), sellScore: Number(score) };
  }

  if (feature === "getPhoto") {
    return { getPhoto: Number(score), sellScore: Number(score) };
  }

  if (feature === "ingroundRoots") {
    return { ingroundRoots: Number(score), sellScore: Number(score) };
  }

  if (feature === "leafProblem") {
    return { leafProblem: Number(score), sellScore: Number(score) };
  }

  if (feature === "lichen") {
    return { lichen: Number(score), sellScore: Number(score) };
  }

  if (feature === "lowSoil") {
    return { lowSoil: Number(score), sellScore: Number(score) };
  }

  if (feature === "prune") {
    return { prune: Number(score), sellScore: Number(score) };
  }

  if (feature === "rootsStrength") {
    return { rootsStrength: Number(score), sellScore: Number(score) };
  }

  if (feature === "rust") {
    return { rust: Number(score), sellScore: Number(score) };
  }

  if (feature === "skinnyShape") {
    return { skinnyShape: Number(score), sellScore: Number(score) };
  }

  if (feature === "smallSize") {
    return { smallSize: Number(score), sellScore: Number(score) };
  }

  if (feature === "softBranch") {
    return { softBranch: Number(score), sellScore: Number(score) };
  }

  if (feature === "stringed") {
    return { stringed: Number(score), sellScore: Number(score) };
  }

  if (feature === "sunburnt") {
    return { sunburnt: Number(score), sellScore: Number(score) };
  }

  if (feature === "tipDamage") {
    return { tipDamage: Number(score), sellScore: Number(score) };
  }

  if (feature === "unbalancedShape") {
    return { unbalancedShape: Number(score), sellScore: Number(score) };
  }

  if (feature === "upsize") {
    return { upsize: Number(score), sellScore: Number(score) };
  }

  if (feature === "whiteScale") {
    return { whiteScale: Number(score), sellScore: Number(score) };
  }

  return {};
}
function searchAnotherTree() {
  if (!isDirty || confirm("Leave this form? Any unsaved changes will be lost."))
    window.location.href = "/forms/find-tree.html";
}
async function loadForm() {
  if (!editTag || !["add", "update"].includes(mode)) {
    editMessage.textContent =
      "This edit request is missing its tree tag or mode.";
    return;
  }
  document.getElementById("page-title").textContent =
    mode === "add" ? "Add a Tree" : "Update Tree";
  if (mode === "add") {
    fillForm({ tag: editTag, dateAdded: new Date() });
    return;
  }
  try {
    const response = await fetch(`/api/trees/${encodeURIComponent(editTag)}`, {
      headers: { Authorization: localStorage.getItem("token") },
    });

    // if (handleAuthFailure(response)) return;

    const tree = await response.json();
    if (!response.ok) {
      editMessage.textContent = tree.message || "Unable to load this tree.";
      return;
    }
    fillForm(tree);
  } catch {
    editMessage.textContent = "Unable to connect to the server.";
  }
}
editForm.addEventListener("input", () => {
  isDirty = true;
});

featureSelect.addEventListener("change", updateFeatureScore);
document
  .getElementById("search-button")
  .addEventListener("click", searchAnotherTree);
window.addEventListener("beforeunload", (event) => {
  if (isDirty) {
    event.preventDefault();
    event.returnValue = "";
  }
});
editForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  editMessage.textContent = "";

  if (featureSelect.value !== "sellScore" && featureScoreSelect.value === "") {
    alert("Please enter a feature score.");
    return;
  }

  const payload = {};
  fieldNames.forEach((name) => {
    if (mode === "update" && name === "dateAdded") return;

    const value = editForm.elements[name].value.trim();
    payload[name] = numericFields.has(name)
      ? value === ""
        ? undefined
        : Number(value)
      : value || undefined;
  });

  payload.clearRecentPhotoDate = editForm.elements.clearRecentPhotoDate.checked;
  payload.clearBestPhotoDate = editForm.elements.clearBestPhotoDate.checked;
  payload.clearWcLastChanged = editForm.elements.clearWcLastChanged.checked;

  if (editForm.elements.deleteNotes.checked) {
    payload.notes = "No notes";
  }

  if (editForm.elements.deleteNotesGeneral.checked) {
    payload.notesGeneral = "No notes";
  }

  Object.assign(payload, getFeatureUpdate());
  try {
    const url =
      mode === "add"
        ? "/api/trees"
        : `/api/trees/${encodeURIComponent(editTag)}`;
    const response = await fetch(url, {
      method: mode === "add" ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: localStorage.getItem("token"),
      },
      body: JSON.stringify(
        mode === "add" ? { ...payload, tag: editTag } : payload,
      ),
    });
    const tree = await response.json();
    if (!response.ok) {
      editMessage.textContent = tree.message || "Unable to save this tree.";
      return;
    }
    isDirty = false;
    window.location.href = `/tree-data/tree-view.html?tag=${encodeURIComponent(tree.tag)}`;
  } catch {
    editMessage.textContent = "Unable to connect to the server.";
  }
});
loadForm();
