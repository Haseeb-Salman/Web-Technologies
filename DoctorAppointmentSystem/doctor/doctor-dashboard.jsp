<%@ page contentType="text/html;charset=UTF-8" %>
    <%@ include file="../includes/auth.jsp" %>
        <%if(!"DOCTOR".equals(session.getAttribute("role"))){response.sendError(403);return;}%>
            <!DOCTYPE html>
            <html>

            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width,initial-scale=1">
                <title>Doctor Dashboard</title>
                <link rel="stylesheet" href="../css/style.css">
            </head>

            <body>
                <nav><a class="brand" href="../index.jsp">✚ CarePoint</a>
                    <div class="nav-links"><a href="../my-appointments.jsp">Appointments</a><a
                            href="../logout.jsp">Logout</a></div>
                </nav>
                <main class="dashboard"><span class="eyebrow">DOCTOR PORTAL</span>
                    <h1>Welcome, Dr. <%=session.getAttribute("name")%>
                    </h1>
                    <p>Review and manage patient appointment requests.</p><a class="btn"
                        href="../my-appointments.jsp">View appointments</a>
                </main>
            </body>

            </html>