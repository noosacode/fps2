async function loadColourSummary() {
  const response = await fetch("/api/summary/colours", {
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });

  if (handleAuthFailure(response)) return;

  const colours = await response.json();

  const container = document.getElementById("colourSummary");

  let total = 0;

  colours.forEach((item) => {
    total += item.count;
  });

  let html = `
  <table>
    <thead>
      <tr>
        <th>Flower colour</th>
        <th>Number of trees</th>
      </tr>
    </thead>
    <tbody>
`;

  colours.forEach((item) => {
    html += `
    <tr>
      <td>${item._id}</td>
      <td>${item.count}</td>
    </tr>
  `;
  });

  html += `
    </tbody>
    <tfoot>
      <tr>
        <th>Total</th>
        <th>${total}</th>
      </tr>
    </tfoot>
  </table>
`;

  container.innerHTML = html;
}

loadColourSummary();
