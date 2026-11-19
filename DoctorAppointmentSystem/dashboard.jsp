<%@ page contentType="text/html;charset=UTF-8" %>
    <%@ include file="includes/auth.jsp" %>
        <% String role=(String)session.getAttribute("role");
            if("ADMIN".equals(role)){response.sendRedirect("admin/admin-dashboard.jsp");return;}
            if("DOCTOR".equals(role)){response.sendRedirect("doctor/doctor-dashboard.jsp");return;} %>
            <!DOCTYPE html>
            <html>

            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <title>Patient Dashboard</title>
                <link rel="stylesheet" href="css/style.css">
            </head>

            <body>
                <%@ include file="includes/header.jsp" %>
                    <main class="dashboard"><span class="eyebrow">PATIENT PORTAL</span>
                        <h1>Welcome, <%=session.getAttribute("name")%>.</h1>
                        <p>Manage your doctor visits from your personal dashboard.</p>
                        <div class="cards">
                            <article>
                                <div class="tile-icon">＋</div>
                                <h3>Book appointment</h3>
                                <p>Find a doctor and request a visit.</p><a class="btn" href="book-appointment.jsp">Book
                                    now</a>
                            </article>
                            <article>
                                <div class="tile-icon">▤</div>
                                <h3>My appointments</h3>
                                <p>Review dates and appointment status.</p><a class="btn secondary"
                                    href="my-appointments.jsp">View appointments</a>
                            </article>
                        </div>
                    </main>
            </body>

            </html>