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
    Number(first) < 101 ||
    Number(first) > 99999 ||
    Number(last) < 101 ||
    Number(last) > 999999
  ) {
    alert("Please enter values between 101 and 99999.");
    return;
  }

  let start = Number(first);
  let end = Number(last);

  if (start > end) {
    [start, end] = [end, start];
  }

  const token = localStorage.getItem("token");

  const response = await fetch(`/api/trees/positions/${start}/${end}`, {
    headers: {
      Authorization: token,
    },
  });

  console.log("Status:", response.status);

  const trees = await response.json();

  console.log("Trees returned:", trees);

  if (trees.length === 0) {
    results.innerHTML = `
        <p>No trees found between positions ${start} and ${end}.</p>
    `;
    return;
  }

  if (trees.length > 30) {
    results.innerHTML = `
        <p>Your search contains more than 30 trees. Please reduce your search area.</p>
    `;
    return;
  }

  results.innerHTML = `
    <table border="1">
        <tr>
            <th>Position</th>
            <th>Tag</th>
            <th>Flower colour</th>
            <th>Bag size</th>
            <th>Missing</th>
        </tr>

        ${trees
          .map(
            (tree) => `
            <tr>
                <td>${tree.position}</td>
                <td>${tree.tag}</td>
                <td>${tree.colour}</td>
                <td>${tree.bagSize}</td>
                <td><input type="checkbox" data-tag="${tree.tag}" data-position="${tree.position}"></td>
            </tr>
        `,
          )
          .join("")}
    </table>
    <button id="saveButton">Submit</button>
`;

  const checkboxes = document.querySelectorAll('input[type="checkbox"]');

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", function () {
      const tag = this.dataset.tag;
      const position = Number(this.dataset.position);

      const newPosition = position < 50000 ? position + 70000 : position;

      console.log("Tree:", tag, "New position:", newPosition);
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
      console.log("Submit raw position:", checkbox.dataset.position);

      const position = Number(checkbox.dataset.position);

      const newPosition = position < 50000 ? position + 70000 : position;

      console.log("Saving:", tag, "→", newPosition);

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

      console.log("Saved tree:", savedTree);
    }
    findButton.click();
  });
});