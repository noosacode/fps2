const form = document.getElementById("history-search-form");
const fromInput = document.getElementById("from");
const toInput = document.getElementById("to");
const usernameInput = document.getElementById("username");
const fieldInput = document.getElementById("field");
const newValueInput = document.getElementById("new-value");
const message = document.getElementById("message");
const results = document.getElementById("history-results");

function getTodayString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const today = getTodayString();

fromInput.value = today;
toInput.value = today;

function localDateToISO(value, endOfDay = false) {
  if (!value) {
    return "";
  }

  const [year, month, day] = value.split("-").map(Number);

  const date = endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);

  if (isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString();
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") {
    return "Not recorded yet";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function formatDateTime(value) {
  const date = new Date(value);

  return date.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function createCell(value) {
  const cell = document.createElement("td");
  cell.textContent = formatValue(value);
  return cell;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  message.textContent = "";
  results.innerHTML = "";

const from = localDateToISO(fromInput.value);
const to = localDateToISO(toInput.value, true);

  if (!from || !to) {
    message.textContent = "Please enter both a From and To date.";
    return;
  }

  if (new Date(from) > new Date(to)) {
    message.textContent = "The From date must be before the To date.";
    return;
  }

  const params = new URLSearchParams({
    from,
    to,
  });

  if (usernameInput.value) {
    params.set("username", usernameInput.value);
  }

  if (fieldInput.value) {
    params.set("field", fieldInput.value);
  }

  if (newValueInput.value.trim() !== "") {
    params.set("newValue", newValueInput.value.trim());
  }

  try {
    await withLoading(async () => {
    const response = await fetch(`/api/history-search?${params.toString()}`, {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });

    if (handleAuthFailure(response)) return;

    const data = await response.json();

    if (!response.ok) {
      message.textContent = data.message || "Unable to search history.";
      return;
    }

    if (data.results.length === 0) {
      message.textContent = "No matching history found.";
      return;
    }

    const title = document.createElement("h2");
    title.textContent = `${data.results.length} matching change${
      data.results.length === 1 ? "" : "s"
    }`;

    results.appendChild(title);

    const table = document.createElement("table");

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    [
      "Time",
      "Tree",
      "Colour",
      "Bag size",
      "Price",
      "Transport size",
      "User",
      "Change",
    ].forEach((heading) => {
      const th = document.createElement("th");
      th.textContent = heading;
      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);

    const tbody = document.createElement("tbody");

    data.results.forEach((item) => {
      const row = document.createElement("tr");

      const timeCell = document.createElement("td");
      timeCell.textContent = formatDateTime(item.occurredAt);

      const tagCell = document.createElement("td");

      const tagLink = document.createElement("a");
      tagLink.href = `/forms/edit-tree.html?mode=update&tag=${encodeURIComponent(
        item.tag,
      )}`;
      tagLink.textContent = item.tag;

      tagCell.appendChild(tagLink);

      row.appendChild(timeCell);
      row.appendChild(tagCell);
      row.appendChild(createCell(item.colour));
      row.appendChild(createCell(item.bagSize));
      row.appendChild(createCell(item.price));
      row.appendChild(createCell(item.transportSize));
      row.appendChild(createCell(item.username));

      const changeCell = document.createElement("td");

      const before = formatValue(item.previousValue);
      const after = formatValue(item.newValue);

      changeCell.textContent = `${item.field}: ${before} → ${after}`;

      row.appendChild(changeCell);

      tbody.appendChild(row);
    });

    table.append(thead, tbody);
    results.appendChild(table);
  });
  } catch (error) {
    console.error(error);
    message.textContent = "Unable to connect to the server.";
  }
});
