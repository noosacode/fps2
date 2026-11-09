const form = document.getElementById("tree-history-form");
const tagInput = document.getElementById("tag");
const message = document.getElementById("message");
const results = document.getElementById("history-results");

let editMode = false;
let currentEvents = [];
let currentColour = "";

function formatValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function renderHistory(tag) {
  results.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = `${tag} - ${currentColour}`;
  results.appendChild(title);

  const modeButton = document.createElement("button");
  modeButton.type = "button";
  modeButton.textContent = editMode ? "Exit Edit Mode" : "Edit History";

  modeButton.addEventListener("click", () => {
    editMode = !editMode;
    renderHistory(tag);
  });

  results.appendChild(modeButton);

  const table = document.createElement("table");

  const headerRow = document.createElement("tr");

  const dateHeader = document.createElement("th");
  dateHeader.textContent = "Date";

  const eventHeader = document.createElement("th");
  eventHeader.textContent = "Event";

  const userHeader = document.createElement("th");
  userHeader.textContent = "User";

  headerRow.append(dateHeader, eventHeader, userHeader);

  if (editMode) {
    const deleteHeader = document.createElement("th");
    deleteHeader.textContent = "Delete";
    headerRow.appendChild(deleteHeader);
  }

  const thead = document.createElement("thead");
  thead.appendChild(headerRow);

  const tbody = document.createElement("tbody");

  currentEvents.forEach((event) => {
    const row = document.createElement("tr");
    row.classList.add("history-row");

    const dateCell = document.createElement("td");
    const date = new Date(event.occurredAt);

    dateCell.textContent = date.toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

    const eventCell = document.createElement("td");

    if (event.eventType === "created") {
      eventCell.textContent = "Created";
    } else {
      const count = event.changes.length;
      eventCell.textContent =
        count === 1 ? "1 field changed" : `${count} fields changed`;
    }

    const userCell = document.createElement("td");
    userCell.textContent = event.username || "";

    row.append(dateCell, eventCell, userCell);

    if (editMode) {
      const deleteCell = document.createElement("td");
      const deleteButton = document.createElement("button");

      deleteButton.type = "button";
      deleteButton.textContent = "Delete";

      deleteButton.addEventListener("click", async (clickEvent) => {
        clickEvent.stopPropagation();

        const confirmed = confirm("Delete this history entry permanently?");

        if (!confirmed) return;

        try {
          await withLoading(async () => {
            const token = localStorage.getItem("token");

            const response = await fetch(
              `/api/events/${encodeURIComponent(tag)}/${event._id}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: token,
                },
              },
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(data.error || "Unable to delete history entry.");
            }

            currentEvents = currentEvents.filter(
              (item) => item._id !== event._id,
            );

            renderHistory(tag);
          });
        } catch (error) {
          console.error(error);
          alert(error.message || "Unable to delete history entry.");
        }
      });

      deleteCell.appendChild(deleteButton);
      row.appendChild(deleteCell);
    }

    const detailRow = document.createElement("tr");
    detailRow.classList.add("history-details");
    detailRow.hidden = false;

    const detailCell = document.createElement("td");
    detailCell.colSpan = editMode ? 4 : 3;

    const detailTable = document.createElement("table");

    const detailHeaderRow = document.createElement("tr");

    const fieldHeader = document.createElement("th");
    fieldHeader.textContent = "Field";

    const beforeHeader = document.createElement("th");
    beforeHeader.textContent = "Before";

    const afterHeader = document.createElement("th");
    afterHeader.textContent = "After";

    detailHeaderRow.append(fieldHeader, beforeHeader, afterHeader);

    const detailThead = document.createElement("thead");
    detailThead.appendChild(detailHeaderRow);

    const detailTbody = document.createElement("tbody");

    event.changes.forEach((change) => {
      const changeRow = document.createElement("tr");

      const fieldCell = document.createElement("td");
      fieldCell.textContent = change.field;

      const beforeCell = document.createElement("td");
      beforeCell.textContent = formatValue(change.previousValue);

      const afterCell = document.createElement("td");
      afterCell.textContent = formatValue(change.newValue);

      changeRow.append(fieldCell, beforeCell, afterCell);
      detailTbody.appendChild(changeRow);
    });

    detailTable.append(detailThead, detailTbody);
    detailCell.appendChild(detailTable);
    detailRow.appendChild(detailCell);

    if (event.eventType === "updated") {
      row.addEventListener("click", () => {
        detailRow.hidden = !detailRow.hidden;
      });
    }

    tbody.appendChild(row);
    tbody.appendChild(detailRow);
  });

  table.append(thead, tbody);
  results.appendChild(table);
}

async function loadHistory(tag) {
  message.textContent = "";
  results.innerHTML = "";

  try {
    await withLoading(async () => {
      const response = await fetch(`/api/events/${encodeURIComponent(tag)}`);

      const data = await response.json();

      if (!response.ok) {
        message.textContent = data.error || "Unable to search history.";
        return;
      }

      currentEvents = data.events;
      currentColour = data.colour;

      if (currentEvents.length === 0) {
        message.textContent = "No history found for that tag.";
        return;
      }

      renderHistory(tag);
    });
  } catch (err) {
    console.error(err);
    message.textContent = "Unable to connect to the server.";
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const tag = tagInput.value.trim();

  if (!tag) return;

  editMode = false;
  await loadHistory(tag);
});

const params = new URLSearchParams(window.location.search);
const urlTag = params.get("tag");

if (urlTag) {
  tagInput.value = urlTag;
  form.requestSubmit();
}