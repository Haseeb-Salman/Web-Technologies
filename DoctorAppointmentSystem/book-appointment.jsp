
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page import="java.sql.*" %>
<%@ page import="java.time.LocalDate" %>
<%@ include file="includes/db.jsp" %>
<%@ include file="includes/auth.jsp" %>

<%
if (!"PATIENT".equals(session.getAttribute("role"))) {
    response.sendRedirect("login.jsp");
    return;
}

String error = null;
String requestedDoctorId = request.getParameter("doctorId");

if ("POST".equalsIgnoreCase(request.getMethod())) {

    String doctorId = request.getParameter("doctorId");
    String date = request.getParameter("date");
    String time = request.getParameter("time");
    String reason = request.getParameter("reason");

    try {

        if (doctorId == null || date == null || time == null ||
            doctorId.trim().isEmpty() || date.trim().isEmpty() ||
            time.trim().isEmpty()) {

            throw new IllegalArgumentException(
                "Please complete all required fields."
            );
        }

        int selectedDoctor = Integer.parseInt(doctorId);

        if (selectedDoctor <= 0) {
            throw new IllegalArgumentException("Invalid doctor selected.");
        }

        LocalDate selectedDate = LocalDate.parse(date);

        if (selectedDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException(
                "Please select a future date."
            );
        }

        int userId = (Integer) session.getAttribute("userId");

        String sql =
            "INSERT INTO appointments " +
            "(patient_id, doctor_id, appointment_date, appointment_time, reason) " +
            "SELECT pt.id, d.id, ?, ?, ? " +
            "FROM patients pt " +
            "JOIN doctors d ON d.id = ? AND d.is_active = 1 " +
            "JOIN users du ON du.id = d.user_id AND du.role = 'DOCTOR' " +
            "WHERE pt.user_id = ?";

        try (
            Connection con = getDBConnection();
            PreparedStatement ps = con.prepareStatement(sql)
        ) {

            ps.setDate(1, java.sql.Date.valueOf(date));
            ps.setTime(2, java.sql.Time.valueOf(time + ":00"));
            ps.setString(3, reason);
            ps.setInt(4, selectedDoctor);
            ps.setInt(5, userId);

            int result = ps.executeUpdate();

            if (result > 0) {

                response.sendRedirect(
                    request.getContextPath() +
                    "/my-appointments.jsp?booked=1"
                );

                return;

            } else {

                error = "Patient profile or active doctor profile was not found. " +
                        "Please refresh and try again.";
            }
        }

    } catch (SQLIntegrityConstraintViolationException e) {

        error = "This doctor and time slot is already booked.";

    } catch (Exception e) {

        application.log("Appointment booking error", e);

        error = "Unable to book appointment. Please check your details.";
    }
}
%>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Book Appointment | CarePoint</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body>

<%@ include file="includes/header.jsp" %>

<main class="narrow">

    <form class="form-card wide" method="post">

        <span class="eyebrow">NEW VISIT</span>

        <h1>Book an appointment</h1>

        <p>Select your doctor and preferred appointment time.</p>

        <% if (error != null) { %>

            <div class="alert">
                <%= error %>
            </div>

        <% } %>

        <label>Select Doctor</label>

        <select name="doctorId" required>

            <option value="">Choose a doctor</option>

            <%
            boolean hasDoctors = false;

            String doctorSql =
                "SELECT d.id, u.full_name, d.specialization, " +
                "d.consultation_fee " +
                "FROM doctors d " +
                "JOIN users u ON d.user_id = u.id " +
                "WHERE u.role = 'DOCTOR' AND d.is_active = 1 " +
                "ORDER BY u.full_name";

            try (
                Connection con = getDBConnection();
                PreparedStatement ps = con.prepareStatement(doctorSql);
                ResultSet rs = ps.executeQuery()
            ) {

                while (rs.next()) {

                    hasDoctors = true;

                    int doctorIdValue = rs.getInt("id");

                    boolean selected =
                        String.valueOf(doctorIdValue).equals(requestedDoctorId);
            %>

                <option value="<%= doctorIdValue %>"
                    <%= selected ? "selected" : "" %>>

                    <%= rs.getString("full_name") %>
                    -
                    <%= rs.getString("specialization") %>
                    (Rs. <%= rs.getBigDecimal("consultation_fee") %>)

                </option>

            <%
                }

                if (!hasDoctors) {
            %>

                <option value="" disabled>
                    No active doctors are available
                </option>

            <%
                }

            } catch (Exception e) {

                application.log("Doctor loading error", e);
            %>

                <option value="" disabled>
                    Unable to load doctors
                </option>

            <%
            }
            %>

        </select>

        <label>Appointment Date</label>

        <input
            type="date"
            name="date"
            min="<%= LocalDate.now() %>"
            required
        >

        <label>Appointment Time</label>

        <select name="time" required>

            <option value="">Choose a time</option>

            <%
            for (int h = 9; h <= 16; h++) {
                for (int m : new int[]{0, 30}) {

                    String t = String.format("%02d:%02d", h, m);
            %>

                <option value="<%= t %>">
                    <%= t %>
                </option>

            <%
                }
            }
            %>

        </select>

        <label>Reason for Visit</label>

        <textarea
            name="reason"
            rows="3"
            maxlength="500"
            placeholder="Describe your health concern..."
        ></textarea>

        <button type="submit" class="btn full">
            Request Appointment
        </button>

    </form>

</main>

</body>
</html>
