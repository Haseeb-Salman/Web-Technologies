
<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page import="java.sql.*" %>
<%@ page import="java.security.*" %>
<%@ page import="javax.crypto.*" %>
<%@ page import="javax.crypto.spec.*" %>
<%@ page import="java.util.*" %>
<%@ include file="includes/db.jsp" %>

<%
String error = null;

if ("POST".equalsIgnoreCase(request.getMethod())) {

    String name = request.getParameter("name");
    String email = request.getParameter("email");
    String password = request.getParameter("password");
    String phone = request.getParameter("phone");

    if (name == null || email == null || password == null ||
        name.trim().isEmpty() || email.trim().isEmpty() ||
        password.length() < 8) {

        error = "Complete all fields. Password must be at least 8 characters.";

    } else {

        try {

            byte[] salt = new byte[16];
            new SecureRandom().nextBytes(salt);

            PBEKeySpec spec = new PBEKeySpec(
                password.toCharArray(), salt, 120000, 256
            );

            byte[] hash = SecretKeyFactory
                .getInstance("PBKDF2WithHmacSHA256")
                .generateSecret(spec).getEncoded();

            spec.clearPassword();

            String stored =
                Base64.getEncoder().encodeToString(salt)
                + ":"
                + Base64.getEncoder().encodeToString(hash);

            Connection con = getDBConnection();

            String sql = "INSERT INTO users "
                + "(full_name, email, password_hash, role) "
                + "VALUES (?, ?, ?, 'PATIENT')";

            PreparedStatement ps = con.prepareStatement(
                sql, Statement.RETURN_GENERATED_KEYS
            );

            ps.setString(1, name.trim());
            ps.setString(2, email.trim().toLowerCase());
            ps.setString(3, stored);

            ps.executeUpdate();

            ResultSet rs = ps.getGeneratedKeys();

            if (rs.next()) {

                int userId = rs.getInt(1);

                PreparedStatement patient = con.prepareStatement(
                    "INSERT INTO patients (user_id, phone) VALUES (?, ?)"
                );

                patient.setInt(1, userId);
                patient.setString(2, phone);
                patient.executeUpdate();

                patient.close();
            }

            rs.close();
            ps.close();
            con.close();

            response.sendRedirect(
                request.getContextPath() + "/login.jsp?registered=1"
            );

            return;

        } catch (SQLIntegrityConstraintViolationException e) {

            error = "This email is already registered.";

        } catch (Exception e) {

            application.log("Registration error", e);
            error = "Registration failed. Please check your database.";

        }
    }
}
%>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Register | CarePoint</title>

    <link rel="stylesheet" href="css/style.css">
</head>

<body class="auth-page">

    <a class="brand" href="index.jsp">✚ CarePoint</a>

    <form class="form-card" method="post">

        <span class="eyebrow">JOIN CAREPOINT</span>

        <h1>Create account</h1>

        <p>Patient registration</p>

        <% if (error != null) { %>

            <div class="alert">
                <%= error %>
            </div>

        <% } %>

        <label>Full name</label>

        <input
            type="text"
            name="name"
            required
            maxlength="120"
        >

        <label>Email address</label>

        <input
            type="email"
            name="email"
            required
        >

        <label>Phone</label>

        <input
            type="text"
            name="phone"
            required
            maxlength="30"
        >

        <label>Password (minimum 8 characters)</label>

        <input
            type="password"
            name="password"
            minlength="8"
            required
        >

        <button type="submit" class="btn full">
            Create Account
        </button>

        <p class="muted">
            Already registered?
            <a href="login.jsp">Login</a>
        </p>

    </form>

</body>
</html>
