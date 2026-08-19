const params = new URLSearchParams(window.location.search);
const tag = params.get("tag"); const prompt = document.getElementById("prompt"); const message = document.getElementById("message"); const addButton = document.getElementById("add-button");
if (!tag) { message.textContent = "No tree tag was supplied."; addButton.disabled = true; } else { prompt.textContent = `Tree ${tag} was not found. Would you like to add it?`; addButton.addEventListener("click", () => { window.location.href = `/forms/edit-tree.html?mode=add&tag=${encodeURIComponent(tag)}`; }); }
