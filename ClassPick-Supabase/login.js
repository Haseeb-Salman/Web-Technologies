import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Paste your Supabase Project URL and publishable (or anon) key below.
const SUPABASE_URL = 'https://uljairhbdtwytnjqfgdk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_99X5X-r2y0PzzILziOGIJg_8m5LsbSG';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('loginForm');
const message = document.getElementById('loginMessage');
const button = document.getElementById('loginButton');

async function checkSession() {
  const { data } = await supabase.auth.getSession();
  if (data.session) window.location.replace('index.html');
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  button.disabled = true;
  button.textContent = 'Signing in...';
  message.textContent = '';
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    message.textContent = error.message;
    message.className = 'message error';
    button.disabled = false;
    button.textContent = 'Sign In';
    return;
  }
  window.location.replace('index.html');
});

checkSession();
