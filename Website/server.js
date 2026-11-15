const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const AUDIT_FILE = path.join(__dirname, 'audit.log');

// Security constants
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60 * 1000;
const SESSION_TIMEOUT = 30 * 60 * 1000;
const PASSWORD_MIN_LENGTH = 8;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 100;

const loginAttempts = {};
const rateLimitStore = {};
const csrfTokens = new Map();

// --- Security Headers Middleware ---
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.removeHeader('X-Powered-By');
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  res.setHeader('Content-Security-Policy', csp);
  next();
});

// --- CORS ---
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const allowed = ['http://localhost:3000', 'http://127.0.0.1:3000'];
    if (allowed.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- Rate Limiting ---
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  if (!rateLimitStore[ip]) {
    rateLimitStore[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return next();
  }
  if (now > rateLimitStore[ip].resetTime) {
    rateLimitStore[ip] = { count: 1, resetTime: now + RATE_LIMIT_WINDOW };
    return next();
  }
  rateLimitStore[ip].count++;
  if (rateLimitStore[ip].count > RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
  }
  next();
});

// --- Session Configuration ---
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  name: 'college_sid',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: SESSION_TIMEOUT,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/'
  },
  rolling: true
}));

// --- CSRF Protection ---
function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session && req.session.csrfToken;
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({ success: false, error: 'CSRF token validation failed' });
  }
  next();
}

// --- CSRF Token for Views ---
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    res.locals.csrfToken = req.session.csrfToken;
  }
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

// --- Database ---
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return getDefaultDB();
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) { return getDefaultDB(); }
}
function writeDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function auditLog(action, user, details, ip) {
  const entry = { timestamp: new Date().toISOString(), action, user: user ? user.username : 'unknown', userId: user ? user.id : 'unknown', userRole: user ? user.role : 'unknown', details, ip };
  try { fs.appendFileSync(AUDIT_FILE, JSON.stringify(entry) + '\n'); } catch (err) { }
}
function getDefaultDB() {
  return { users: [], students: [], courses: [], teachers: [] };
}
let db = readDB();

// --- Validation ---
function sanitizeInput(str) {
  if (typeof str !== 'string') return str;
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}
function validatePassword(password) {
  const errors = [];
  if (password.length < PASSWORD_MIN_LENGTH) errors.push(`at least ${PASSWORD_MIN_LENGTH} characters`);
  if (!/[A-Z]/.test(password)) errors.push('one uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('one lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('one number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('one special character');
  return { valid: errors.length === 0, errors };
}
function validateUsername(username) {
  if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) return { valid: false, error: 'Username must be 3-30 chars, alphanumeric or underscore only' };
  return { valid: true };
}
function validateEmail(email) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { valid: false, error: 'Invalid email format' };
  return { valid: true };
}

// --- Auth Middleware ---
function requireAuth(req, res, next) {
  if (!req.session.user || !req.session.user.id) return res.status(401).json({ success: false, error: 'Authentication required' });
  if (req.session.lastActivity && Date.now() - req.session.lastActivity > SESSION_TIMEOUT) {
    req.session.destroy(() => {});
    return res.status(401).json({ success: false, error: 'Session expired due to inactivity. Please login again.' });
  }
  req.session.lastActivity = Date.now();
  next();
}
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session.user || !req.session.user.id) return res.status(401).json({ success: false, error: 'Authentication required' });
    if (!roles.includes(req.session.user.role)) {
      auditLog('ACCESS_DENIED', req.session.user, 'Attempted ' + roles.join('/') + ' route', req.ip);
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }
    next();
  };
}

function isAccountLocked(username) {
  const a = loginAttempts[username];
  if (!a) return false;
  if (a.lockedUntil && Date.now() < a.lockedUntil) return { locked: true, remaining: Math.ceil((a.lockedUntil - Date.now()) / 1000) };
  if (a.lockedUntil && Date.now() >= a.lockedUntil) { delete loginAttempts[username]; return false; }
  return false;
}
function recordFailedAttempt(username) {
  if (!loginAttempts[username]) loginAttempts[username] = { count: 0, lastAttempt: Date.now() };
  loginAttempts[username].count++; loginAttempts[username].lastAttempt = Date.now();
  if (loginAttempts[username].count >= MAX_LOGIN_ATTEMPTS) {
    loginAttempts[username].lockedUntil = Date.now() + LOCKOUT_DURATION;
    auditLog('ACCOUNT_LOCKED', null, 'Locked after ' + MAX_LOGIN_ATTEMPTS + ' failed attempts', null, username);
  }
}
function resetAttempts(username) { delete loginAttempts[username]; }

app.get('/api/csrf', (req, res) => {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  res.json({ success: true, csrfToken: req.session.csrfToken });
});

// --- REGISTER (Mandatory before login) ---
app.post('/api/register', csrfProtection, (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    if (!username || !password || !email || !role) return res.status(400).json({ success: false, error: 'All fields are required' });
    const cleanUser = sanitizeInput(username.trim());
    const cleanEmail = sanitizeInput(email.trim().toLowerCase());
    const cleanRole = sanitizeInput(role.trim().toLowerCase());
    const uv = validateUsername(cleanUser);
    if (!uv.valid) return res.status(400).json({ success: false, error: uv.error });
    const ev = validateEmail(cleanEmail);
    if (!ev.valid) return res.status(400).json({ success: false, error: ev.error });
    if (!['admin', 'teacher', 'student'].includes(cleanRole)) return res.status(400).json({ success: false, error: 'Invalid role' });
    const pv = validatePassword(password);
    if (!pv.valid) return res.status(400).json({ success: false, error: 'Weak password: ' + pv.errors.join(', ') });
    if (db.users.find(u => u.username === cleanUser || u.email === cleanEmail)) return res.status(409).json({ success: false, error: 'Username or email already registered' });
    const hash = bcrypt.hashSync(password, 12);
    const user = { id: 'user-' + uuidv4().substring(0, 8), username: cleanUser, email: cleanEmail, password: hash, role: cleanRole, createdAt: new Date().toISOString(), lastLogin: null, status: 'active', loginAttempts: 0 };
    db.users.push(user); writeDB(db);
    auditLog('USER_REGISTERED', user, 'New account: ' + cleanUser + ' (' + cleanRole + ')', req.ip);
    res.json({ success: true, message: 'Account created successfully. You can now login.', user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) { res.status(500).json({ success: false, error: 'Registration failed' }); }
});

// --- LOGIN ---
app.post('/api/login', csrfProtection, (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, error: 'Username and password required' });
    const cleanUser = sanitizeInput(username.trim());
    const lock = isAccountLocked(cleanUser);
    if (lock) return res.status(423).json({ success: false, error: 'Account locked. Try again in ' + lock.remaining + ' seconds.' });
    const user = db.users.find(u => u.username === cleanUser);
    if (!user) { recordFailedAttempt(cleanUser); auditLog('LOGIN_FAILED_NOT_FOUND', null, 'Username: ' + cleanUser, req.ip); return res.status(401).json({ success: false, error: 'Invalid username or password' }); }
    if (user.status !== 'active') return res.status(403).json({ success: false, error: 'Account deactivated. Contact admin.' });
    if (!bcrypt.compareSync(password, user.password)) { recordFailedAttempt(cleanUser); auditLog('LOGIN_FAILED_PASSWORD', user, 'Wrong password', req.ip); return res.status(401).json({ success: false, error: 'Invalid username or password' }); }
    resetAttempts(cleanUser);
    user.lastLogin = new Date().toISOString(); user.loginAttempts = 0; writeDB(db);
    req.session.regenerate((err) => {
      if (err) return res.status(500).json({ success: false, error: 'Session creation failed' });
      req.session.user = { id: user.id, username: user.username, email: user.email, role: user.role };
      req.session.csrfToken = crypto.randomBytes(32).toString('hex');
      req.session.lastActivity = Date.now();
      req.session.loginTime = Date.now();
      auditLog('LOGIN_SUCCESS', user, 'Successful login', req.ip);
      res.json({ success: true, message: 'Login successful', user: { id: user.id, username: user.username, email: user.email, role: user.role }, csrfToken: req.session.csrfToken });
    });
  } catch (err) { res.status(500).json({ success: false, error: 'Login failed' }); }
});

// --- LOGOUT ---
app.post('/api/logout', requireAuth, csrfProtection, (req, res) => {
  const user = req.session.user;
  auditLog('LOGOUT', user, 'User logged out', req.ip);
  req.session.destroy(() => { res.clearCookie('college_sid'); res.json({ success: true, message: 'Logged out' }); });
});

// --- ME ---
app.get('/api/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.session.user, sessionInfo: { loginTime: req.session.loginTime, lastActivity: req.session.lastActivity, csrfToken: req.session.csrfToken } });
});

// --- STUDENTS CRUD ---
app.get('/api/students', requireAuth, (req, res) => res.json({ success: true, data: db.students }));
app.post('/api/students', requireAuth, requireRole('admin'), csrfProtection, (req, res) => {
  const { name, email, course, year, gpa, status } = req.body;
  if (!name || !email) return res.status(400).json({ success: false, error: 'Name and email required' });
  const s = { id: 's' + Date.now(), name: sanitizeInput(name.trim()), email: sanitizeInput(email.trim().toLowerCase()), course: sanitizeInput(course || ''), year: sanitizeInput(year || ''), gpa: sanitizeInput(gpa || ''), status: status || 'Active', createdAt: new Date().toISOString(), createdBy: req.session.user.username };
  db.students.push(s); writeDB(db); auditLog('STUDENT_CREATED', req.session.user, 'Created: ' + s.name, req.ip);
  res.json({ success: true, data: s });
});
app.put('/api/students/:id', requireAuth, requireRole('admin'), csrfProtection, (req, res) => {
  const idx = db.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Student not found' });
  const u = {};
  ['name', 'email', 'course', 'year', 'gpa', 'status'].forEach(k => { if (req.body[k] !== undefined) u[k] = sanitizeInput(req.body[k]); });
  u.updatedAt = new Date().toISOString(); u.updatedBy = req.session.user.username;
  db.students[idx] = { ...db.students[idx], ...u }; writeDB(db);
  auditLog('STUDENT_UPDATED', req.session.user, 'Updated: ' + db.students[idx].name, req.ip);
  res.json({ success: true, data: db.students[idx] });
});
app.delete('/api/students/:id', requireAuth, requireRole('admin'), csrfProtection, (req, res) => {
  const b = db.students.length;
  db.students = db.students.filter(s => s.id !== req.params.id);
  if (db.students.length === b) return res.status(404).json({ success: false, error: 'Student not found' });
  writeDB(db); auditLog('STUDENT_DELETED', req.session.user, 'Deleted ID: ' + req.params.id, req.ip);
  res.json({ success: true, message: 'Student deleted' });
});

// --- COURSES CRUD ---
app.get('/api/courses', requireAuth, (req, res) => res.json({ success: true, data: db.courses }));
app.post('/api/courses', requireAuth, requireRole('admin', 'teacher'), csrfProtection, (req, res) => {
  const { code, name, credits, teacher, capacity, enrolled } = req.body;
  if (!code || !name) return res.status(400).json({ success: false, error: 'Code and name required' });
  const c = { id: 'c' + Date.now(), code: sanitizeInput(code.trim().toUpperCase()), name: sanitizeInput(name.trim()), credits: parseInt(credits) || 3, teacher: sanitizeInput(teacher || ''), capacity: parseInt(capacity) || 0, enrolled: parseInt(enrolled) || 0, createdAt: new Date().toISOString(), createdBy: req.session.user.username };
  db.courses.push(c); writeDB(db); auditLog('COURSE_CREATED', req.session.user, 'Created: ' + c.code + ' - ' + c.name, req.ip);
  res.json({ success: true, data: c });
});
app.put('/api/courses/:id', requireAuth, requireRole('admin', 'teacher'), csrfProtection, (req, res) => {
  const idx = db.courses.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Course not found' });
  const u = {};
  ['code', 'name', 'credits', 'teacher', 'capacity', 'enrolled'].forEach(k => { if (req.body[k] !== undefined) u[k] = sanitizeInput(req.body[k]); });
  u.updatedAt = new Date().toISOString(); u.updatedBy = req.session.user.username;
  db.courses[idx] = { ...db.courses[idx], ...u }; writeDB(db);
  auditLog('COURSE_UPDATED', req.session.user, 'Updated: ' + db.courses[idx].code, req.ip);
  res.json({ success: true, data: db.courses[idx] });
});
app.delete('/api/courses/:id', requireAuth, requireRole('admin'), csrfProtection, (req, res) => {
  const b = db.courses.length;
  db.courses = db.courses.filter(c => c.id !== req.params.id);
  if (db.courses.length === b) return res.status(404).json({ success: false, error: 'Course not found' });
  writeDB(db); auditLog('COURSE_DELETED', req.session.user, 'Deleted ID: ' + req.params.id, req.ip);
  res.json({ success: true, message: 'Course deleted' });
});

// --- TEACHERS CRUD ---
app.get('/api/teachers', requireAuth, (req, res) => res.json({ success: true, data: db.teachers }));
app.post('/api/teachers', requireAuth, requireRole('admin'), csrfProtection, (req, res) => {
  const { name, email, subject, experience, department } = req.body;
  if (!name || !email) return res.status(400).json({ success: false, error: 'Name and email required' });
  const t = { id: 't' + Date.now(), name: sanitizeInput(name.trim()), email: sanitizeInput(email.trim().toLowerCase()), subject: sanitizeInput(subject || ''), experience: sanitizeInput(experience || ''), department: sanitizeInput(department || ''), createdAt: new Date().toISOString(), createdBy: req.session.user.username };
  db.teachers.push(t); writeDB(db); auditLog('TEACHER_CREATED', req.session.user, 'Created: ' + t.name, req.ip);
  res.json({ success: true, data: t });
});
app.put('/api/teachers/:id', requireAuth, requireRole('admin'), csrfProtection, (req, res) => {
  const idx = db.teachers.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Teacher not found' });
  const u = {};
  ['name', 'email', 'subject', 'experience', 'department'].forEach(k => { if (req.body[k] !== undefined) u[k] = sanitizeInput(req.body[k]); });
  u.updatedAt = new Date().toISOString(); u.updatedBy = req.session.user.username;
  db.teachers[idx] = { ...db.teachers[idx], ...u }; writeDB(db);
  auditLog('TEACHER_UPDATED', req.session.user, 'Updated: ' + db.teachers[idx].name, req.ip);
  res.json({ success: true, data: db.teachers[idx] });
});
app.delete('/api/teachers/:id', requireAuth, requireRole('admin'), csrfProtection, (req, res) => {
  const b = db.teachers.length;
  db.teachers = db.teachers.filter(t => t.id !== req.params.id);
  if (db.teachers.length === b) return res.status(404).json({ success: false, error: 'Teacher not found' });
  writeDB(db); auditLog('TEACHER_DELETED', req.session.user, 'Deleted ID: ' + req.params.id, req.ip);
  res.json({ success: true, message: 'Teacher deleted' });
});

// --- STATS ---
app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  res.json({ success: true, stats: { totalStudents: db.students.length, totalCourses: db.courses.length, totalTeachers: db.teachers.length, totalUsers: db.users.length, activeUsers: db.users.filter(u => u.status === 'active').length, usersByRole: { admin: db.users.filter(u => u.role === 'admin').length, teacher: db.users.filter(u => u.role === 'teacher').length, student: db.users.filter(u => u.role === 'student').length } } });
});

// --- 404 & Catch-all ---
app.use('/api', (req, res) => res.status(404).json({ success: false, error: 'API endpoint not found' }));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log('================================================');
  console.log('  College Management System (Secure Neon Edition)');
  console.log('  Server running at: http://localhost:' + PORT);
  console.log('  Security: Rate limiting, CSRF, Account lockout, XSS protection, Secure sessions');
  console.log('================================================');
});
