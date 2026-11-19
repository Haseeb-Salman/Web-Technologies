STUDENT MANAGEMENT SYSTEM (JSP + MYSQL + TOMCAT 9)

REQUIREMENTS
1. JDK 8 or newer (JAVA_HOME configured)
2. Apache Tomcat 9
3. XAMPP (start MySQL; Apache in XAMPP is not required for JSP)
4. MySQL Connector/J JDBC driver JAR

PROJECT DEPLOYMENT
1. Extract this ZIP.
2. Copy the complete StudentManagementSystem folder into:
   C:\Program Files\Apache Software Foundation\Tomcat 9.0\webapps\
   (Your Tomcat installation path may be different.)
3. Download MySQL Connector/J from the official MySQL website.
4. Copy mysql-connector-j-<version>.jar into:
   C:\Program Files\Apache Software Foundation\Tomcat 9.0\lib\
   Restart Tomcat after copying the JAR.
5. Open XAMPP Control Panel and start MySQL.
6. Open http://localhost/phpmyadmin
7. Choose Import, select database.sql from this project, and click Import.
8. Confirm the database username/password in:
   StudentManagementSystem\WEB-INF\db.jspf
   Default XAMPP settings are username root and blank password.
9. Start Tomcat.
10. Open:
    http://localhost:8080/StudentManagementSystem/

IMPORTANT
- Put the web project folder inside Tomcat's webapps folder, not directly inside Tomcat's root folder.
- XAMPP's MySQL is the database. Tomcat runs the JSP application.
- Do not put the JDBC JAR inside the project root. Put it in Tomcat's lib folder.
- This is an educational starter project. For production, use Servlets/DAO, authentication,
  CSRF protection, validation, and a connection pool instead of JSP scriptlets.
