async function loadColourSummary() {
  await withLoading(async () => {
    const response = await fetch("/api/summary/colours");
    const colours = await response.json();

    const container = document.getElementById("colourSummary");

    let totalNursery = 0;
    let totalPublished = 0;
    let ratedPriorityTotal = 0;
    let ratedColourCount = 0;

    colours.forEach((item) => {
      totalNursery += item.nursery;
      totalPublished += item.published;

      if (item.priority > 0) {
        ratedPriorityTotal += item.priority;
        ratedColourCount++;
      }
    });

    const totalPercentage = totalNursery
      ? ((totalPublished / totalNursery) * 100).toFixed(1)
      : "0.0";

    const averagePriority = ratedColourCount
      ? (ratedPriorityTotal / ratedColourCount).toFixed(1)
      : "—";

    // Summary row displayed at the top
    const summaryRow = `
      <tr>
        <th>Total</th>
        <th>${totalNursery}</th>
        <th>${totalPublished}</th>
        <th>${totalPercentage}%</th>
        <th>${averagePriority}</th>
      </tr>
    `;

    let html = `
      <table>
        <thead>
          <tr>
            <th>Flower colour</th>
            <th>Nursery</th>
            <th>Published</th>
            <th>Published %</th>
            <th>Priority</th>
          </tr>
          ${summaryRow}
        </thead>
        <tbody>
    `;

    colours.forEach((item, index) => {
      const percentage = item.nursery
        ? ((item.published / item.nursery) * 100).toFixed(1)
        : "0.0";

      html += `
        <tr>
          <td>
          <a href="/lists/colour-summary.html?colour=${encodeURIComponent(item._id)}">
            ${item._id}
          </a>
          </td>
          <td>${item.nursery}</td>
          <td>${item.published}</td>
          <td>${percentage}%</td>
          <td>
            <span>${item.priority}</span>
            <button
              type="button"
              class="priority-edit"
              data-index="${index}"
              title="Edit priority"
            >✎</button>
          </td>
        </tr>
      `;
    });

    html += `
        </tbody>
        <tfoot>
          ${summaryRow}
        </tfoot>
      </table>
    `;

    container.innerHTML = html;

    document.querySelectorAll(".priority-edit").forEach((button) => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        const item = colours[index];
        const cell = button.parentElement;

        cell.innerHTML = `
          <input
            type="number"
            min="0"
            max="100"
            step="1"
            value="${item.priority}"
            style="width: 65px;"
          >
          <button type="button" class="priority-save">Save</button>
          <button type="button" class="priority-cancel">Cancel</button>
        `;

        const input = cell.querySelector("input");
        const saveButton = cell.querySelector(".priority-save");
        const cancelButton = cell.querySelector(".priority-cancel");

        async function savePriority() {
          if (
            input.value.trim() === "" ||
            !Number.isInteger(Number(input.value)) ||
            Number(input.value) < 0 ||
            Number(input.value) > 100
          ) {
            alert("Enter a whole number from 0 to 100.");
            input.focus();
            return;
          }

          try {
            const response = await fetch(
              `/api/summary/colours/${encodeURIComponent(item._id)}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: localStorage.getItem("token"),
                },
                body: JSON.stringify({
                  priority: Number(input.value),
                }),
              },
            );

            const result = await response.json();

            if (!response.ok) {
              alert(result.error || "Failed to save priority. Please log in.");
              return;
            }

            await loadColourSummary();
          } catch (error) {
            console.error(error);
            alert("Unable to save priority. Please log in.");
          }
        }

        saveButton.addEventListener("click", savePriority);

        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            savePriority();
          }
        });

        cancelButton.addEventListener("click", () => {
          loadColourSummary();
        });

        input.focus();
        input.select();
      });
    });
  });
}

loadColourSummary();
