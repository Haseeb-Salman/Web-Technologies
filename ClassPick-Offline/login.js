
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "ClassPick@123";

// Redirect if already logged in
if (sessionStorage.getItem("classpick_logged_in") === "yes") {
    window.location.replace("index.html");
}

document.getElementById("loginForm").addEventListener("submit", function(event) {

    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const message = document.getElementById("loginMessage");

    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {

        sessionStorage.setItem("classpick_logged_in", "yes");

        sessionStorage.setItem("classpick_username", username);

        window.location.replace("index.html");

    } else {

        message.textContent = "Incorrect username or password.";

    }

});
