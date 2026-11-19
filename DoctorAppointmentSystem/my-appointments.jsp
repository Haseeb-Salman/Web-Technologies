<%@ page contentType="text/html;charset=UTF-8" %>
    <%@ page import="java.sql.*" %>
        <%@ include file="includes/db.jsp" %>
            <%@ include file="includes/auth.jsp" %>
                <% String role=(String)session.getAttribute("role");String sql;int
                    uid=(Integer)session.getAttribute("userId"); if("PATIENT".equals(role))
                    sql="SELECT a.id,a.appointment_date,a.appointment_time,du.full_name AS doctor_name,d.specialization,a.status,a.reason FROM appointments a JOIN patients p ON a.patient_id=p.id JOIN doctors d ON a.doctor_id=d.id JOIN users du ON d.user_id=du.id WHERE p.user_id=? ORDER BY a.appointment_date DESC,a.appointment_time DESC"
                    ; else if("DOCTOR".equals(role))
                    sql="SELECT a.id,a.appointment_date,a.appointment_time,pu.full_name AS doctor_name,d.specialization,a.status,a.reason FROM appointments a JOIN patients p ON a.patient_id=p.id JOIN users pu ON p.user_id=pu.id JOIN doctors d ON a.doctor_id=d.id WHERE d.user_id=? ORDER BY a.appointment_date,a.appointment_time"
                    ; else
                    sql="SELECT a.id,a.appointment_date,a.appointment_time,du.full_name AS doctor_name,d.specialization,a.status,a.reason FROM appointments a JOIN doctors d ON a.doctor_id=d.id JOIN users du ON d.user_id=du.id ORDER BY a.appointment_date DESC"
                    ; %>
                    <!DOCTYPE html>
                    <html>

                    <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width,initial-scale=1">
                        <title>Appointments</title>
                        <link rel="stylesheet" href="css/style.css">
                    </head>

                    <body>
                        <%@ include file="includes/header.jsp" %>
                            <main class="dashboard"><span class="eyebrow">APPOINTMENT RECORDS</span>
                                <h1>Appointments</h1>
                                <%if("1".equals(request.getParameter("booked"))){%>
                                    <div class="success">Appointment request submitted.</div>
                                    <%}%>
                                        <div class="table-wrap">
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Time</th>
                                                        <th>Patient / Doctor</th>
                                                        <th>Specialty</th>
                                                        <th>Status</th>
                                                        <th>Reason</th>
                                                        <%if(!"PATIENT".equals(role)){%>
                                                            <th>Update</th>
                                                            <%}%>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <%try(Connection c=getDBConnection();PreparedStatement
                                                        p=c.prepareStatement(sql)){if(!"ADMIN".equals(role))p.setInt(1,uid);try(ResultSet
                                                        rs=p.executeQuery()){boolean
                                                        any=false;while(rs.next()){any=true;%>
                                                        <tr>
                                                            <td>
                                                                <%=rs.getDate("appointment_date")%>
                                                            </td>
                                                            <td>
                                                                <%=rs.getTime("appointment_time")%>
                                                            </td>
                                                            <td>
                                                                <%=rs.getString("doctor_name")%>
                                                            </td>
                                                            <td>
                                                                <%=rs.getString("specialization")%>
                                                            </td>
                                                            <td><span class="status">
                                                                    <%=rs.getString("status")%>
                                                                </span></td>
                                                            <td>
                                                                <%=rs.getString("reason")==null?"":rs.getString("reason")%>
                                                            </td>
                                                            <%if(!"PATIENT".equals(role)){%>
                                                                <td>
                                                                    <form class="inline-form"
                                                                        action="manage-appointments.jsp" method="post">
                                                                        <input type="hidden" name="appointmentId"
                                                                            value="<%=rs.getInt("id")%>"><select
                                                                            name="status">
                                                                            <option value="APPROVED">Approve</option>
                                                                            <option value="REJECTED">Reject</option>
                                                                            <option value="COMPLETED">Complete</option>
                                                                            <option value="CANCELLED">Cancel</option>
                                                                        </select><button class="btn tiny">Save</button>
                                                                    </form>
                                                                </td>
                                                                <%}%>
                                                        </tr>
                                                        <%}if(!any){%>
                                                            <tr>
                                                                <td colspan="7">No appointments found.</td>
                                                            </tr>
                                                            <%}}}catch(Exception ex){%>
                                                                <tr>
                                                                    <td colspan="7">Unable to load appointment records.
                                                                    </td>
                                                                </tr>
                                                                <%}%>
                                                </tbody>
                                            </table>
                                        </div>
                            </main>
                    </body>

                    </html>