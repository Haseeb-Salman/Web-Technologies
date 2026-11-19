<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page import="java.sql.*" %>
<%@ page import="java.security.*" %>
<%@ page import="javax.crypto.*" %>
<%@ page import="javax.crypto.spec.*" %>
<%@ page import="java.util.*" %>
<%@ include file="../includes/db.jsp" %>
<%@ include file="../includes/auth.jsp" %>
<%!
private String html(String value) {
    if (value == null) return "";
    return value.replace("&", "&amp;").replace("<", "&lt;")
                .replace(">", "&gt;").replace("\"", "&quot;")
                .replace("'", "&#x27;");
}
private String makePasswordHash(String password) throws Exception {
    byte[] salt = new byte[16];
    new SecureRandom().nextBytes(salt);
    PBEKeySpec spec = new PBEKeySpec(password.toCharArray(), salt, 120000, 256);
    byte[] hash = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
                    .generateSecret(spec).getEncoded();
    spec.clearPassword();
    return Base64.getEncoder().encodeToString(salt) + ":" +
           Base64.getEncoder().encodeToString(hash);
}
%>
<%
if (!"ADMIN".equals(session.getAttribute("role"))) { response.sendError(403); return; }

String message = null;
String messageType = "success";
String csrf = (String) session.getAttribute("carepointCsrf");
if (csrf == null) {
    byte[] tokenBytes = new byte[32];
    new SecureRandom().nextBytes(tokenBytes);
    csrf = Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    session.setAttribute("carepointCsrf", csrf);
}

if ("POST".equalsIgnoreCase(request.getMethod())) {
    String submittedToken = request.getParameter("csrfToken");
    if (submittedToken == null || !MessageDigest.isEqual(csrf.getBytes("UTF-8"), submittedToken.getBytes("UTF-8"))) {
        response.sendError(403, "Invalid security token. Refresh the page and try again.");
        return;
    }

    String action = request.getParameter("action");
    try (Connection con = getDBConnection()) {
        if ("save".equals(action)) {
            String name = request.getParameter("fullName");
            String email = request.getParameter("email");
            String password = request.getParameter("password");
            String departmentValue = request.getParameter("departmentId");
            String specialization = request.getParameter("specialization");
            String qualification = request.getParameter("qualification");
            String feeValue = request.getParameter("consultationFee");
            String days = request.getParameter("availableDays");
            String doctorValue = request.getParameter("doctorId");

            if (name == null || name.trim().isEmpty() || name.trim().length() > 120 ||
                email == null || !email.matches("^[A-Za-z0-9._%+\\-]+@[A-Za-z0-9.\\-]+\\.[A-Za-z]{2,}$") ||
                specialization == null || specialization.trim().isEmpty() || specialization.trim().length() > 120 ||
                qualification == null || qualification.trim().length() > 160 ||
                days == null || days.trim().isEmpty() || days.trim().length() > 120) {
                throw new IllegalArgumentException("Please enter valid values in all required fields.");
            }
            int departmentId = Integer.parseInt(departmentValue);
            java.math.BigDecimal fee = new java.math.BigDecimal(feeValue);
            if (fee.signum() < 0 || fee.compareTo(new java.math.BigDecimal("99999999.99")) > 0) {
                throw new IllegalArgumentException("Consultation fee must be between 0 and 99,999,999.99.");
            }
            email = email.trim().toLowerCase(Locale.ROOT);
            con.setAutoCommit(false);
            try {
                if (doctorValue == null || doctorValue.trim().isEmpty()) {
                    if (password == null || password.length() < 8) {
                        throw new IllegalArgumentException("A new doctor password must contain at least 8 characters.");
                    }
                    String passwordHash = makePasswordHash(password);
                    int userId;
                    try (PreparedStatement userInsert = con.prepareStatement(
                            "INSERT INTO users (full_name,email,password_hash,role) VALUES (?,?,?,'DOCTOR')",
                            Statement.RETURN_GENERATED_KEYS)) {
                        userInsert.setString(1, name.trim());
                        userInsert.setString(2, email);
                        userInsert.setString(3, passwordHash);
                        userInsert.executeUpdate();
                        try (ResultSet keys = userInsert.getGeneratedKeys()) {
                            if (!keys.next()) throw new SQLException("Could not create doctor account.");
                            userId = keys.getInt(1);
                        }
                    }
                    try (PreparedStatement doctorInsert = con.prepareStatement(
                            "INSERT INTO doctors (user_id,department_id,specialization,qualification,consultation_fee,available_days,is_active) VALUES (?,?,?,?,?,?,1)")) {
                        doctorInsert.setInt(1, userId);
                        doctorInsert.setInt(2, departmentId);
                        doctorInsert.setString(3, specialization.trim());
                        doctorInsert.setString(4, qualification.trim());
                        doctorInsert.setBigDecimal(5, fee);
                        doctorInsert.setString(6, days.trim());
                        doctorInsert.executeUpdate();
                    }
                    message = "Doctor account and profile created successfully.";
                } else {
                    int doctorId = Integer.parseInt(doctorValue);
                    int userId;
                    try (PreparedStatement find = con.prepareStatement("SELECT user_id FROM doctors WHERE id=?")) {
                        find.setInt(1, doctorId);
                        try (ResultSet rs = find.executeQuery()) {
                            if (!rs.next()) throw new IllegalArgumentException("Doctor record was not found.");
                            userId = rs.getInt(1);
                        }
                    }
                    try (PreparedStatement userUpdate = con.prepareStatement(
                            "UPDATE users SET full_name=?, email=? WHERE id=? AND role='DOCTOR'")) {
                        userUpdate.setString(1, name.trim());
                        userUpdate.setString(2, email);
                        userUpdate.setInt(3, userId);
                        if (userUpdate.executeUpdate() != 1) throw new SQLException("Doctor account could not be updated.");
                    }
                    try (PreparedStatement doctorUpdate = con.prepareStatement(
                            "UPDATE doctors SET department_id=?, specialization=?, qualification=?, consultation_fee=?, available_days=? WHERE id=?")) {
                        doctorUpdate.setInt(1, departmentId);
                        doctorUpdate.setString(2, specialization.trim());
                        doctorUpdate.setString(3, qualification.trim());
                        doctorUpdate.setBigDecimal(4, fee);
                        doctorUpdate.setString(5, days.trim());
                        doctorUpdate.setInt(6, doctorId);
                        doctorUpdate.executeUpdate();
                    }
                    if (password != null && !password.isEmpty()) {
                        if (password.length() < 8) throw new IllegalArgumentException("New password must contain at least 8 characters.");
                        try (PreparedStatement passwordUpdate = con.prepareStatement("UPDATE users SET password_hash=? WHERE id=?")) {
                            passwordUpdate.setString(1, makePasswordHash(password));
                            passwordUpdate.setInt(2, userId);
                            passwordUpdate.executeUpdate();
                        }
                    }
                    message = "Doctor details updated successfully.";
                }
                con.commit();
            } catch (Exception saveError) {
                try { con.rollback(); } catch (SQLException ignored) { }
                throw saveError;
            } finally {
                try { con.setAutoCommit(true); } catch (SQLException ignored) { }
            }
        } else if ("toggle".equals(action)) {
            int doctorId = Integer.parseInt(request.getParameter("doctorId"));
            int active = "1".equals(request.getParameter("active")) ? 1 : 0;
            try (PreparedStatement update = con.prepareStatement("UPDATE doctors SET is_active=? WHERE id=?")) {
                update.setInt(1, active);
                update.setInt(2, doctorId);
                if (update.executeUpdate() != 1) throw new IllegalArgumentException("Doctor record was not found.");
            }
            message = active == 1 ? "Doctor account activated." : "Doctor account deactivated.";
        } else {
            throw new IllegalArgumentException("Unknown request.");
        }
    } catch (SQLIntegrityConstraintViolationException duplicate) {
        message = "This email address is already registered.";
        messageType = "alert";
    } catch (IllegalArgumentException validation) {
        message = validation.getMessage();
        messageType = "alert";
    } catch (Exception ex) {
        application.log("Admin doctor management error", ex);
        message = "The operation could not be completed. Check the server log and database connection.";
        messageType = "alert";
    }
}

int editId = 0;
try { editId = Integer.parseInt(request.getParameter("edit")); } catch (Exception ignored) { }
String editName = "", editEmail = "", editSpecialization = "", editQualification = "", editDays = "Monday-Friday";
String editFee = "";
int editDepartment = 0;
if (editId > 0) {
    try (Connection c = getDBConnection(); PreparedStatement p = c.prepareStatement(
            "SELECT u.full_name,u.email,d.department_id,d.specialization,d.qualification,d.consultation_fee,d.available_days FROM doctors d JOIN users u ON u.id=d.user_id WHERE d.id=?")) {
        p.setInt(1, editId);
        try (ResultSet rs = p.executeQuery()) {
            if (rs.next()) {
                editName = rs.getString("full_name"); editEmail = rs.getString("email");
                editDepartment = rs.getInt("department_id"); editSpecialization = rs.getString("specialization");
                editQualification = rs.getString("qualification"); editFee = rs.getBigDecimal("consultation_fee").toPlainString();
                editDays = rs.getString("available_days");
            } else { editId = 0; message = "Doctor record was not found."; messageType = "alert"; }
        }
    } catch (Exception ex) { application.log("Doctor edit load error", ex); message = "Unable to load doctor details."; messageType = "alert"; }
}
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Doctors | CarePoint Admin</title>
    <link rel="stylesheet" href="../css/style.css">
</head>
<body class="carepoint-app">
<div class="admin-layout">
<aside class="admin-sidebar">
  <a class="sidebar-brand" href="admin-dashboard.jsp"><span class="brand-mark">✚</span><span>CarePoint<small>HEALTHCARE PORTAL</small></span></a>
  <div class="sidebar-label">WORKSPACE</div>
  <a class="side-link" href="admin-dashboard.jsp"><span>▦</span> Overview</a>
  <a class="side-link active" href="manage-doctors.jsp"><span>♙</span> Doctors</a>
  <a class="side-link" href="../my-appointments.jsp"><span>▤</span> Appointments</a>
  <a class="side-link" href="../doctors.jsp"><span>✚</span> Doctor directory</a>
  <div class="sidebar-bottom"><div class="sidebar-user"><span class="user-avatar"><%=String.valueOf(session.getAttribute("name")).substring(0,1).toUpperCase()%></span><span><b><%=session.getAttribute("name")%></b><small>Administrator</small></span></div><a class="side-link logout-link" href="../logout.jsp"><span>↪</span> Sign out</a></div>
</aside>
<div class="admin-content">
<header class="topbar"><div><span class="topbar-kicker">ADMINISTRATION</span><strong>Doctor management</strong></div><div class="topbar-right"><span class="online-dot"></span> System overview <span class="topbar-avatar">A</span></div></header>
<main class="dashboard admin-page">
    <span class="eyebrow">ADMINISTRATION</span>
    <h1>Doctor management</h1>
    <p>Add doctors, maintain their professional profiles and control whether they can receive new appointments.</p>
    <% if (message != null) { %><div class="<%=messageType%>"><%=html(message)%></div><% } %>

    <section class="admin-form-panel">
        <div class="panel-heading">
            <div><span class="eyebrow"><%=editId > 0 ? "UPDATE PROFILE" : "NEW TEAM MEMBER"%></span>
            <h2><%=editId > 0 ? "Edit doctor" : "Add a doctor"%></h2></div>
            <% if (editId > 0) { %><a class="btn secondary small" href="manage-doctors.jsp">Cancel edit</a><% } %>
        </div>
        <form method="post" action="manage-doctors.jsp" class="doctor-form">
            <input type="hidden" name="csrfToken" value="<%=html(csrf)%>">
            <input type="hidden" name="action" value="save">
            <input type="hidden" name="doctorId" value="<%=editId > 0 ? editId : ""%>">
            <div class="form-grid">
                <div><label>Full name *</label><input name="fullName" required maxlength="120" value="<%=html(editName)%>" placeholder="e.g. Dr. Ahmed Khan"></div>
                <div><label>Email address *</label><input type="email" name="email" required maxlength="160" value="<%=html(editEmail)%>" placeholder="doctor@example.com"></div>
                <div><label><%=editId > 0 ? "New password (optional)" : "Temporary login password *"%></label><input type="password" name="password" <%=editId > 0 ? "" : "required"%> minlength="8" autocomplete="new-password" placeholder="At least 8 characters"><small><%=editId > 0 ? "Leave blank to keep the current password." : "Share this securely with the doctor; they can change it later."%></small></div>
                <div><label>Department *</label><select name="departmentId" required><option value="">Choose department</option>
                    <% try (Connection c = getDBConnection(); PreparedStatement p = c.prepareStatement("SELECT id,name FROM departments ORDER BY name"); ResultSet rs = p.executeQuery()) { while (rs.next()) { %>
                    <option value="<%=rs.getInt("id")%>" <%=editDepartment == rs.getInt("id") ? "selected" : ""%>><%=html(rs.getString("name"))%></option>
                    <% } } catch (Exception ex) { application.log("Department list error", ex); } %>
                </select></div>
                <div><label>Specialization *</label><input name="specialization" required maxlength="120" value="<%=html(editSpecialization)%>" placeholder="e.g. Cardiologist"></div>
                <div><label>Qualification</label><input name="qualification" maxlength="160" value="<%=html(editQualification)%>" placeholder="e.g. MBBS, FCPS"></div>
                <div><label>Consultation fee (Rs.) *</label><input type="number" name="consultationFee" required min="0" max="99999999.99" step="0.01" value="<%=html(editFee)%>" placeholder="1500"></div>
                <div><label>Available days *</label><input name="availableDays" required maxlength="120" value="<%=html(editDays)%>" placeholder="Monday-Friday"></div>
            </div>
            <button class="btn" type="submit"><%=editId > 0 ? "Save changes" : "Create doctor account"%></button>
        </form>
    </section>

    <section class="admin-list-section">
        <div class="panel-heading"><div><span class="eyebrow">CAREPOINT MEDICAL TEAM</span><h2>All doctors</h2></div></div>
        <div class="table-wrap">
            <table class="admin-table">
                <thead><tr><th>Doctor</th><th>Department</th><th>Specialization</th><th>Fee</th><th>Availability</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                <% boolean anyDoctors = false;
                   String listSql = "SELECT d.id,u.full_name,u.email,d.specialization,d.qualification,d.consultation_fee,d.available_days,d.is_active,dep.name AS department_name FROM doctors d JOIN users u ON u.id=d.user_id LEFT JOIN departments dep ON dep.id=d.department_id ORDER BY d.is_active DESC,u.full_name";
                   try (Connection c = getDBConnection(); PreparedStatement p = c.prepareStatement(listSql); ResultSet rs = p.executeQuery()) {
                       while (rs.next()) { anyDoctors = true; %>
                    <tr>
                        <td><strong><%=html(rs.getString("full_name"))%></strong><small><%=html(rs.getString("email"))%></small></td>
                        <td><%=html(rs.getString("department_name"))%></td>
                        <td><%=html(rs.getString("specialization"))%><small><%=html(rs.getString("qualification"))%></small></td>
                        <td>Rs. <%=rs.getBigDecimal("consultation_fee")%></td>
                        <td><%=html(rs.getString("available_days"))%></td>
                        <td><span class="status <%=rs.getBoolean("is_active") ? "status-active" : "status-inactive"%>"><%=rs.getBoolean("is_active") ? "Active" : "Inactive"%></span></td>
                        <td><div class="action-stack"><a class="btn tiny secondary" href="manage-doctors.jsp?edit=<%=rs.getInt("id")%>">Edit</a>
                            <form method="post" action="manage-doctors.jsp" onsubmit="return confirm('Change this doctor account status?');">
                                <input type="hidden" name="csrfToken" value="<%=html(csrf)%>"><input type="hidden" name="action" value="toggle"><input type="hidden" name="doctorId" value="<%=rs.getInt("id")%>"><input type="hidden" name="active" value="<%=rs.getBoolean("is_active") ? "0" : "1"%>">
                                <button class="btn tiny <%=rs.getBoolean("is_active") ? "danger" : ""%>" type="submit"><%=rs.getBoolean("is_active") ? "Deactivate" : "Activate"%></button>
                            </form></div></td>
                    </tr>
                <% } if (!anyDoctors) { %><tr><td colspan="7" class="empty-cell">No doctor profiles yet. Use the form above to add your first doctor.</td></tr><% }
                   } catch (Exception ex) { application.log("Admin doctor list error", ex); %><tr><td colspan="7" class="empty-cell">Unable to load doctors. Run admin-upgrade.sql and check the database connection.</td></tr><% } %>
                </tbody>
            </table>
        </div>
    </section>
</main>
</div></div>
</body>
</html>
