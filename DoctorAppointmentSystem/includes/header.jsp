<nav>
  <a class="brand" href="<%=request.getContextPath()%>/index.jsp">✚ CarePoint</a>
  <div class="nav-links">
    <a href="<%=request.getContextPath()%>/dashboard.jsp">Dashboard</a>
    <a href="<%=request.getContextPath()%>/doctors.jsp">Doctors</a>
    <% if ("ADMIN".equals(session.getAttribute("role"))) { %>
      <a href="<%=request.getContextPath()%>/admin/manage-doctors.jsp">Manage doctors</a>
    <% } %>
    <% if ("PATIENT".equals(session.getAttribute("role"))) { %>
      <a href="<%=request.getContextPath()%>/book-appointment.jsp">Book appointment</a>
    <% } %>
    <a href="<%=request.getContextPath()%>/my-appointments.jsp">Appointments</a>
    <a href="<%=request.getContextPath()%>/logout.jsp">Logout</a>
  </div>
</nav>
