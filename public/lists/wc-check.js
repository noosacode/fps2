const results = document.getElementById("results");

async function loadWooCommerceCheck() {
  await withLoading(async () => {
    const response = await fetch("/api/trees/positions/0/69999", {
      headers: {
        Authorization: localStorage.getItem("token"),
      },
    });

    if (handleAuthFailure(response)) return;

    const trees = await response.json();

    if (!response.ok) {
      const errorText = await response.text();
      results.innerHTML = `
        <p>Unable to load WooCommerce check.</p>
        <p>Status: ${response.status}</p>
        <p>${errorText}</p>
      `;
      return;
    }

    const wcTrees = trees
      .filter((tree) => tree.wcStatus === "on")
      .sort((a, b) => {
        const colourA = (a.colour || "").toLowerCase();
        const colourB = (b.colour || "").toLowerCase();

        if (colourA !== colourB) {
          return colourA.localeCompare(colourB);
        }

        return (Number(b.price) || 0) - (Number(a.price) || 0);
      });

    results.innerHTML = `
      <table>
        <tr>
          <th>Tag</th>
          <th>Colour</th>
          <th>Bag Size</th>
          <th>Price</th>
          <th>Transport Size</th>
        </tr>

        ${wcTrees
          .map(
            (tree) => `
              <tr>
                <td>
                  <a href="/tree-data/tree-view.html?tag=${tree.tag}">
                    ${tree.tag}
                  </a>
                </td>
                <td>${tree.colour || ""}</td>
                <td>${tree.bagSize || ""}</td>
                <td>${tree.price || ""}</td>
                <td>${tree.transportSize || ""}</td>
              </tr>
            `,
          )
          .join("")}
      </table>
    `;
  });
}

loadWooCommerceCheck();
