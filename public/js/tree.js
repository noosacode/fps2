const findButton = document.getElementById("findButton");
const tagInput = document.getElementById("tagInput");
const results = document.getElementById("results");

async function findTree() {
  const tag = tagInput.value;

  const response = await fetch(`/api/trees/${tag}`, {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });

  let tree = await response.json();

  if (!response.ok) {
    results.innerHTML = `
        <p>Tree ${tag} not found.</p>
        <button id="addButton">Add ${tag}</button>
        `;

    const addButton = document.getElementById("addButton");

    addButton.addEventListener("click", async function () {
      const response = await fetch("/api/trees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          tag: tag,
        }),
      });

      tree = await response.json();

      results.innerHTML = createFormHTML(tree);

      attachFormListeners(tree);
    });

    return;
  }

  function createFormHTML(tree) {
    return `
        <p>
            <strong>Tag:</strong>
            <input type="text" id="tagInput" value="${tree.tag}" readonly>
        </p>

        <p>
            <strong>Position:</strong>
            <input type="text" id="positionInput" value="${tree.position || ""}">
        </p>

        <p>
            <strong>Colour:</strong>
            <input type="text" id="colourInput" value="${tree.colour || ""}">
        </p>

        <p>
            <strong>WooCommerce:</strong>
            <input type="text" id="wcStatusInput" value="${tree.wcStatus || ""}">
        </p>

        <p>
            <strong>WC Changed:</strong>
           <input type="date" id="wcLastChangedInput" value="${tree.wcLastChanged ? new Date(tree.wcLastChanged).toISOString().split("T")[0] : ""}">
        </p>

        <p>
            <strong>Sell Score:</strong>
            <input type="text" id="sellScoreInput" value="${tree.sellScore || ""}">
        </p>

        <p>
            <strong>Size:</strong>
            <input type="text" id="bagSizeInput" value="${tree.bagSize || ""}">
        </p>

        <p>
            <strong>Price:</strong>
            <input type="text" id="priceInput" value="${tree.price || ""}">
        </p>

        <p>
            <strong>Photo Quality:</strong>
            <input type="text" id="photoQualityInput" value="${tree.photoQuality || ""}">
        </p>

        <p>
            <strong>Best Photo:</strong>
            <input type="date" id="bestPhotoDateInput" value="${tree.bestPhotoDate ? new Date(tree.bestPhotoDate).toISOString().split("T")[0] : ""}">
        </p>

        <p>
            <strong>Recent Photo:</strong>
            <input type="date" id="recentPhotoDateInput" value="${tree.recentPhotoDate ? new Date(tree.recentPhotoDate).toISOString().split("T")[0] : ""}">
        </p>

        <p>
            <strong>Transport:</strong>
            <input type="text" id="transportSizeInput" value="${tree.transportSize || ""}">
        </p>

        <p>
            <strong>Relative Size:</strong>
            <input type="text" id="relativeSizeInput" value="${tree.relativeSize || ""}">
        </p>

        <p>
            <strong>Soil:</strong>
            <input type="text" id="soilPercentInput" value="${tree.soilPercent || ""}">
        </p>

        <p>
            <strong>Date Added:</strong>
            <input type="date" id="dateAddedInput" value="${tree.dateAdded ? new Date(tree.dateAdded).toISOString().split("T")[0] : ""}">
        </p>

        <p>
            <strong>Notes:</strong>
            <input type="text" id="notesInput" value="${tree.notes || ""}">
        </p>

        <button id="saveButton">Save Changes</button>
        <button id="cancelButton">Cancel</button>
    `;
  }

  function attachFormListeners(tree) {
    const cancelButton = document.getElementById("cancelButton");

    cancelButton.addEventListener("click", function () {
      findTree();
    });

    const saveButton = document.getElementById("saveButton");

    saveButton.addEventListener("click", async function () {
      const updatedTree = {
        position: document.getElementById("positionInput").value,
        colour: document.getElementById("colourInput").value,
        wcStatus: document.getElementById("wcStatusInput").value,
        wcLastChanged: document.getElementById("wcLastChangedInput").value,
        sellScore: document.getElementById("sellScoreInput").value,
        bagSize: document.getElementById("bagSizeInput").value,
        price: document.getElementById("priceInput").value,
        photoQuality: document.getElementById("photoQualityInput").value,
        bestPhotoDate: document.getElementById("bestPhotoDateInput").value,
        recentPhotoDate: document.getElementById("recentPhotoDateInput").value,
        transportSize: document.getElementById("transportSizeInput").value,
        relativeSize: document.getElementById("relativeSizeInput").value,
        soilPercent: document.getElementById("soilPercentInput").value,
        dateAdded: document.getElementById("dateAddedInput").value,
        notes: document.getElementById("notesInput").value,
      };
      const currentTag = tree.tag;

      const positionCheckResponse = await fetch(
        `/api/trees/position/${updatedTree.position}`,
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        },
      );

      const existingTree = await positionCheckResponse.json();

      if (existingTree && existingTree.tag !== currentTag) {
        const proceed = confirm(
          `Are you sure ${existingTree.tag} is not at position ${updatedTree.position}?`,
        );

        if (!proceed) {
          return;
        }
      }

      const tag = document.getElementById("tagInput").value;

      const response = await fetch(`/api/trees/${tag}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify(updatedTree),
      });

      const savedTree = await response.json();

      findTree();
    });
  }

  results.innerHTML = `
    <h2>Tree Details</h2>

    <table>
        <tr>
            <td><strong>Tag</strong></td>
            <td>${tree.tag}</td>
        </tr>
        <tr>
            <td><strong>Position</strong></td>
            <td>${tree.position || ""}</td>
        </tr>
        <tr>
            <td><strong>Colour</strong></td>
            <td>${tree.colour || ""}</td>
        </tr>
        <tr>
            <td><strong>WooCommerce</strong></td>
            <td>${tree.wcStatus || ""}</td>
        </tr>
        <tr>
            <td><strong>WC Changed</strong></td>
            <td>${tree.wcLastChanged ? new Date(tree.wcLastChanged).toLocaleDateString() : ""}</td>
        </tr>
        <tr>
            <td><strong>Sell Score</strong></td>
            <td>${tree.sellScore || ""}</td>
        </tr>
        <tr>
            <td><strong>Size</strong></td>
            <td>${tree.bagSize || ""}</td>
        </tr>
        <tr>
            <td><strong>Price</strong></td>
            <td>${tree.price || ""}</td>
        </tr>
        <tr>
            <td><strong>Photo Quality</strong></td>
            <td>${tree.photoQuality || ""}</td>
        </tr>
        <tr>
            <td><strong>Best Photo</strong></td>
            <td>${tree.bestPhotoDate ? new Date(tree.bestPhotoDate).toLocaleDateString() : ""}</td>
        </tr>
        <tr>
            <td><strong>Recent Photo</strong></td>
            <td>${tree.recentPhotoDate ? new Date(tree.recentPhotoDate).toLocaleDateString() : ""}</td>
        </tr>
        <tr>
            <td><strong>Transport</strong></td>
            <td>${tree.transportSize || ""}</td>
        </tr>
        <tr>
            <td><strong>Relative Size</strong></td>
            <td>${tree.relativeSize || ""}</td>
        </tr>
        <tr>
            <td><strong>Soil</strong></td>
            <td>${tree.soilPercent || ""}</td>
        </tr>
        <tr>
            <td><strong>Date Added</strong></td>
            <td>${tree.dateAdded ? new Date(tree.dateAdded).toLocaleDateString() : ""}</td>
        </tr>
        <tr>
            <td><strong>Notes</strong></td>
            <td>${tree.notes || ""}</td>
        </tr>
    </table>

    <button id="updateButton">Update</button>
`;

  // attach click listener to show the editable form
  const updateButton = document.getElementById("updateButton");

  updateButton.addEventListener("click", function () {
    results.innerHTML = createFormHTML(tree);

    attachFormListeners(tree);
  });
}

findButton.addEventListener("click", findTree);

tagInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    findTree();
  }
});