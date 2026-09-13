const params = new URLSearchParams(window.location.search);
const taskName = params.get("task");
const pageTitle = document.getElementById("page-title");
const tableBody = document.getElementById("tree-table-body");
const message = document.getElementById("message");

let currentTrees = [];
let sortState = { column: "position", ascending: true };

function renderTable(trees) {
  tableBody.innerHTML = "";
  trees.forEach((tree) => {
    const row = document.createElement("tr");

    const positionCell = document.createElement("td");
    positionCell.textContent = tree.position;

    const tagCell = document.createElement("td");
    tagCell.textContent = tree.tag;

    const colourCell = document.createElement("td");
    colourCell.textContent = tree.colour;

    const statusCell = document.createElement("td");
    statusCell.textContent = tree.wcStatus;

    row.append(positionCell, tagCell, colourCell, statusCell);
    tableBody.appendChild(row);
  });
}

function sortTrees(column) {
  if (sortState.column === column) {
    sortState.ascending = !sortState.ascending;
  } else {
    sortState.column = column;
    sortState.ascending = true;
  }

  const sorted = [...currentTrees].sort((a, b) => {
    const valA = a[column];
    const valB = b[column];
    if (valA < valB) return sortState.ascending ? -1 : 1;
    if (valA > valB) return sortState.ascending ? 1 : -1;
    return 0;
  });

  renderTable(sorted);
}

async function loadTrees() {
  await withLoading(async () => {
    if (!taskName) {
      message.textContent = "No task specified.";
      return;
    }

    pageTitle.textContent = taskName;

    try {
      const response = await fetch(
        `/api/tasks/outside/${encodeURIComponent(taskName)}`,
        { headers: { Authorization: localStorage.getItem("token") } },
      );

      const trees = await response.json();

      if (!response.ok) {
        message.textContent = trees.message || "Unable to load trees.";
        return;
      }

      if (trees.length === 0) {
        message.textContent = "No trees found for this task.";
        return;
      }

      currentTrees = trees;
      renderTable(currentTrees);
    } catch {
      message.textContent = "Unable to connect to the server.";
    }
  });
}

document.querySelectorAll("#tree-table th").forEach((header, index) => {
  const columns = ["position", "tag", "colour", "wcStatus"];
  header.style.cursor = "pointer";
  header.addEventListener("click", () => sortTrees(columns[index]));
});

loadTrees();
