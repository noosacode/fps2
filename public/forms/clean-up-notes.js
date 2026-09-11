let currentTree = null;

function loadTree() {
  const params = new URLSearchParams(window.location.search);
  const startPosition = params.get("start") || 0;

  fetch(`/api/trees/cleanup-notes?start=${startPosition}`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  })
    .then((response) => response.json())
    .then((tree) => {

      currentTree = tree;

      if (!tree) {
        document.getElementById("tree-tag").textContent = "Complete";
        document.getElementById("tree-colour").textContent = "";
        document.getElementById("tree-bag-size").textContent = "";
        document.getElementById("tree-wc-status").textContent = "";

        document.getElementById("note").value = "";
        document.getElementById("general-notes").value = "";
        document.getElementById("outside-tasks").value = "";
        document.getElementById("inside-tasks").value = "";

        document.getElementById("save-button").disabled = true;

        return;
      }

      document.getElementById("tree-tag").textContent = tree.tag;
      document.getElementById("tree-position").textContent = tree.position;
      document.getElementById("tree-colour").textContent = tree.colour;
      document.getElementById("tree-bag-size").textContent = tree.bagSize;
      document.getElementById("tree-wc-status").textContent = tree.wcStatus;

      document.getElementById("note").value = tree.notes || "";
      document.getElementById("general-notes").value = tree.notesGeneral || "";
      document.getElementById("outside-tasks").value = tree.outsideTasks || "";
      document.getElementById("inside-tasks").value = tree.insideTasks || "";

      document.getElementById("save-button").disabled = false;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

function goToNextTree() {
  if (!currentTree) {
    return;
  }

  const nextPosition = currentTree.position + 1;

  window.history.replaceState({}, "", `?start=${nextPosition}`);

  loadTree();
}

document.getElementById("save-button").addEventListener("click", () => {
  if (!currentTree) {
    return;
  }

  const updates = {
    notes: document.getElementById("note").value,
    notesGeneral: document.getElementById("general-notes").value,
    outsideTasks: document.getElementById("outside-tasks").value,
    insideTasks: document.getElementById("inside-tasks").value,
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

  goToNextTree();
})
.catch((error) => {
  console.error("Save error:", error);
});
});

  document.getElementById("next-button").addEventListener("click", () => {
    goToNextTree();
  });

  document.getElementById("start-button").addEventListener("click", () => {
    const startPosition = document.getElementById("start-position").value;

    window.history.replaceState({}, "", `?start=${startPosition}`);

    loadTree();
  });

  loadTree();
