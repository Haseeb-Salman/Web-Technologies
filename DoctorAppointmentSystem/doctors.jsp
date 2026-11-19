
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page import="java.sql.*" %>
<%@ include file="includes/db.jsp" %>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Our Doctors | CarePoint</title>
    <link rel="stylesheet" href="css/style.css">
</head>

<body>

<nav>
    <a class="brand"
       href="<%= session.getAttribute("userId") != null ? "dashboard.jsp" : "index.jsp" %>">
        ✚ CarePoint
    </a>

    <div class="nav-links">
        <% if (session.getAttribute("userId") != null) { %>
            <a href="dashboard.jsp">Home</a>
            <a href="dashboard.jsp">Dashboard</a>
            <a href="logout.jsp">Logout</a>
        <% } else { %>
            <a href="index.jsp">Home</a>
            <a href="login.jsp">Login</a>
            <a class="btn small" href="register.jsp">Register</a>
        <% } %>
    </div>
</nav>

<main class="dashboard">

    <span class="eyebrow">OUR MEDICAL TEAM</span>
    <h1>Find your doctor</h1>
    <p>Explore our active medical professionals and their consultation details.</p>

    <div class="cards">

        <%
        boolean found = false;

        String sql =
            "SELECT d.id, u.full_name, d.specialization, " +
            "d.qualification, d.consultation_fee, " +
            "dep.name AS department_name " +
            "FROM doctors d " +
            "JOIN users u ON d.user_id = u.id " +
            "LEFT JOIN departments dep ON dep.id = d.department_id " +
            "WHERE u.role = 'DOCTOR' AND d.is_active = 1 " +
            "ORDER BY u.full_name";

        try (
            Connection con = getDBConnection();
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery()
        ) {

            while (rs.next()) {
                found = true;

                int currentDoctorId = rs.getInt("id");
        %>

        <article class="doctor-public-card">

            <div class="doctor-avatar">✚</div>

            <h3><%= rs.getString("full_name") %></h3>

            <span class="doctor_department">
                <%= rs.getString("department_name") == null
                    ? "Medical Department"
                    : rs.getString("department_name") %>
            </span>

            <p>
                <strong>Specialization:</strong>
                <%= rs.getString("specialization") == null
                    ? "Not provided"
                    : rs.getString("specialization") %>
            </p>

            <p>
                <strong>Qualification:</strong>
                <%= rs.getString("qualification") == null
                    ? "Not provided"
                    : rs.getString("qualification") %>
            </p>

            <p>
                <strong>Consultation fee:</strong>
                Rs. <%= rs.getBigDecimal("consultation_fee") %>
            </p>

            <% if ("PATIENT".equals(session.getAttribute("role"))) { %>

                <a class="btn full"
                   href="book-appointment.jsp?doctorId=<%= currentDoctorId %>">
                    Book Appointment
                </a>

            <% } else if (session.getAttribute("userId") == null) { %>

                <a class="btn full" href="login.jsp">
                    Login to Book
                </a>

            <% } else { %>

                <a class="btn full" href="dashboard.jsp">
                    Patient Login Required
                </a>

            <% } %>

        </article>

        <%
            }

            if (!found) {
        %>

            <div class="empty-state">
                <h3>Doctors will appear here soon</h3>
                <p>There are currently no active doctor profiles available.</p>
            </div>

        <%
            }

        } catch (Exception ex) {
            application.log("Doctors page database error", ex);
        %>

            <div class="alert">
                Unable to load doctors. Please check the database setup.
            </div>

        <%
        }
        %>

    </div>
</main>

</body>
</html>
