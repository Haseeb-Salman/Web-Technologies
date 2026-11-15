const API = 'http://localhost:3000/api';

function getCsrfToken() {
  // Try to get CSRF token from meta tag or session
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta) return meta.content;
  return null;
}

async function fetchJson(path, options = {}) {
  try {
    const requestUrl = path.startsWith('http')
      ? path
      : path.startsWith('/api')
        ? path
        : API + (path.startsWith('/') ? path : '/' + path);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    // Add CSRF token for state-changing requests
    if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method.toUpperCase())) {
      const token = getCsrfToken() || (window.csrfToken || null);
      if (token) headers['X-CSRF-Token'] = token;
    }
    const res = await fetch(requestUrl, {
      headers,
      ...options
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  } catch (err) {
    throw new Error(err.message || 'Network error');
  }
}

function showToast(msg, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => toast.classList.remove('show'), 3000);
}

function formatDate() {
  const now = new Date();
  return now.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ===== Initialize Animations & Interactions ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        entry.target.classList.add('show');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });

  // Apply the saved theme on every page; the toggle is only present on the landing page.
  const root = document.documentElement;
  const savedTheme = localStorage.getItem('theme');
  const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
  const themeToggle = document.getElementById('themeToggle');
  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-bs-theme', theme);
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === 'dark' ? '#101b24' : '#f7f5ef';
    if (!themeToggle) return;
    const themeLabel = themeToggle.querySelector('.theme-toggle-label');
    const themeIcon = themeToggle.querySelector('.theme-toggle-icon');
    themeToggle.setAttribute('aria-pressed', String(theme === 'dark'));
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    if (themeLabel) themeLabel.textContent = theme === 'dark' ? 'Light mode' : 'Dark mode';
    if (themeIcon) themeIcon.textContent = theme === 'dark' ? '☀' : '☾';
  };

  applyTheme(initialTheme);
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      applyTheme(next);
    });
  }

  // Smooth reveal for feature icons on hover
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const icon = card.querySelector('.feature-icon');
      if (icon) icon.style.transform = 'scale(1.1) rotate(5deg)';
    });
    card.addEventListener('mouseleave', () => {
      const icon = card.querySelector('.feature-icon');
      if (icon) icon.style.transform = 'scale(1) rotate(0deg)';
    });
  });
});
