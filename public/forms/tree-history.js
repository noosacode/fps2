const form = document.getElementById("tree-history-form");
const tagInput = document.getElementById("tag");
const message = document.getElementById("message");
const results = document.getElementById("history-results");

function formatValue(value) {
  if (value === null || value === undefined) {
    return "—";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const tag = tagInput.value.trim();
  message.textContent = "";
  results.innerHTML = "";

  try {
    const response = await fetch(`/api/events/${encodeURIComponent(tag)}`, {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });

    const events = await response.json();

    if (!response.ok) {
      message.textContent = events.message || "Unable to search history.";
      return;
    }

    if (events.length === 0) {
      message.textContent = "No history found for that tag.";
      return;
    }

    const table = document.createElement("table");

    const headerRow = document.createElement("tr");

    const dateHeader = document.createElement("th");
    dateHeader.textContent = "Date";

    const eventHeader = document.createElement("th");
    eventHeader.textContent = "Event";

    const userHeader = document.createElement("th");
    userHeader.textContent = "User";

    headerRow.append(dateHeader, eventHeader, userHeader);

    const thead = document.createElement("thead");
    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");

    events.forEach((event) => {
      const row = document.createElement("tr");
      row.classList.add("history-row");

      const dateCell = document.createElement("td");
      const date = new Date(event.occurredAt);

      dateCell.textContent = date.toLocaleDateString("en-AU", {
        month: "short",
        year: "numeric",
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

      const detailRow = document.createElement("tr");
      detailRow.classList.add("history-details");
      detailRow.hidden = true;

      const detailCell = document.createElement("td");
      detailCell.colSpan = 3;

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
        row.classList.add("history-row");

        row.addEventListener("click", () => {
          detailRow.hidden = !detailRow.hidden;
        });
      }

      tbody.appendChild(row);
      tbody.appendChild(detailRow);
    });

    table.append(thead, tbody);
    results.appendChild(table);
  } catch (err) {
    console.error(err);
    message.textContent = "Unable to connect to the server.";
  }
});
