const form = document.getElementById("filtered-list-form");
const firstPositionInput = document.getElementById("firstPosition");
const lastPositionInput = document.getElementById("lastPosition");
const tagContainsInput = document.getElementById("tagContains");
const colourInput = document.getElementById("colour");
const wcStatusInput = document.getElementById("wcStatus");
const bagSizeInput = document.getElementById("bagSize");
const minSellScoreInput = document.getElementById("minSellScore");
const notesContainsInput = document.getElementById("notesContains");
const notesGeneralNotEmptyInput = document.getElementById("notesGeneralNotEmpty");
const notesOutsideContainsInput = document.getElementById("notesOutsideContains");
const notesInsideContainsInput = document.getElementById("notesInsideContains");
const message = document.getElementById("message");
const results = document.getElementById("results");
const clearBtn = document.getElementById("clearBtn");

function clearResults() {
  results.innerHTML = "";
}

function isValidPosition(value) {
  return (
    /^\d+$/.test(String(value)) &&
    Number(value) >= 101 &&
    Number(value) <= 999999
  );
}

function matchContains(fieldValue, filterValue) {
  if (!filterValue) return true;
  if (fieldValue === undefined || fieldValue === null) return false;
  return String(fieldValue)
    .toLowerCase()
    .includes(String(filterValue).toLowerCase());
}

function matchExact(fieldValue, filterValue) {
  if (!filterValue) return true;
  if (fieldValue === undefined || fieldValue === null) return false;
  return String(fieldValue).toLowerCase() === String(filterValue).toLowerCase();
}

function renderTrees(trees) {
  if (!trees.length) {
    message.textContent = "No trees matched the filters.";
    clearResults();
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `
    <thead>
      <tr>
        <th>Position</th>
        <th>Tag</th>
        <th>Colour</th>
        <th>WC status</th>
        <th>Bag size</th>
        <th>Sell score</th>
        <th>Notes</th>
        <th>General notes</th>
        <th>Outside notes</th>
        <th>Inside notes</th>
      </tr>
    </thead>
    <tbody>
      ${trees
        .map(
          (tree) => `
            <tr>
              <td>${tree.position}</td>
              <td><a href="/tree-data/tree-view.html?tag=${encodeURIComponent(tree.tag)}">${tree.tag}</a></td>
              <td>${tree.colour || ""}</td>
              <td>${tree.wcStatus || ""}</td>
              <td>${tree.bagSize || ""}</td>
              <td>${tree.sellScore ?? ""}</td>
              <td>${(tree.notes || "").replace(/</g, "&lt;")}</td>
              <td>${(tree.notesGeneral || "").replace(/</g, "&lt;")}</td>
              <td>${(tree.notesOutside || "").replace(/</g, "&lt;")}</td>
              <td>${(tree.notesInside || "").replace(/</g, "&lt;")}</td>
            </tr>
          `,
        )
        .join("")}
    </tbody>
  `;

  clearResults();
  results.appendChild(table);
}

function applyFilters(trees) {
  const tagFilter = tagContainsInput.value.trim();
  const colourFilter = colourInput.value.trim();
  const wcFilter = wcStatusInput.value.trim();
  const bagFilter = bagSizeInput.value.trim();
  const minSell = minSellScoreInput.value
    ? Number(minSellScoreInput.value)
    : null;
  const notesFilter = notesContainsInput.value.trim();
  const notesGeneralNotEmpty = notesGeneralNotEmptyInput.checked;
  const notesOutsideFilter = notesOutsideContainsInput.value.trim();
  const notesInsideFilter = notesInsideContainsInput.value.trim();

  return trees.filter((tree) => {
    if (tagFilter && !matchContains(tree.tag, tagFilter)) return false;
    if (colourFilter && !matchContains(tree.colour, colourFilter)) return false;
    if (wcFilter && !matchExact(tree.wcStatus, wcFilter)) return false;
    if (bagFilter && !matchContains(tree.bagSize, bagFilter)) return false;
    if (
      minSell !== null &&
      (tree.sellScore === undefined ||
        tree.sellScore === null ||
        Number(tree.sellScore) < minSell)
    )
      return false;
    if (notesFilter && !matchContains(tree.notes, notesFilter)) return false;
    // Checkbox: must NOT be empty
    if (notesGeneralNotEmpty && !tree.notesGeneral?.trim()) return false;

    if (
      notesOutsideFilter &&
      !matchContains(tree.notesOutside, notesOutsideFilter)
    )
      return false;
    if (
      notesInsideFilter &&
      !matchContains(tree.notesInside, notesInsideFilter)
    )
      return false;
    return true;
  };);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const firstValue = firstPositionInput.value.trim();
  const lastValue = lastPositionInput.value.trim();

  message.textContent = "";
  clearResults();

  if (!firstValue || !lastValue) {
    message.textContent = "Please enter the start and end positions.";
    return;
  }

  if (!isValidPosition(firstValue) || !isValidPosition(lastValue)) {
    message.textContent = "Please enter valid positions from 101 to 999999.";
    return;
  }

  let start = Number(firstValue);
  let end = Number(lastValue);

  if (start > end) {
    [start, end] = [end, start];
  }

  try {
    const response = await fetch(`/api/trees/positions/${start}/${end}`, {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });

    const trees = await response.json();

    if (!response.ok) {
      message.textContent = trees.message || "Unable to fetch trees.";
      return;
    }

    if (trees.length === 0) {
      message.textContent = `No trees found between positions ${start} and ${end}.`;
      return;
    }

    // Safety limit to avoid rendering too many rows in the browser
    const MAX_ROWS = 500;
    if (trees.length > MAX_ROWS) {
      message.textContent = `Search returned ${trees.length} trees — narrow the position range or add filters. (Limit ${MAX_ROWS})`;
      return;
    }

    const filtered = applyFilters(trees);

    if (filtered.length === 0) {
      message.textContent =
        "No trees matched the filters within the requested positions.";
      return;
    }

    renderTrees(filtered);
  } catch (err) {
    console.error(err);
    message.textContent = "Unable to connect to the server.";
  }
});

clearBtn.addEventListener("click", () => {
  tagContainsInput.value = "";
  colourInput.value = "";
  wcStatusInput.value = "";
  bagSizeInput.value = "";
  firstPositionInput.value = "";
  lastPositionInput.value = "";
  minSellScoreInput.value = "";
  notesContainsInput.value = "";
  notesGeneralNotEmptyInput.checked = false;
  notesOutsideContainsInput.value = "";
  notesInsideContainsInput.value = "";
  message.textContent = "";
  clearResults();
});
