console.log("Clean Up Notes page loaded");

let currentTree = null;

function loadTree() {
  fetch("/api/trees/cleanup-notes", {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((tree) => {
      console.log("Tree returned:", tree);

      currentTree = tree;

      if (!tree) {
        document.getElementById("tree-tag").textContent = "Complete";
        document.getElementById("tree-colour").textContent = "";
        document.getElementById("tree-bag-size").textContent = "";
        document.getElementById("tree-wc-status").textContent = "";

        document.getElementById("note").value = "";
        document.getElementById("general-notes").value = "";
        document.getElementById("outside-notes").value = "";
        document.getElementById("inside-notes").value = "";

        document.getElementById("save-button").disabled = true;

        return;
      }

      document.getElementById("tree-tag").textContent = tree.tag;
      document.getElementById("tree-colour").textContent = tree.colour;
      document.getElementById("tree-bag-size").textContent = tree.bagSize;
      document.getElementById("tree-wc-status").textContent = tree.wcStatus;

      document.getElementById("note").value = tree.notes || "";
      document.getElementById("general-notes").value = tree.notesGeneral || "";
      document.getElementById("outside-notes").value = tree.outsideTasks || "";
      document.getElementById("inside-notes").value = tree.insideTasks || "";

      document.getElementById("save-button").disabled = false;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

document.getElementById("save-button").addEventListener("click", () => {
  if (!currentTree) {
    return;
  }

  const updates = {
    notes: document.getElementById("note").value,
    notesGeneral: document.getElementById("general-notes").value,
    outsideTasks: document.getElementById("outside-notes").value,
    insideTasks: document.getElementById("inside-notes").value,
  };

  fetch(`/api/trees/cleanup-notes/${encodeURIComponent(currentTree.tag)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: localStorage.getItem("token"),
    },
    body: JSON.stringify(updates),
  })
    .then((response) => response.json())
    .then((tree) => {
      console.log("Tree saved:", tree);

      loadTree();
    })
    .catch((error) => {
      console.error("Save error:", error);
    });
});

loadTree();
