document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginAlert = document.getElementById('loginAlert');
  const loginBtn = document.getElementById('loginBtn');
  const registerForm = document.getElementById('registerForm');
  const registerAlert = document.getElementById('registerAlert');
  const registerBtn = document.getElementById('registerBtn');
  fetchJson('/csrf').then(data => { window.csrfToken = data.csrfToken; const meta = document.querySelector('meta[name="csrf-token"]'); if (meta) meta.content = data.csrfToken; }).catch(() => { });

  // Particle background
  const canvas = document.getElementById('particleCanvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let width, height, particles = [];
    function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();
    class Particle {
      constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5; this.size = Math.random() * 3 + 1; }
      update() { this.x += this.vx; this.y += this.vy; if (this.x < 0 || this.x > width) this.vx *= -1; if (this.y < 0 || this.y > height) this.vy *= -1; }
      draw() { ctx.fillStyle = '#00f3ff'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
    }
    for (let i = 0; i < 40; i++) particles.push(new Particle());
    function animate() {
      ctx.clearRect(0, 0, width, height);
      particles.forEach(p => { p.update(); p.draw(); });
      requestAnimationFrame(animate);
    }
    animate();
  }

  const loginSection = document.getElementById('loginForm');
  const registerSection = document.getElementById('registerSection');
  const regPasswordInput = document.getElementById('regPassword');
  const passwordStrength = document.getElementById('passwordStrength');
  const passwordRequirements = document.getElementById('passwordRequirements');

  function showSection(section) {
    if (loginSection && registerSection) {
      const registering = section === 'register';
      loginSection.style.display = registering ? 'none' : 'block';
      registerSection.classList.toggle('active', registering);
      // Hide login header & alert when registering
      const loginHeader = document.querySelector('.login-header');
      const loginAlert = document.getElementById('loginAlert');
      if (loginHeader) loginHeader.style.display = registering ? 'none' : '';
      if (loginAlert) loginAlert.style.display = registering ? 'none' : '';
      document.querySelectorAll('.divider, #showRegisterLink').forEach(el => el.style.display = registering ? 'none' : '');
    }
  }

  function checkPasswordStrength(pwd) {
    const checks = [
      { id: 'reqLen', test: pwd.length >= 8, label: '8+ characters' },
      { id: 'reqUpper', test: /[A-Z]/.test(pwd), label: 'Uppercase letter' },
      { id: 'reqLower', test: /[a-z]/.test(pwd), label: 'Lowercase letter' },
      { id: 'reqDigit', test: /[0-9]/.test(pwd), label: 'Number' },
      { id: 'reqSpecial', test: /[^A-Za-z0-9]/.test(pwd), label: 'Special character' }
    ];
    let score = 0;
    checks.forEach(c => {
      const el = document.getElementById(c.id);
      if (el) { if (c.test) { el.classList.add('met'); el.classList.remove('unmet'); score++; } else { el.classList.add('unmet'); el.classList.remove('met'); } }
    });
    if (passwordStrength) {
      passwordStrength.style.width = ((score / checks.length) * 100) + '%';
      passwordStrength.className = 'strength-bar ' + (score >= 4 ? 'strong' : score >= 2 ? 'medium' : 'weak');
    }
    return score >= 4;
  }

  if (regPasswordInput) {
    regPasswordInput.addEventListener('input', (e) => {
      checkPasswordStrength(e.target.value);
      if (passwordRequirements) passwordRequirements.style.display = e.target.value ? 'block' : 'none';
    });
  }

  const showRegisterLink = document.getElementById('showRegisterLink');
  const showLoginLink = document.getElementById('showLoginLink');
  if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); showSection('register'); });
  if (showLoginLink) showLoginLink.addEventListener('click', (e) => { e.preventDefault(); showSection('login'); });

  function showAlert(el, msg, type) {
    if (!el) return;
    el.textContent = msg;
    el.className = 'alert alert-' + type;
    el.style.display = 'block';
  }
  function hideAlert(el) { if (el) el.style.display = 'none'; }

  // --- Login Handler ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      hideAlert(loginAlert);
      loginBtn.disabled = true;
      loginBtn.textContent = 'Signing In...';
      try {
        const data = await fetchJson('/login', { method: 'POST', body: JSON.stringify({ username, password }) });
        if (data.csrfToken) { window.csrfToken = data.csrfToken; const meta = document.querySelector('meta[name="csrf-token"]'); if (meta) meta.content = data.csrfToken; }
        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
      } catch (err) {
        showAlert(loginAlert, err.message, 'error');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
        loginForm.classList.remove('shake');
        void loginForm.offsetWidth;
        loginForm.classList.add('shake');
      }
    });
  }

  // --- Register Handler ---
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('regUsername').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirmPassword = document.getElementById('regConfirmPassword').value;
      const email = document.getElementById('regEmail').value.trim();
      const role = document.getElementById('regRole').value;
      hideAlert(registerAlert);
      if (!username || !password || !confirmPassword || !email || !role) { showAlert(registerAlert, 'All fields are required', 'error'); return; }
      if (password !== confirmPassword) { showAlert(registerAlert, 'Passwords do not match', 'error'); return; }
      if (!checkPasswordStrength(password)) { showAlert(registerAlert, 'Password does not meet strength requirements', 'error'); return; }
      registerBtn.disabled = true;
      registerBtn.textContent = 'Creating Account...';
      try {
        const data = await fetchJson('/register', { method: 'POST', body: JSON.stringify({ username, password, email, role }) });
        showAlert(registerAlert, data.message || 'Account created successfully! You can now login.', 'success');
        registerAlert.className = 'alert alert-success';
        registerForm.reset();
        if (passwordStrength) { passwordStrength.style.width = '0%'; passwordStrength.className = 'strength-bar'; }
        if (passwordRequirements) passwordRequirements.style.display = 'none';
        setTimeout(() => { showSection('login'); }, 1500);
      } catch (err) { showAlert(registerAlert, err.message, 'error'); }
      finally { registerBtn.disabled = false; registerBtn.textContent = 'Create Account'; }
    });
  }
});
