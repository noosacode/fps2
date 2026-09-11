const tableBody = document.getElementById("task-table-body");
const message = document.getElementById("message");

async function loadTasks() {
  try {
    const response = await fetch("/api/tasks/outside", {
      headers: { Authorization: localStorage.getItem("token") },
    });

    const tasks = await response.json();

    if (!response.ok) {
      message.textContent = tasks.message || "Unable to load tasks.";
      return;
    }

    if (tasks.length === 0) {
      message.textContent = "No outside tasks found.";
      return;
    }

    tasks.forEach((task) => {
      const row = document.createElement("tr");

      const taskCell = document.createElement("td");
      const link = document.createElement("a");
      link.href = `outside-task.html?task=${encodeURIComponent(task.task)}`;
      link.textContent = task.task;
      taskCell.appendChild(link);

      const countCell = document.createElement("td");
      countCell.textContent = task.count;

      const onCell = document.createElement("td");
      onCell.textContent = task.onCount;

      row.append(taskCell, countCell, onCell);
      tableBody.appendChild(row);
    });
  } catch {
    message.textContent = "Unable to connect to the server.";
  }
}

loadTasks();
