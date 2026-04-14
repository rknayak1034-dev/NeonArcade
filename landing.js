// ═══════════════════════════════════════════════
//  NeonArcade — Landing Page Auth Logic
// ═══════════════════════════════════════════════

// ── Starfield ────────────────────────────────
const bgC = document.getElementById('bgCanvas');
const bgX = bgC.getContext('2d');
bgC.width = window.innerWidth;
bgC.height = window.innerHeight;
window.addEventListener('resize', () => { bgC.width = window.innerWidth; bgC.height = window.innerHeight; });

const stars = Array.from({ length: 200 }, () => ({
  x: Math.random() * bgC.width,
  y: Math.random() * bgC.height,
  r: Math.random() * 1.6 + 0.3,
  s: Math.random() * 0.5 + 0.1,
  o: Math.random() * 0.5 + 0.2
}));

(function drawBg() {
  bgX.fillStyle = '#050510';
  bgX.fillRect(0, 0, bgC.width, bgC.height);
  stars.forEach(s => {
    s.y += s.s;
    if (s.y > bgC.height) { s.y = 0; s.x = Math.random() * bgC.width; }
    bgX.beginPath();
    bgX.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    bgX.fillStyle = `rgba(255,255,255,${s.o})`;
    bgX.fill();
  });
  requestAnimationFrame(drawBg);
})();

// ── Helpers ───────────────────────────────────
const $ = id => document.getElementById(id);

function showToast(msg, type = 'success', duration = 3000) {
  const t = $('toast');
  t.textContent = msg;
  t.className = type === 'error' ? 'error' : '';
  t.classList.remove('hidden');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => t.classList.add('hidden'), duration);
}

function setError(id, msg) {
  const el = $(id);
  if (el) el.textContent = msg;
  // highlight input wrap
  const input = el?.previousElementSibling?.querySelector('input') ||
                el?.closest('.input-group')?.querySelector('.input-wrap');
  if (input) input.classList.toggle('error', !!msg);
}

function clearErrors(...ids) {
  ids.forEach(id => setError(id, ''));
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function validatePassword(pass) {
  return pass.length >= 6;
}

// ── LocalStorage user store ───────────────────
// Users stored as: { [email]: { name, email, passwordHash, createdAt } }
// We use a simple reversible "hash" (base64) — good enough for a local demo

function simpleEncode(str) { return btoa(unescape(encodeURIComponent(str))); }
function simpleDecode(str) { return decodeURIComponent(escape(atob(str))); }

function getUsers() {
  return JSON.parse(localStorage.getItem('na_users') || '{}');
}
function saveUsers(users) {
  localStorage.setItem('na_users', JSON.stringify(users));
}
function getUserByEmail(email) {
  return getUsers()[email.toLowerCase().trim()] || null;
}
function createUser(name, email, password) {
  const users = getUsers();
  const key = email.toLowerCase().trim();
  users[key] = {
    name: name.trim(),
    email: key,
    passHash: simpleEncode(password),
    createdAt: new Date().toISOString(),
    avatar: getRandomAvatar()
  };
  saveUsers(users);
  return users[key];
}
function updatePassword(email, newPassword) {
  const users = getUsers();
  const key = email.toLowerCase().trim();
  if (users[key]) {
    users[key].passHash = simpleEncode(newPassword);
    saveUsers(users);
    return true;
  }
  return false;
}
function checkPassword(email, password) {
  const user = getUserByEmail(email);
  if (!user) return false;
  return simpleDecode(user.passHash) === password;
}

const AVATARS = ['🐍','🔥','❄️','⚡','👻','🌟','💀','🐉','🎯','🧱','🃏','🐦','🎮','🏆','🚀','💎'];
function getRandomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}

// ── Session ───────────────────────────────────
function setSession(user) {
  localStorage.setItem('na_session', JSON.stringify({
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    isGuest: false
  }));
}
function setGuestSession() {
  localStorage.setItem('na_session', JSON.stringify({
    name: 'Guest',
    email: null,
    avatar: '👤',
    isGuest: true
  }));
}
function getSession() {
  return JSON.parse(localStorage.getItem('na_session') || 'null');
}

// If already logged in, redirect straight to hub
(function checkExistingSession() {
  const s = getSession();
  if (s) { window.location.href = 'index.html'; }
})();

// ── Modal control ─────────────────────────────
const backdrop = $('modal-backdrop');

function openModal(panel = 'login') {
  backdrop.classList.remove('hidden');
  showPanel(panel);
  document.body.style.overflow = 'hidden';
}
function closeModal() {
  backdrop.classList.add('hidden');
  document.body.style.overflow = '';
  resetAllForms();
}
function showPanel(name) {
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  $('panel-' + name).classList.add('active');
}

$('modal-close').addEventListener('click', closeModal);
backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// Nav buttons
$('navLoginBtn').addEventListener('click',   () => openModal('login'));
$('navSignupBtn').addEventListener('click',  () => openModal('signup'));
$('heroSignupBtn').addEventListener('click', () => openModal('signup'));
$('footerLoginBtn').addEventListener('click',  () => openModal('login'));
$('footerSignupBtn').addEventListener('click', () => openModal('signup'));

// Panel switches
$('toSignupFromLogin').addEventListener('click', () => { resetAllForms(); showPanel('signup'); });
$('toLoginFromSignup').addEventListener('click', () => { resetAllForms(); showPanel('login'); });
$('toForgotBtn').addEventListener('click',       () => { resetAllForms(); showPanel('forgot'); });
$('backToLoginBtn').addEventListener('click',    () => { resetAllForms(); showPanel('login'); });
$('goLoginAfterReset').addEventListener('click', () => { resetAllForms(); showPanel('login'); });

// ── Guest Mode ────────────────────────────────
function enterGuest() {
  setGuestSession();
  showToast('👤 Entering as Guest...');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}
$('heroGuestBtn').addEventListener('click',   enterGuest);
$('loginGuestBtn').addEventListener('click',  enterGuest);
$('signupGuestBtn').addEventListener('click', enterGuest);

// ── Password visibility toggle ────────────────
document.querySelectorAll('.toggle-pass').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = $(btn.dataset.target);
    if (!input) return;
    input.type = input.type === 'password' ? 'text' : 'password';
    btn.textContent = input.type === 'password' ? '👁' : '🙈';
  });
});

// ── Password strength meter ───────────────────
$('signup-pass').addEventListener('input', function () {
  const val = this.value;
  const fill = $('pass-strength-fill');
  let strength = 0;
  if (val.length >= 6)  strength++;
  if (val.length >= 10) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^A-Za-z0-9]/.test(val)) strength++;

  const pct   = (strength / 5) * 100;
  const color = strength <= 1 ? '#ff6c6c' : strength <= 3 ? '#ffcc00' : '#4cff91';
  fill.style.width      = pct + '%';
  fill.style.background = color;
});

// ── SIGN UP ───────────────────────────────────
$('signupSubmitBtn').addEventListener('click', handleSignup);
$('signup-confirm').addEventListener('keydown', e => { if (e.key === 'Enter') handleSignup(); });

function handleSignup() {
  clearErrors('signup-name-err', 'signup-email-err', 'signup-pass-err', 'signup-confirm-err');
  $('signup-global-err').classList.add('hidden');

  const name    = $('signup-name').value.trim();
  const email   = $('signup-email').value.trim();
  const pass    = $('signup-pass').value;
  const confirm = $('signup-confirm').value;

  let valid = true;

  if (!name) {
    setError('signup-name-err', 'Display name is required'); valid = false;
  } else if (name.length < 2) {
    setError('signup-name-err', 'Name must be at least 2 characters'); valid = false;
  }

  if (!email) {
    setError('signup-email-err', 'Email is required'); valid = false;
  } else if (!validateEmail(email)) {
    setError('signup-email-err', 'Enter a valid email address'); valid = false;
  } else if (getUserByEmail(email)) {
    setError('signup-email-err', 'This email is already registered'); valid = false;
  }

  if (!pass) {
    setError('signup-pass-err', 'Password is required'); valid = false;
  } else if (!validatePassword(pass)) {
    setError('signup-pass-err', 'Password must be at least 6 characters'); valid = false;
  }

  if (!confirm) {
    setError('signup-confirm-err', 'Please confirm your password'); valid = false;
  } else if (pass !== confirm) {
    setError('signup-confirm-err', 'Passwords do not match'); valid = false;
  }

  if (!valid) return;

  // Create account
  const user = createUser(name, email, pass);
  setSession(user);

  // Show success panel
  $('success-icon').textContent   = user.avatar;
  $('success-title').textContent  = 'Welcome, ' + user.name + '!';
  $('success-msg').textContent    = 'Your NeonArcade account is ready.';
  $('success-avatar').textContent = user.avatar;
  showPanel('success');
}

$('goPlayBtn').addEventListener('click', () => {
  showToast('🎮 Loading NeonArcade...');
  setTimeout(() => { window.location.href = 'index.html'; }, 700);
});

// ── LOGIN ─────────────────────────────────────
$('loginSubmitBtn').addEventListener('click', handleLogin);
$('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') handleLogin(); });

function handleLogin() {
  clearErrors('login-email-err', 'login-pass-err');
  $('login-global-err').classList.add('hidden');

  const email = $('login-email').value.trim();
  const pass  = $('login-pass').value;
  let valid = true;

  if (!email) {
    setError('login-email-err', 'Email is required'); valid = false;
  } else if (!validateEmail(email)) {
    setError('login-email-err', 'Enter a valid email address'); valid = false;
  }

  if (!pass) {
    setError('login-pass-err', 'Password is required'); valid = false;
  }

  if (!valid) return;

  const user = getUserByEmail(email);
  if (!user) {
    const err = $('login-global-err');
    err.textContent = '❌ No account found with this email. Please sign up first.';
    err.classList.remove('hidden');
    return;
  }

  if (!checkPassword(email, pass)) {
    const err = $('login-global-err');
    err.textContent = '❌ Incorrect password. Please try again or reset your password.';
    err.classList.remove('hidden');
    setError('login-pass-err', 'Wrong password');
    return;
  }

  setSession(user);
  showToast('✅ Welcome back, ' + user.name + '!');
  setTimeout(() => { window.location.href = 'index.html'; }, 800);
}

// ── FORGOT PASSWORD ───────────────────────────
let forgotEmailFound = null;

$('forgotSendBtn').addEventListener('click', handleForgotStep1);
$('forgot-email').addEventListener('keydown', e => { if (e.key === 'Enter') handleForgotStep1(); });

function handleForgotStep1() {
  setError('forgot-email-err', '');
  $('forgot-global-err').classList.add('hidden');

  const email = $('forgot-email').value.trim();

  if (!email) {
    setError('forgot-email-err', 'Email is required'); return;
  }
  if (!validateEmail(email)) {
    setError('forgot-email-err', 'Enter a valid email address'); return;
  }

  const user = getUserByEmail(email);
  if (!user) {
    const err = $('forgot-global-err');
    err.textContent = '❌ No account found with this email address.';
    err.classList.remove('hidden');
    return;
  }

  // Account found — show step 2
  forgotEmailFound = email;
  $('found-email').textContent = email;
  $('forgot-step1').classList.add('hidden');
  $('forgot-step2').classList.remove('hidden');
}

$('resetPassBtn').addEventListener('click', handleForgotStep2);

function handleForgotStep2() {
  setError('new-pass-err', '');
  setError('new-pass-confirm-err', '');

  const newPass    = $('new-pass').value;
  const newConfirm = $('new-pass-confirm').value;
  let valid = true;

  if (!newPass) {
    setError('new-pass-err', 'New password is required'); valid = false;
  } else if (!validatePassword(newPass)) {
    setError('new-pass-err', 'Password must be at least 6 characters'); valid = false;
  }

  if (!newConfirm) {
    setError('new-pass-confirm-err', 'Please confirm your new password'); valid = false;
  } else if (newPass !== newConfirm) {
    setError('new-pass-confirm-err', 'Passwords do not match'); valid = false;
  }

  if (!valid) return;

  updatePassword(forgotEmailFound, newPass);
  $('forgot-step2').classList.add('hidden');
  $('forgot-step3').classList.remove('hidden');
  showToast('🔐 Password reset successfully!');
}

// ── Reset all forms ───────────────────────────
function resetAllForms() {
  // Login
  $('login-email').value = '';
  $('login-pass').value  = '';
  $('login-global-err').classList.add('hidden');
  clearErrors('login-email-err', 'login-pass-err');

  // Signup
  $('signup-name').value    = '';
  $('signup-email').value   = '';
  $('signup-pass').value    = '';
  $('signup-confirm').value = '';
  $('signup-global-err').classList.add('hidden');
  $('pass-strength-fill').style.width = '0%';
  clearErrors('signup-name-err', 'signup-email-err', 'signup-pass-err', 'signup-confirm-err');

  // Forgot
  $('forgot-email').value = '';
  $('new-pass').value     = '';
  $('new-pass-confirm').value = '';
  $('forgot-global-err').classList.add('hidden');
  $('forgot-step1').classList.remove('hidden');
  $('forgot-step2').classList.add('hidden');
  $('forgot-step3').classList.add('hidden');
  clearErrors('forgot-email-err', 'new-pass-err', 'new-pass-confirm-err');
  forgotEmailFound = null;

  // Reset all input-wrap error states
  document.querySelectorAll('.input-wrap.error').forEach(el => el.classList.remove('error'));
}
