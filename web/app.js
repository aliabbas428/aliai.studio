const workspace = document.getElementById("workspace");
document.getElementById("newProject").addEventListener("click", () => {
  const name = prompt("Project name:");
  if (name) workspace.textContent = `Project: ${name}`;
});
document.getElementById("docs").addEventListener("click", () => {
  window.location.href = "/docs/OPENCODE.md";
});
