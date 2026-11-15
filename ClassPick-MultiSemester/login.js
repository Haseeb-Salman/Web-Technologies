import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Use the SAME Supabase project URL and publishable/anon key as your old project.
const SUPABASE_URL = 'https://uljairhbdtwytnjqfgdk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_99X5X-r2y0PzzILziOGIJg_8m5LsbSG';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');
const button = document.getElementById('loginButton');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  message.textContent = '';
  button.disabled = true;
  button.textContent = 'Signing in...';
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    message.textContent = error.message;
    message.className = 'status error';
    button.disabled = false;
    button.textContent = 'Sign in →';
    return;
  }
  window.location.href = 'index.html';
});

(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) window.location.href = 'index.html';
})();
