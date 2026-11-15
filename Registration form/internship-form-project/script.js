/* =========================================================
   INTERNSHIP REGISTRATION — FORM INTERACTIONS
   Separate JavaScript file: script.js
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("internshipForm");
  const photoInput = document.getElementById("photo");
  const photoPreview = document.getElementById("photoPreview");
  const uploadBox = document.getElementById("uploadBox");
  const uploadIcon = document.getElementById("uploadIcon");
  const hoursSlider = document.getElementById("hours");
  const hoursOutput = document.getElementById("hoursOut");
  const submittedAt = document.getElementById("submittedAt");
  const applicationID = document.getElementById("applicationID");
  const successBox = document.getElementById("successBox");
  const favColor = document.getElementById("favColor");

  let currentPhotoURL = null;

  // Keep the weekly-hours label in sync with the slider.
  function updateHours() {
    hoursOutput.textContent = `${hoursSlider.value} hrs`;
  }
  hoursSlider.addEventListener("input", updateHours);
  updateHours();

  // Preview the selected profile picture and validate its size/type.
  photoInput.addEventListener("change", () => {
    const file = photoInput.files && photoInput.files[0];

    if (!file) {
      clearPhotoPreview();
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const maxBytes = 2 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      photoInput.setCustomValidity("Please choose a JPG, PNG, GIF, or WebP image.");
      photoInput.reportValidity();
      photoInput.value = "";
      clearPhotoPreview();
      return;
    }

    if (file.size > maxBytes) {
      photoInput.setCustomValidity("Your profile picture must be 2 MB or smaller.");
      photoInput.reportValidity();
      photoInput.value = "";
      clearPhotoPreview();
      return;
    }

    photoInput.setCustomValidity("");
    if (currentPhotoURL) URL.revokeObjectURL(currentPhotoURL);
    currentPhotoURL = URL.createObjectURL(file);
    photoPreview.src = currentPhotoURL;
    uploadBox.classList.add("has-photo");
    uploadIcon.setAttribute("aria-hidden", "true");
  });

  function clearPhotoPreview() {
    if (currentPhotoURL) {
      URL.revokeObjectURL(currentPhotoURL);
      currentPhotoURL = null;
    }
    photoPreview.removeAttribute("src");
    uploadBox.classList.remove("has-photo");
    photoInput.setCustomValidity("");
  }

  // Set a sensible earliest date for internship availability.
  const startDate = document.getElementById("startDate");
  const today = new Date();
  const localToday = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");
  startDate.min = localToday;

  // The chosen badge colour updates the accent colour used by the form.
  favColor.addEventListener("input", () => {
    document.documentElement.style.setProperty("--teal", favColor.value);
  });

  // Demo submission: validates, then shows a local confirmation.
  // This does NOT send or save the application to a server.
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    successBox.classList.remove("error");
    successBox.classList.remove("show");

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const skills = [...form.querySelectorAll('input[name="skills"]:checked')];
    if (skills.length === 0) {
      successBox.textContent = "Please select at least one skill before submitting.";
      successBox.classList.add("show", "error");
      form.querySelector('input[name="skills"]').focus();
      return;
    }

    submittedAt.value = new Date().toISOString();
    applicationID.value = "INT-" + Date.now().toString(36).toUpperCase();

    successBox.textContent =
      `Thanks, ${document.getElementById("fullName").value.trim()}! ` +
      `Your form passed the browser checks. Demo application ID: ${applicationID.value}. ` +
      "This is only a local demo; the application has not been sent to or saved on a server.";

    successBox.classList.add("show");
    successBox.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  // Reset visual states as well as the browser's form controls.
  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      clearPhotoPreview();
      updateHours();
      successBox.textContent = "";
      successBox.classList.remove("show", "error");
      document.documentElement.style.setProperty("--teal", "#55ead1");
      favColor.value = "#7c3aed";
      submittedAt.value = "";
      applicationID.value = "";
    }, 0);
  });
});
