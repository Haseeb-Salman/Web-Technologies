<%@ page contentType="text/html;charset=UTF-8" %>
    <%@ include file="includes/db.jsp" %>
        <%@ include file="includes/auth.jsp" %>
            <% String role=(String)session.getAttribute("role");
                if(!"ADMIN".equals(role)&&!"DOCTOR".equals(role)){response.sendError(403);return;}
                if("POST".equalsIgnoreCase(request.getMethod())){ String status=request.getParameter("status");
                if(!java.util.Arrays.asList("APPROVED","REJECTED","COMPLETED","CANCELLED").contains(status)){response.sendError(400);return;}
                try(Connection c=getDBConnection();PreparedStatement p=c.prepareStatement("UPDATE appointments SET
                status=? WHERE id=? AND (?='ADMIN' OR doctor_id=(SELECT id FROM doctors WHERE user_id=?))")){
                p.setString(1,status);p.setInt(2,Integer.parseInt(request.getParameter("appointmentId")));p.setString(3,role);p.setInt(4,(Integer)session.getAttribute("userId"));p.executeUpdate();
                }catch(Exception ex){application.log("Appointment update failed",ex);} }
                response.sendRedirect("my-appointments.jsp"); %>