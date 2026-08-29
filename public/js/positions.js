const findButton = document.getElementById("findButton");
const firstPosition = document.getElementById("firstPosition");
const lastPosition = document.getElementById("lastPosition");
const results = document.getElementById("results");

findButton.addEventListener("click", async () => {
  const first = firstPosition.value;
  const last = lastPosition.value;
  if (!first || !last) {
    alert("Please enter two position numbers.");
    return;
  }
  if (
    !/^\d+$/.test(first) ||
    !/^\d+$/.test(last) ||
    Number(first) < 100 ||
    Number(first) > 99999 ||
    Number(last) < 100 ||
    Number(last) > 999999
  ) {
    alert("Please enter values between 100 and 99999.");
    return;
  }
  let start = Number(first);
  let end = Number(last);
  if (start > end) {
    [start, end] = [end, start];
  }

  if (end - start + 1 > 101) {
    results.innerHTML = `
        <p>Your search contains more than 100 positions. Please reduce your search area.</p>
    `;
    return;
  }

  const token = localStorage.getItem("token");
  const response = await fetch(`/api/trees/positions/${start}/${end}`, {
    headers: {
      Authorization: token,
    },
  });

  const trees = await response.json();

  const treeMap = new Map(trees.map((t) => [t.position, t]));

  const rows = [];
  for (let pos = start; pos <= end; pos++) {
    const tree = treeMap.get(pos);
    rows.push(
      tree
        ? `
            <tr>
                <td>${tree.position}</td>
                <td>${tree.tag}</td>
                <td>${tree.colour}</td>
                <td>${tree.bagSize}</td>
                <td><input type="checkbox" data-tag="${tree.tag}" data-position="${tree.position}"></td>
            </tr>`
        : `
            <tr>
                <td>${pos}</td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            </tr>`,
    );
  }

  results.innerHTML = `
    <table border="1">
        <tr>
            <button id="saveButton">Submit</button>
            <th>Position</th>
            <th>Tag</th>
            <th>Flower colour</th>
            <th>Bag size</th>
            <th>Missing</th>
        </tr>
        ${rows.join("")}
    </table>
`;

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const tag = this.dataset.tag;
      const position = Number(this.dataset.position);
      const newPosition = position < 50000 ? position + 70000 : position;
    });
  });

  const saveButton = document.getElementById("saveButton");
  saveButton.addEventListener("click", async function () {
    const checked = document.querySelectorAll('input[type="checkbox"]:checked');
    if (checked.length === 0) {
      alert("Please select at least one tree.");
      return;
    }
    for (const checkbox of checked) {
      const tag = checkbox.dataset.tag;
      const position = Number(checkbox.dataset.position);
      const newPosition = position < 50000 ? position + 70000 : position;
      const response = await fetch(`/api/trees/${tag}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: localStorage.getItem("token"),
        },
        body: JSON.stringify({
          position: newPosition,
        }),
      });
      const savedTree = await response.json();
    }
    findButton.click();
  });
});
