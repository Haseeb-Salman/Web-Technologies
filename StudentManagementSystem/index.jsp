<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
  <%@ page import="java.sql.*" %>
    <%@ include file="WEB-INF/db.jspf" %>
      <% int total=0; try (PreparedStatement ps=conn.prepareStatement("SELECT COUNT(*) FROM students"); ResultSet
        rs=ps.executeQuery()) { if (rs.next()) total=rs.getInt(1); } %>
        <!DOCTYPE html>
        <html lang="en">

        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Student Management | Dashboard</title>
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
          <link rel="stylesheet" href="assets/css/style.css">
        </head>

        <body>
          <div class="app-shell">
            <aside class="sidebar">
              <a class="brand" href="index.jsp"><span class="brand-mark">S</span><span>Student<span
                    class="brand-light">Hub</span></span></a>
              <div class="nav-caption">WORKSPACE</div>
              <a class="nav-link active" href="index.jsp">▦ &nbsp; Dashboard</a>
              <a class="nav-link" href="students.jsp">♙ &nbsp; Students</a>
              <div class="sidebar-bottom">Student Management System<br><small>JSP · MySQL · Tomcat</small></div>
            </aside>
            <main class="main-content">
              <header class="topbar">
                <div>
                  <div class="eyebrow">OVERVIEW</div>
                  <h1>Dashboard</h1>
                </div><span class="status-pill"><i></i> System online</span>
              </header>
              <section class="welcome-card">
                <div>
                  <div class="eyebrow light">STUDENT ADMINISTRATION</div>
                  <h2>Manage your students<br>in one place.</h2>
                  <p>Keep student records organized, searchable, and up to date.</p><a
                    class="btn btn-light rounded-pill px-4" href="students.jsp">Manage students →</a>
                </div>
                <div class="welcome-art">S<span>+</span></div>
              </section>
              <div class="section-heading">
                <div>
                  <div class="eyebrow">YOUR DATA</div>
                  <h3>At a glance</h3>
                </div>
              </div>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-icon purple">♙</div>
                  <div class="stat-label">Total students</div>
                  <div class="stat-number">
                    <%= total %>
                  </div>
                  <div class="stat-note">Records in your database</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon green">✓</div>
                  <div class="stat-label">Database status</div>
                  <div class="stat-number stat-word">Connected</div>
                  <div class="stat-note">MySQL connection successful</div>
                </div>
                <div class="stat-card">
                  <div class="stat-icon orange">⌘</div>
                  <div class="stat-label">Management tools</div>
                  <div class="stat-number stat-word">CRUD</div>
                  <div class="stat-note">Create · Read · Update · Delete</div>
                </div>
              </div>
              <section class="quick-card">
                <div>
                  <h4>Student records</h4>
                  <p>Open the student directory to add new records or update existing information.</p>
                </div><a href="students.jsp" class="btn btn-primary rounded-pill px-4">Open directory</a>
              </section>
              <footer>© 2026 StudentHub · Student Management System</footer>
            </main>
          </div>
        </body>

        </html>