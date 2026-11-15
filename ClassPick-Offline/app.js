
const MAX_STUDENTS = 50;

const STORAGE_KEY = "classpick_students_v1";

let students = [];
let pickedIds = new Set();

const $ = id => document.getElementById(id);

// Protect the dashboard with a basic login check
if (sessionStorage.getItem("classpick_logged_in") !== "yes") {

    window.location.replace("login.html");

} else {

    initialize();

}

// Load saved students
function readStudents() {

    try {

        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return Array.isArray(saved) ? saved : [];

    } catch {

        return [];

    }

}

// Save students in browser storage
function saveStudents() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(students)
    );

}

// Sort students by roll number
function sortStudents() {

    students.sort((a, b) => {

        return String(a.roll).localeCompare(
            String(b.roll),
            undefined,
            {
                numeric: true,
                sensitivity: "base"
            }
        );

    });

}

// Display messages
function showMessage(message, error = false) {

    $("statusMessage").textContent = message;

    $("statusMessage").className =
        error ? "message error" : "message success";

}

// Initialize project
function initialize() {

    students = readStudents();

    sortStudents();

    $("welcomeUser").textContent =
        sessionStorage.getItem("classpick_username") || "Administrator";

    $("studentForm").addEventListener("submit", addStudent);

    $("searchInput").addEventListener("input", event => {
        renderStudents(event.target.value);
    });

    $("pickButton").addEventListener("click", pickStudent);

    $("resetButton").addEventListener("click", resetRound);

    $("clearButton").addEventListener("click", clearStudents);

    $("logoutButton").addEventListener("click", logout);

    renderStudents();

    updateRoundInfo();

}

// Render student table
function renderStudents(search = "") {

    const tbody = $("studentList");

    tbody.replaceChildren();

    const query = search.trim().toLowerCase();

    const filtered = students.filter(student => {

        return (
            student.name.toLowerCase().includes(query) ||
            student.roll.toLowerCase().includes(query)
        );

    });

    if (!filtered.length) {

        const row = document.createElement("tr");

        const cell = document.createElement("td");

        cell.colSpan = 4;

        cell.textContent = students.length
            ? "No matching students found."
            : "No students added yet.";

        row.appendChild(cell);

        tbody.appendChild(row);

    } else {

        filtered.forEach(student => {

            const row = document.createElement("tr");

            const serial = students.findIndex(
                s => s.id === student.id
            ) + 1;

            [serial, student.name, student.roll].forEach(value => {

                const cell = document.createElement("td");

                cell.textContent = value;

                row.appendChild(cell);

            });

            const action = document.createElement("td");

            const remove = document.createElement("button");

            remove.className = "danger small";

            remove.textContent = "Remove";

            remove.addEventListener("click", () => {
                removeStudent(student.id);
            });

            action.appendChild(remove);

            row.appendChild(action);

            tbody.appendChild(row);

        });

    }

    updateRoundInfo();

}

// Update counters
function updateRoundInfo() {

    $("studentCount").textContent =
        `${students.length} / ${MAX_STUDENTS} Students`;

    $("roundInfo").textContent =
        `${pickedIds.size} of ${students.length} students selected this round.`;

    $("addButton").disabled =
        students.length >= MAX_STUDENTS;

}

// Add student
function addStudent(event) {

    event.preventDefault();

    const name = $("nameInput").value.trim();

    const roll = $("rollInput").value.trim();

    if (!name || !roll) {

        return showMessage(
            "Enter both student name and roll number.",
            true
        );

    }

    if (students.length >= MAX_STUDENTS) {

        return showMessage(
            "Maximum 50 students allowed.",
            true
        );

    }

    if (
        students.some(
            s => s.roll.toLowerCase() === roll.toLowerCase()
        )
    ) {

        return showMessage(
            "This roll number already exists.",
            true
        );

    }

    students.push({

        id: crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now() + Math.random()),

        name,

        roll

    });

    sortStudents();

    saveStudents();

    $("studentForm").reset();

    renderStudents($("searchInput").value);

    showMessage("Student added successfully.");

    $("nameInput").focus();

}

// Remove student
function removeStudent(id) {

    if (!confirm("Remove this student?")) return;

    students = students.filter(student => student.id !== id);

    pickedIds.delete(id);

    saveStudents();

    renderStudents($("searchInput").value);

    showMessage("Student removed.");

}

// Random picker
function pickStudent() {

    if (!students.length) {

        return showMessage("Add students first.", true);

    }

    let available = students.filter(
        student => !pickedIds.has(student.id)
    );

    if (!available.length) {

        alert(
            "Everyone has been selected. Starting a new round."
        );

        pickedIds.clear();

        available = [...students];

    }

    const selected = available[
        Math.floor(Math.random() * available.length)
    ];

    pickedIds.add(selected.id);

    $("result").textContent = selected.roll;

    $("studentName").textContent = selected.name;

    $("studentRoll").textContent =
        `Roll Number: ${selected.roll}`;

    $("result").classList.remove("animate");

    void $("result").offsetWidth;

    $("result").classList.add("animate");

    updateRoundInfo();

}

// Start new round
function resetRound() {

    pickedIds.clear();

    $("result").textContent = "?";

    $("result").style.fontSize = "45px";

    $("studentName").textContent = "Ready to Pick!";

    $("studentRoll").textContent = "Roll Number: --";

    updateRoundInfo();

}

// Delete all students
function clearStudents() {

    if (!students.length) {

        return showMessage(
            "There are no students to delete.",
            true
        );

    }

    if (
        !confirm("Permanently delete all students from this browser?")
    ) return;

    students = [];

    pickedIds.clear();

    saveStudents();

    resetRound();

    renderStudents();

    showMessage("All students deleted.");

}

// Logout
function logout() {

    sessionStorage.removeItem("classpick_logged_in");

    sessionStorage.removeItem("classpick_username");

    window.location.replace("login.html");

}
