CAREPOINT — JSP ONLY DOCTOR APPOINTMENT SYSTEM
================================================

IMPORTANT: This version contains NO Java Servlet classes and NO servlet mappings.
All backend processing is done inside JSP pages using JDBC.

REQUIREMENTS
------------
1. JDK 17
2. Apache Tomcat 10.1
3. XAMPP with MySQL
4. MySQL Connector/J (mysql-connector-j JAR)
5. VS Code or any editor

INSTALL / DEPLOY
----------------
1. Start MySQL from XAMPP.
2. Open http://localhost/phpmyadmin
3. Import database.sql.
4. Download MySQL Connector/J from the official MySQL website.
5. Copy mysql-connector-j-<version>.jar into:
   TOMCAT_HOME/lib/
   Example: C:\apache-tomcat-10.1.xx\lib\
6. Restart Tomcat after adding the JAR.
7. Copy the extracted DoctorAppointmentSystem folder into:
   C:\xampp\tomcat\webapps\
8. Open:
   http://localhost:8080/DoctorAppointmentSystem/
9. If MySQL root has a password, edit includes/db.jsp and set password.

CREATE ADMIN ACCOUNT
--------------------
1. Register a normal account using the website.
2. In phpMyAdmin, run (replace email):
   UPDATE users SET role='ADMIN' WHERE email='admin@example.com';
3. Log out and log in again.

CREATE / MANAGE DOCTOR ACCOUNTS
-------------------------------
1. Run admin-upgrade.sql once if this is an existing database.
2. Sign in with an account whose users.role is ADMIN.
3. Open Admin Dashboard > Manage doctors.
4. Create doctor accounts using the form. Passwords are PBKDF2-hashed by the JSP page.
5. Use Edit to update profiles and Activate/Deactivate to control doctor access.

ADMIN DOCTOR MANAGEMENT (UPDATED)
---------------------------------
1. On an existing database, open phpMyAdmin > doctor_appointment > SQL.
2. Import/run admin-upgrade.sql ONCE. It adds doctors.is_active and preserves existing records.
3. Log in with an account whose users.role is ADMIN.
4. Open admin/manage-doctors.jsp from the Admin Dashboard.
5. Use the form to create doctor accounts. A real password is PBKDF2-hashed automatically.
6. Use Edit to update details/password, and Activate/Deactivate to control appointment visibility.
7. Deactivated doctors are hidden from the public directory and booking dropdown, and cannot log in.

IMPORTANT: Never insert placeholder text into password_hash for accounts that need to log in.
Create doctor accounts through the admin form so the password is securely hashed.

FEATURES
--------
- Patient registration and login
- Password hashing with PBKDF2
- Patient dashboard
- Doctor dashboard
- Admin dashboard with live metrics
- Admin doctor management (create, edit, activate/deactivate)
- Doctor listing
- Appointment booking
- Prevents duplicate doctor/date/time slots using a database unique key
- Appointment status updates by admin/doctor
- MySQL database through XAMPP

NOTES
-----
- The project is configured for Tomcat 10.1 and Java 17.
- JSP pages use jakarta-compatible Tomcat runtime, but do not use Servlet classes written by you.
- If you use Tomcat 9, this Jakarta-compatible version may need adjustments.
- The doctor and admin accounts are promoted manually through SQL in this starter version.
- For real-world healthcare use, add CSRF protection, robust role/ownership checks on every action, audit logging, HTTPS, backups, and a security review.
