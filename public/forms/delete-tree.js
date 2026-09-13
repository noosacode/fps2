const form = document.getElementById("delete-tree-form");
const tagInput = document.getElementById("tag");
const message = document.getElementById("message");
const normaliseTag = (value) => value.trim().toLowerCase();
const isValidTag = (tag) => /^(?:[1-9]\d{2}|\d+[a-z]+)$/.test(tag);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const tag = normaliseTag(tagInput.value);
  message.textContent = "";

  if (!isValidTag(tag)) {
    message.textContent =
      "Enter a three-digit tag (100-999) or digits followed by letters, such as 12w.";
    return;
  }

  try {
    await withLoading(async () => {
      const response = await fetch(`/api/trees/${encodeURIComponent(tag)}`, {
        headers: { Authorization: localStorage.getItem("token") },
      });

      if (handleAuthFailure(response)) return;

      if (response.ok) {
        const tree = await response.json();
        const treeDetails = document.getElementById("tree-details");

        treeDetails.innerHTML = `
        <h2>Tree Details</h2>
        <p>Tag: ${tree.tag}</p>
        <p>Colour: ${tree.colour}</p>
        <p>Bag Size: ${tree.bagSize}</p>
        <p>WooCommerce Status: ${tree.wcStatus}</p>
        <button id="delete-button" type="button">Delete This Tree</button>
      `;

        const deleteButton = document.getElementById("delete-button");

        deleteButton.addEventListener("click", async () => {
          if (!confirm(`Delete tree ${tree.tag}?`)) {
            return;
          }

          try {
            await withLoading(async () => {
              const deleteResponse = await fetch(
                `/api/trees/${encodeURIComponent(tree.tag)}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: localStorage.getItem("token"),
                  },
                },
              );

              const data = await deleteResponse.json().catch(() => ({}));

              if (deleteResponse.ok) {
                treeDetails.innerHTML = "";
                message.textContent = "Tree deleted.";
                tagInput.value = "";
                tagInput.focus();
                return;
              }

              message.textContent =
                data.message || "Unable to delete the tree.";
            });
          } catch {
            message.textContent = "Unable to connect to the server.";
          }
        });

        return;
      }

      if (response.status === 404) {
        message.textContent = "Tree not found.";
        return;
      }

      const data = await response.json().catch(() => ({}));
      message.textContent = data.message || "Unable to search for that tree.";
    });
  } catch {
    message.textContent = "Unable to connect to the server.";
  }
});
