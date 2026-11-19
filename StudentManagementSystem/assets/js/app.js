document.addEventListener("DOMContentLoaded", function () {
  const search = document.getElementById("studentSearch");
  if (search) {
    search.addEventListener("input", function () {
      const term = this.value.toLowerCase().trim();
      document.querySelectorAll("#studentRows tr").forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? "" : "none";
      });
    });
  }
});
function confirmDelete() {
  return window.confirm("Are you sure you want to delete this student record?");
}
