const results = document.getElementById("results");

async function loadTurnOnList() {
  const response = await fetch("/api/trees/turnon", {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });

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
      </tr>

      ${trees
        .map(
          (tree) => `
            <tr>
              <td>${tree.sellScore}</td>
              <td><a href="/tree-data.html?tag=${tree.tag}">${tree.tag}</a></td>
              <td>${tree.position}</td>
              <td>${tree.colour}</td>
              <td>${tree.price || ""}</td>
              <td>${tree.wcStatus || "(blank)"}</td>
            </tr>
          `,
        )
        .join("")}
    </table>
  `;
}

loadTurnOnList();
