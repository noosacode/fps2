const results = document.getElementById("results");

async function loadTurnOnList() {
  await withLoading(async () => {
    const response = await fetch("/api/trees/turnon");

    const trees = await response.json();

    if (!response.ok) {
      const errorText = await response.text();
      results.innerHTML = `
    <p>Unable to load Turn On list.</p>
    <p>Status: ${response.status}</p>
    <p>${errorText}</p>
  `;
      return;
    }

    results.innerHTML = `
    <h2>Trees to Turn On</h2>

    <table>
      <tr>
        <th>Sell Score</th>
        <th>Tag</th>
        <th>Position</th>
        <th>Colour</th>
        <th>Price</th>
        <th>WC Status</th>
        <th>Outside Tasks</th>
        <th>Inside Tasks</th>
      </tr>

      ${trees
        .map(
          (tree) => `
            <tr>
              <td>${tree.sellScore}</td>
              <td><a href="/tree-data/tree-view.html?tag=${encodeURIComponent(tree.tag)}">${tree.tag}</a></td>
              <td>${tree.position}</td>
              <td>${tree.colour || ""}</td>
              <td>${tree.price || ""}</td>
              <td>${tree.wcStatus || "(blank)"}</td>
              <td>${tree.outsideTasks || ""}</td>
              <td>${tree.insideTasks || ""}</td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
  });
}

loadTurnOnList();
