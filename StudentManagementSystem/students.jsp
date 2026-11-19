<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ page import="java.sql.*" %>
<%@ include file="WEB-INF/db.jspf" %>

<%!
    private String esc(String value) {
        if (value == null) return "";
        return value.replace("&", "&amp;")
                    .replace("<", "&lt;")
                    .replace(">", "&gt;")
                    .replace("\"", "&quot;")
                    .replace("'", "&#x27;");
    }
%>

<%
request.setCharacterEncoding("UTF-8");

String message = "";
String error = "";
String action = request.getParameter("action");

String editName = "";
String editRoll = "";
String editEmail = "";
String editDept = "";
String editSemester = "";
int editId = -1;

// Handle form submissions
if ("POST".equalsIgnoreCase(request.getMethod()) && action != null) {
    try {
        if ("add".equals(action) || "update".equals(action)) {
            String name = request.getParameter("name");
            String roll = request.getParameter("roll_no");
            String email = request.getParameter("email");
            String department = request.getParameter("department");
            String semester = request.getParameter("semester");

            if (name == null || name.trim().isEmpty()) {
                throw new Exception("Student name is required.");
            }
            if (roll == null || roll.trim().isEmpty()) {
                throw new Exception("Roll number is required.");
            }

            // Store empty optional values as SQL NULL
            email = (email == null || email.trim().isEmpty()) ? null : email.trim();
            department = (department == null || department.trim().isEmpty()) ? null : department.trim();
            semester = (semester == null || semester.trim().isEmpty()) ? null : semester.trim();

            if ("add".equals(action)) {
                String sql = "INSERT INTO students (name, roll_no, email, department, semester) VALUES (?, ?, ?, ?, ?)";

                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, name.trim());
                    ps.setString(2, roll.trim());
                    ps.setString(3, email);
                    ps.setString(4, department);
                    ps.setString(5, semester);
                    ps.executeUpdate();
                }

                response.sendRedirect("students.jsp?success=added");
                return;

            } else {
                String idValue = request.getParameter("id");
                if (idValue == null || idValue.trim().isEmpty()) {
                    throw new Exception("Student ID is missing. Please click Edit again.");
                }

                int id = Integer.parseInt(idValue);

                String sql = "UPDATE students SET name=?, roll_no=?, email=?, department=?, semester=? WHERE id=?";

                int updatedRows;
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, name.trim());
                    ps.setString(2, roll.trim());
                    ps.setString(3, email);
                    ps.setString(4, department);
                    ps.setString(5, semester);
                    ps.setInt(6, id);
                    updatedRows = ps.executeUpdate();
                }

                if (updatedRows > 0) {
                    response.sendRedirect("students.jsp?success=updated");
                    return;
                } else {
                    throw new Exception("No student record was updated. The student may no longer exist.");
                }
            }

        } else if ("delete".equals(action)) {
            String idValue = request.getParameter("id");
            if (idValue == null || idValue.trim().isEmpty()) {
                throw new Exception("Student ID is missing.");
            }

            int id = Integer.parseInt(idValue);

            try (PreparedStatement ps = conn.prepareStatement("DELETE FROM students WHERE id=?")) {
                ps.setInt(1, id);
                int deletedRows = ps.executeUpdate();

                if (deletedRows == 0) {
                    throw new Exception("Student record was not found.");
                }
            }

            response.sendRedirect("students.jsp?success=deleted");
            return;
        }

    } catch (SQLIntegrityConstraintViolationException ex) {
        error = "This roll number or email is already registered. Please use a different value.";

    } catch (NumberFormatException ex) {
        error = "Invalid student ID. Please try again.";

    } catch (Exception ex) {
        error = (ex.getMessage() == null) ? "Unable to process this request." : ex.getMessage();
    }

    // Keep the submitted values visible if an add/update operation fails
    if ("update".equals(action)) {
        try {
            editId = Integer.parseInt(request.getParameter("id"));
        } catch (Exception ignored) {
            editId = -1;
        }
    }

    if ("add".equals(action) || "update".equals(action)) {
        editName = request.getParameter("name") == null ? "" : request.getParameter("name");
        editRoll = request.getParameter("roll_no") == null ? "" : request.getParameter("roll_no");
        editEmail = request.getParameter("email") == null ? "" : request.getParameter("email");
        editDept = request.getParameter("department") == null ? "" : request.getParameter("department");
        editSemester = request.getParameter("semester") == null ? "" : request.getParameter("semester");
    }
}

// Success messages
String success = request.getParameter("success");
if ("added".equals(success)) message = "Student added successfully.";
if ("updated".equals(success)) message = "Student updated successfully.";
if ("deleted".equals(success)) message = "Student deleted successfully.";

// Load the selected student when Edit is clicked (GET request)
if (!"POST".equalsIgnoreCase(request.getMethod()) && request.getParameter("edit") != null) {
    try {
        editId = Integer.parseInt(request.getParameter("edit"));

        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM students WHERE id=?")) {
            ps.setInt(1, editId);

            try (ResultSet er = ps.executeQuery()) {
                if (er.next()) {
                    editName = er.getString("name");
                    editRoll = er.getString("roll_no");
                    editEmail = er.getString("email");
                    editDept = er.getString("department");
                    editSemester = er.getString("semester");
                } else {
                    editId = -1;
                    error = "The selected student record was not found.";
                }
            }
        }
    } catch (NumberFormatException ex) {
        editId = -1;
        error = "Invalid student ID.";
    }
}

int total = 0;
try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) FROM students");
     ResultSet rs = ps.executeQuery()) {
    if (rs.next()) total = rs.getInt(1);
}
%>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Students | StudentHub</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<div class="app-shell">
    <aside class="sidebar">
        <a class="brand" href="index.jsp">
            <span class="brand-mark">S</span>
            <span>Student<span class="brand-light">Hub</span></span>
        </a>

        <div class="nav-caption">WORKSPACE</div>
        <a class="nav-link" href="index.jsp">▦ &nbsp; Dashboard</a>
        <a class="nav-link active" href="students.jsp">♙ &nbsp; Students</a>

        <div class="sidebar-bottom">
            Student Management System<br>
            <small>JSP · MySQL · Tomcat</small>
        </div>
    </aside>

    <main class="main-content">
        <header class="topbar">
            <div>
                <div class="eyebrow">DIRECTORY</div>
                <h1>Students</h1>
            </div>
            <span class="status-pill"><i></i> <%= total %> records</span>
        </header>

        <% if (!message.isEmpty()) { %>
            <div class="alert alert-success"><%= esc(message) %></div>
        <% } %>

        <% if (!error.isEmpty()) { %>
            <div class="alert alert-danger"><%= esc(error) %></div>
        <% } %>

        <section class="form-card">
            <div class="section-heading">
                <div>
                    <div class="eyebrow"><%= editId > 0 ? "UPDATE RECORD" : "NEW RECORD" %></div>
                    <h3><%= editId > 0 ? "Edit student" : "Add a student" %></h3>
                </div>
            </div>

            <form method="post" action="students.jsp" class="row g-3">
                <input type="hidden" name="action" value="<%= (editId > 0) ? "update" : "add" %>">

                <% if (editId > 0) { %>
                    <input type="hidden" name="id" value="<%= editId %>">
                <% } %>

                <div class="col-md-6">
                    <label class="form-label">Student name *</label>
                    <input class="form-control" name="name" required maxlength="100"
                           placeholder="e.g. Ali Ahmed" value="<%= esc(editName) %>">
                </div>

                <div class="col-md-6">
                    <label class="form-label">Roll number *</label>
                    <input class="form-control" name="roll_no" required maxlength="30"
                           placeholder="e.g. BSIT-023" value="<%= esc(editRoll) %>">
                </div>

                <div class="col-md-6">
                    <label class="form-label">Email address</label>
                    <input class="form-control" type="email" name="email" maxlength="120"
                           placeholder="student@example.com" value="<%= esc(editEmail) %>">
                </div>

                <div class="col-md-6">
                    <label class="form-label">Department</label>
                    <input class="form-control" name="department" maxlength="80"
                           placeholder="e.g. Information Technology" value="<%= esc(editDept) %>">
                </div>

                <div class="col-md-6">
                    <label class="form-label">Semester</label>
                    <select class="form-select" name="semester">
                        <option value="">Select semester</option>
                        <%
                            for (int s = 1; s <= 8; s++) {
                                String sv = s + "th Semester";
                                if (s == 1) sv = "1st Semester";
                                if (s == 2) sv = "2nd Semester";
                                if (s == 3) sv = "3rd Semester";
                        %>
                            <option value="<%= sv %>" <%= sv.equals(editSemester) ? "selected" : "" %>>
                                <%= sv %>
                            </option>
                        <% } %>
                    </select>
                </div>

                <div class="col-12 d-flex gap-2">
                    <button class="btn btn-primary rounded-pill px-4" type="submit">
                        <%= editId > 0 ? "Save changes" : "Add student" %>
                    </button>

                    <% if (editId > 0) { %>
                        <a class="btn btn-outline-secondary rounded-pill px-4" href="students.jsp">Cancel</a>
                    <% } %>
                </div>
            </form>
        </section>

        <section class="table-card">
            <div class="table-top">
                <div>
                    <div class="eyebrow">DATABASE</div>
                    <h3>Student directory</h3>
                </div>
                <input id="studentSearch" class="form-control search-box" placeholder="Search students...">
            </div>

            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                    <tr>
                        <th>STUDENT</th>
                        <th>ROLL NUMBER</th>
                        <th>DEPARTMENT</th>
                        <th>SEMESTER</th>
                        <th>ACTIONS</th>
                    </tr>
                    </thead>

                    <tbody id="studentRows">
                    <%
                        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM students ORDER BY id DESC");
                             ResultSet rs = ps.executeQuery()) {

                            boolean found = false;

                            while (rs.next()) {
                                found = true;
                                int id = rs.getInt("id");
                                String nm = rs.getString("name");
                                String rl = rs.getString("roll_no");
                                String em = rs.getString("email");
                                String dp = rs.getString("department");
                                String sm = rs.getString("semester");
                    %>
                        <tr>
                            <td>
                                <div class="student-cell">
                                    <span class="avatar"><%= (nm != null && !nm.isEmpty()) ? esc(nm.substring(0, 1).toUpperCase()) : "S" %></span>
                                    <div>
                                        <strong><%= esc(nm) %></strong>
                                        <small><%= esc(em) %></small>
                                    </div>
                                </div>
                            </td>
                            <td><span class="roll-tag"><%= esc(rl) %></span></td>
                            <td><%= (dp == null || dp.isEmpty()) ? "—" : esc(dp) %></td>
                            <td><%= (sm == null || sm.isEmpty()) ? "—" : esc(sm) %></td>
                            <td>
                                <div class="d-flex gap-2">
                                    <a class="action-link" href="students.jsp?edit=<%= id %>">Edit</a>

                                    <form method="post" action="students.jsp" onsubmit="return confirmDelete()">
                                        <input type="hidden" name="action" value="delete">
                                        <input type="hidden" name="id" value="<%= id %>">
                                        <button class="action-link delete-link" type="submit">Delete</button>
                                    </form>
                                </div>
                            </td>
                        </tr>
                    <%
                            }

                            if (!found) {
                    %>
                        <tr>
                            <td colspan="5" class="empty-state">
                                No student records yet. Add your first student using the form above.
                            </td>
                        </tr>
                    <%
                            }
                        }
                    %>
                    </tbody>
                </table>
            </div>
        </section>

        <footer>© 2026 StudentHub · Student Management System</footer>
    </main>
</div>

<script src="assets/js/app.js"></script>
</body>
</html>
