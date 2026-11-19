<%@ page contentType="text/html;charset=UTF-8" %>
<%@ page import="java.sql.*" %>
<%@ include file="../includes/db.jsp" %>
<%@ include file="../includes/auth.jsp" %>
<%
if (!"ADMIN".equals(session.getAttribute("role"))) { response.sendError(403); return; }
int doctorCount=0, patientCount=0, appointmentCount=0, pendingCount=0, departmentCount=0;
try (Connection c=getDBConnection(); Statement s=c.createStatement()) {
    try (ResultSet r=s.executeQuery("SELECT COUNT(*) FROM doctors WHERE is_active=1")) { if(r.next()) doctorCount=r.getInt(1); }
    try (ResultSet r=s.executeQuery("SELECT COUNT(*) FROM patients")) { if(r.next()) patientCount=r.getInt(1); }
    try (ResultSet r=s.executeQuery("SELECT COUNT(*) FROM appointments")) { if(r.next()) appointmentCount=r.getInt(1); }
    try (ResultSet r=s.executeQuery("SELECT COUNT(*) FROM appointments WHERE status='PENDING'")) { if(r.next()) pendingCount=r.getInt(1); }
    try (ResultSet r=s.executeQuery("SELECT COUNT(*) FROM departments")) { if(r.next()) departmentCount=r.getInt(1); }
} catch(Exception ex) { application.log("Admin dashboard metrics error",ex); }
%>
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin Dashboard | CarePoint</title><link rel="stylesheet" href="../css/style.css"></head>
<body class="carepoint-app">
<div class="admin-layout">
<aside class="admin-sidebar">
  <a class="sidebar-brand" href="admin-dashboard.jsp"><span class="brand-mark">✚</span><span>CarePoint<small>HEALTHCARE PORTAL</small></span></a>
  <div class="sidebar-label">WORKSPACE</div>
  <a class="side-link active" href="admin-dashboard.jsp"><span>▦</span> Overview</a>
  <a class="side-link" href="manage-doctors.jsp"><span>♙</span> Doctors</a>
  <a class="side-link" href="../my-appointments.jsp"><span>▤</span> Appointments</a>
  <a class="side-link" href="../doctors.jsp"><span>✚</span> Doctor directory</a>
  <div class="sidebar-bottom"><div class="sidebar-user"><span class="user-avatar"><%=String.valueOf(session.getAttribute("name")).substring(0,1).toUpperCase()%></span><span><b><%=session.getAttribute("name")%></b><small>Administrator</small></span></div><a class="side-link logout-link" href="../logout.jsp"><span>↪</span> Sign out</a></div>
</aside>
<div class="admin-content">
<header class="topbar"><div><span class="topbar-kicker">ADMINISTRATION</span><strong>Overview</strong></div><div class="topbar-right"><span class="online-dot"></span> System overview <span class="topbar-avatar">A</span></div></header>
<main class="dashboard admin-page">
    <span class="eyebrow">CAREPOINT CONTROL CENTER</span>
    <h1>Welcome, <%=session.getAttribute("name")%></h1>
    <p>Monitor clinic activity and manage your healthcare team from one place.</p>
    <div class="metric-grid">
        <article class="metric-card"><span>Active doctors</span><strong><%=doctorCount%></strong><small>Available in public directory</small></article>
        <article class="metric-card"><span>Registered patients</span><strong><%=patientCount%></strong><small>Patient accounts</small></article>
        <article class="metric-card"><span>Total appointments</span><strong><%=appointmentCount%></strong><small>All appointment records</small></article>
        <article class="metric-card"><span>Pending requests</span><strong><%=pendingCount%></strong><small>Awaiting a decision</small></article>
        <article class="metric-card"><span>Departments</span><strong><%=departmentCount%></strong><small>Configured specialties</small></article>
    </div>
    <h2 class="section-title">Management</h2>
    <div class="cards admin-cards">
        <article><div class="tile-icon">＋</div><h3>Doctor management</h3><p>Create doctor accounts, edit profiles, update fees and activate or deactivate doctors.</p><a class="btn" href="manage-doctors.jsp">Manage doctors</a></article>
        <article><div class="tile-icon">▤</div><h3>Appointments</h3><p>Review appointment requests and update their status.</p><a class="btn secondary" href="../my-appointments.jsp">Manage appointments</a></article>
        <article><div class="tile-icon">✚</div><h3>Public directory</h3><p>See the doctor directory exactly as patients see it.</p><a class="btn secondary" href="../doctors.jsp">View doctors</a></article>
    </div>
</main>
</div></div>
</body></html>
