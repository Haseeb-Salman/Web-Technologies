
<%@ page import="java.sql.*" %>

<%!
public Connection getDBConnection() throws SQLException {

    String url = "jdbc:mysql://localhost:3306/doctor_appointment?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
    String user = "root";
    String password = "";

    try {
        Class.forName("com.mysql.cj.jdbc.Driver");
    } catch (ClassNotFoundException e) {
        throw new SQLException("MySQL JDBC Driver not found!", e);
    }

    return DriverManager.getConnection(url, user, password);
}
%>
