
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

    String email = request.getParameter("email");
    String password = request.getParameter("password");

    if (email == null || password == null ||
        email.trim().isEmpty() || password.isEmpty()) {

        error = "Please enter your email and password.";

    } else {

        try {

            Connection con = getDBConnection();

            String sql = "SELECT u.id, u.full_name, u.email, u.password_hash, u.role "
                       + "FROM users u WHERE u.email = ? "
                       + "AND (u.role <> 'DOCTOR' OR EXISTS (SELECT 1 FROM doctors d WHERE d.user_id=u.id AND d.is_active=1))";

            PreparedStatement ps = con.prepareStatement(sql);

            ps.setString(1, email.trim().toLowerCase());

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {

                String storedPassword = rs.getString("password_hash");

                String[] parts = storedPassword.split(":");

                if (parts.length == 2) {

                    byte[] salt = Base64.getDecoder().decode(parts[0]);

                    byte[] originalHash = Base64.getDecoder().decode(parts[1]);

                    PBEKeySpec spec = new PBEKeySpec(
                        password.toCharArray(),
                        salt,
                        120000,
                        256
                    );

                    byte[] enteredHash = SecretKeyFactory
                        .getInstance("PBKDF2WithHmacSHA256")
                        .generateSecret(spec)
                        .getEncoded();

                    spec.clearPassword();

                    boolean valid = MessageDigest.isEqual(
                        originalHash,
                        enteredHash
                    );

                    if (valid) {

                        session.setAttribute("userId", rs.getInt("id"));

                        session.setAttribute(
                            "name",
                            rs.getString("full_name")
                        );

                        session.setAttribute(
                            "email",
                            rs.getString("email")
                        );

                        session.setAttribute(
                            "role",
                            rs.getString("role")
                        );

                        rs.close();
                        ps.close();
                        con.close();

                        response.sendRedirect(
                            request.getContextPath() + "/dashboard.jsp"
                        );

                        return;
                    }
                }
            }

            error = "Invalid email or password.";

            rs.close();
            ps.close();
            con.close();

        } catch (Exception e) {

            application.log("Login Error", e);

            error = "Login failed. Please check your database connection.";

        }
    }
}
%>

<!DOCTYPE html>
<html lang="en">

<head>

    <meta charset="UTF-8">

    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Login | CarePoint</title>

    <link rel="stylesheet" href="css/style.css">

</head>

<body class="auth-page">

    <a class="brand" href="index.jsp">✚ CarePoint</a>

    <form class="form-card" method="post">

        <span class="eyebrow">WELCOME BACK</span>

        <h1>Sign in</h1>

        <p>Access your CarePoint account.</p>

        <% if (error != null) { %>

            <div class="alert">
                <%= error %>
            </div>

        <% } %>

        <% if ("1".equals(request.getParameter("registered"))) { %>

            <div class="success">
                Account created. Please sign in.
            </div>

        <% } %>

        <label>Email address</label>

        <input
            type="email"
            name="email"
            required
        >

        <label>Password</label>

        <input
            type="password"
            name="password"
            required
        >

        <button type="submit" class="btn full">
            Login
        </button>

        <p class="muted">
            New here?
            <a href="register.jsp">Create an account</a>
        </p>

    </form>

</body>
</html>
