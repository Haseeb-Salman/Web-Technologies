<% String loggedRole=(String) session.getAttribute("role"); if (session.getAttribute("userId")==null) {
    response.sendRedirect(request.getContextPath() + "/login.jsp" ); return; } %>