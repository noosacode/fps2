const params = new URLSearchParams(window.location.search);
const colour = params.get("colour");

const sizeGroups = [
  {
    name: "Small",
    sizes: ["2", "20", "200", "250", "300", "350"],
  },
  {
    name: "Medium",
    sizes: ["25", "35", "45", "400", "500"],
  },
  {
    name: "Large",
    sizes: ["75", "100", "150"],
  },
];

function getPercentage(published, nursery) {
  return nursery
    ? ((published / nursery) * 100).toFixed(1) + "%"
    : "0.0%";
}

async function loadColourSummary() {
  if (!colour) {
    document.getElementById("page-title").textContent =
      "No flower colour selected";
    document.getElementById("loading").textContent = "";
    return;
  }

  document.getElementById("page-title").textContent = colour;

  await withLoading(async () => {
    const response = await fetch(
      `/api/summary/colours/${encodeURIComponent(colour)}/sizes`,
    );

    if (!response.ok) {
      throw new Error("Failed to load colour size summary");
    }

    const result = await response.json();
    const sizes = result.sizes;

    const sizeMap = new Map(
      sizes.map((item) => [item.size, item]),
    );

    let totalNursery = 0;
    let totalPublished = 0;

    let html = `
      <table>
        <thead>
          <tr>
            <th>Bag / Pot Size</th>
            <th>Nursery</th>
            <th>Published</th>
            <th>Published %</th>
          </tr>
        </thead>
        <tbody>
    `;

    function addRow(label, nursery, published, isGroup = false) {
      const rowClass = isGroup ? ' class="group-row"' : "";

      html += `
        <tr${rowClass}>
          <td>${label}</td>
          <td>${nursery}</td>
          <td>${published}</td>
          <td>${getPercentage(published, nursery)}</td>
        </tr>
      `;
    }

    // Not recorded yet
    const unrecorded = sizeMap.get("0") || {
      nursery: 0,
      published: 0,
    };

    addRow(
      "Not recorded yet",
      unrecorded.nursery,
      unrecorded.published,
    );

    totalNursery += unrecorded.nursery;
    totalPublished += unrecorded.published;

    // Three size groups
    sizeGroups.forEach((group) => {
      let groupNursery = 0;
      let groupPublished = 0;

      group.sizes.forEach((size) => {
        const item = sizeMap.get(size) || {
          nursery: 0,
          published: 0,
        };

        groupNursery += item.nursery;
        groupPublished += item.published;
      });

      addRow(
        group.name,
        groupNursery,
        groupPublished,
        true,
      );

      group.sizes.forEach((size) => {
        const item = sizeMap.get(size) || {
          nursery: 0,
          published: 0,
        };

        const label = size === "200" ||
          ["250", "300", "350", "400", "500"].includes(size)
          ? `${size}mm pot`
          : `${size}L bag`;

        addRow(label, item.nursery, item.published);
      });

      totalNursery += groupNursery;
      totalPublished += groupPublished;
    });

    html += `
        </tbody>
        <tfoot>
          <tr>
            <th>Total</th>
            <th>${totalNursery}</th>
            <th>${totalPublished}</th>
            <th>${getPercentage(totalPublished, totalNursery)}</th>
          </tr>
        </tfoot>
      </table>
    `;

    document.getElementById("colourSummary").innerHTML = html;
  });
}

loadColourSummary();