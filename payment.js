// ═══════════════════════════════════════════════
//  NeonArcade — Payment System
// ═══════════════════════════════════════════════

// ── Starfield ────────────────────────────────
const bgC = document.getElementById('bgCanvas');
const bgX = bgC.getContext('2d');
bgC.width = window.innerWidth; bgC.height = window.innerHeight;
window.addEventListener('resize', () => { bgC.width = window.innerWidth; bgC.height = window.innerHeight; });
const stars = Array.from({ length: 180 }, () => ({
  x: Math.random() * bgC.width, y: Math.random() * bgC.height,
  r: Math.random() * 1.4 + 0.3, s: Math.random() * 0.4 + 0.1
}));
(function drawBg() {
  bgX.fillStyle = '#050510'; bgX.fillRect(0, 0, bgC.width, bgC.height);
  stars.forEach(s => {
    s.y += s.s; if (s.y > bgC.height) { s.y = 0; s.x = Math.random() * bgC.width; }
    bgX.beginPath(); bgX.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    bgX.fillStyle = `rgba(255,255,255,${0.25 + s.r * 0.2})`; bgX.fill();
  });
  requestAnimationFrame(drawBg);
})();

// ── Helpers ───────────────────────────────────
const $ = id => document.getElementById(id);
function showToast(msg, type = 'success', dur = 3000) {
  const t = $('toast'); t.textContent = msg;
  t.className = type === 'error' ? 'error' : '';
  t.classList.remove('hidden');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.add('hidden'), dur);
}
function setErr(id, msg) {
  const el = $(id); if (!el) return; el.textContent = msg;
  const wrap = el.closest('.input-group')?.querySelector('.input-wrap');
  if (wrap) wrap.classList.toggle('error', !!msg);
}
function clearErr(...ids) { ids.forEach(id => setErr(id, '')); }

// ── Plan State ────────────────────────────────
const PLANS = {
  starter: { price: 99,  label: 'Starter Plan',    period: '/month' },
  pro:     { price: 199, label: 'Pro Plan',         period: '/month' },
  annual:  { price: 999, label: 'Annual Pro Plan',  period: '/year'  }
};
const PROMOS = {
  'NEON50':  { type: 'percent', val: 50, label: '50% OFF' },
  'ARCADE20':{ type: 'percent', val: 20, label: '20% OFF' },
  'FIRST99': { type: 'flat',    val: 99, label: '₹99 OFF' },
  'GAME10':  { type: 'percent', val: 10, label: '10% OFF' }
};

let selectedPlan = 'pro';
let promoDiscount = 0;
let promoApplied  = '';
let selectedEmiMonths = 3;

function getBasePrice()  { return PLANS[selectedPlan].price; }
function getDiscount()   { return promoDiscount; }
function getTax(base, disc) { return Math.round((base - disc) * 0.18 * 100) / 100; }
function getTotal()      {
  const base = getBasePrice(), disc = getDiscount();
  return Math.round((base - disc + getTax(base, disc)) * 100) / 100;
}
function fmt(n) { return '₹' + n.toFixed(2); }

function updateSummary() {
  const base = getBasePrice(), disc = getDiscount();
  const tax  = getTax(base, disc), total = getTotal();
  $('sum-plan-name').textContent  = PLANS[selectedPlan].label;
  $('sum-plan-price').textContent = fmt(base);
  $('sum-tax').textContent        = fmt(tax);
  $('sum-total').textContent      = fmt(total);
  if (disc > 0) {
    $('discount-row').classList.remove('hidden');
    $('discount-val').textContent = '-' + fmt(disc);
  } else {
    $('discount-row').classList.add('hidden');
  }
  // Update all pay buttons
  const t = fmt(total);
  ['upi-pay-amount','card-pay-amount','nb-pay-amount'].forEach(id => {
    const el = $(id); if (el) el.textContent = t;
  });
  $('qr-amount').textContent = t;
  updateEmiPlans();
}

// ── Plan Selection ────────────────────────────
document.querySelectorAll('.plan-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    selectedPlan = card.dataset.plan;
    promoDiscount = 0; promoApplied = '';
    $('promo-input').value = '';
    $('promo-msg').textContent = '';
    $('discount-row').classList.add('hidden');
    updateSummary();
  });
});

// ── Promo Code ────────────────────────────────
$('promo-btn').addEventListener('click', () => {
  const code = $('promo-input').value.trim().toUpperCase();
  if (!code) { $('promo-msg').style.color = '#ff6c6c'; $('promo-msg').textContent = 'Enter a promo code'; return; }
  const promo = PROMOS[code];
  if (!promo) { $('promo-msg').style.color = '#ff6c6c'; $('promo-msg').textContent = '❌ Invalid promo code'; promoDiscount = 0; updateSummary(); return; }
  const base = getBasePrice();
  promoDiscount = promo.type === 'percent' ? Math.round(base * promo.val / 100 * 100) / 100 : Math.min(promo.val, base);
  promoApplied  = code;
  $('promo-msg').style.color = '#4cff91';
  $('promo-msg').textContent = `✅ ${promo.label} applied!`;
  updateSummary();
  showToast('🎟️ Promo code applied!');
});
$('promo-input').addEventListener('keydown', e => { if (e.key === 'Enter') $('promo-btn').click(); });

// ── Method Tabs ───────────────────────────────
document.querySelectorAll('.method-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.method-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.method-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    $('panel-' + tab.dataset.method).classList.add('active');
  });
});

// ── UPI ───────────────────────────────────────
document.querySelectorAll('.upi-app').forEach(app => {
  app.addEventListener('click', () => {
    document.querySelectorAll('.upi-app').forEach(a => a.classList.remove('active'));
    app.classList.add('active');
    const hints = { gpay: 'name@okaxis', phonepe: 'name@ybl', paytm: 'name@paytm', bhim: 'name@upi', other: 'yourname@bank' };
    $('upi-id').placeholder = hints[app.dataset.app] || 'yourname@upi';
  });
});

$('upi-verify-btn').addEventListener('click', verifyUPI);
$('upi-id').addEventListener('keydown', e => { if (e.key === 'Enter') verifyUPI(); });

function verifyUPI() {
  const id = $('upi-id').value.trim();
  setErr('upi-err', '');
  $('upi-verified').classList.add('hidden');
  if (!id) { setErr('upi-err', 'Enter your UPI ID'); return; }
  if (!/^[\w.\-]+@[\w]+$/.test(id)) { setErr('upi-err', 'Invalid UPI ID format (e.g. name@upi)'); return; }
  $('upi-verify-btn').textContent = '...';
  setTimeout(() => {
    $('upi-verify-btn').textContent = '✅';
    $('upi-name-display').textContent = id.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    $('upi-verified').classList.remove('hidden');
    showToast('✅ UPI ID verified!');
  }, 1200);
}

$('qrToggleBtn').addEventListener('click', () => {
  const box = $('qr-box');
  const hidden = box.classList.toggle('hidden');
  $('qrToggleBtn').textContent = hidden ? '📷 Show QR Code Instead' : '⌨️ Enter UPI ID Instead';
});

$('upiPayBtn').addEventListener('click', () => {
  const id = $('upi-id').value.trim();
  const qrVisible = !$('qr-box').classList.contains('hidden');
  if (!qrVisible) {
    if (!id) { setErr('upi-err', 'Enter your UPI ID'); return; }
    if (!/^[\w.\-]+@[\w]+$/.test(id)) { setErr('upi-err', 'Invalid UPI ID format'); return; }
  }
  processPayment('UPI', id || 'QR Code');
});

// ── CARD ──────────────────────────────────────
// Live card number formatting + brand detection
$('card-number').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 16);
  this.value = v.replace(/(.{4})/g, '$1 ').trim();
  $('card-num-display').textContent = (v + '•'.repeat(Math.max(0, 16 - v.length))).replace(/(.{4})/g, '$1 ').trim() || '•••• •••• •••• ••••';
  // Brand detection
  const brands = { visa: /^4/, mastercard: /^5[1-5]/, amex: /^3[47]/, rupay: /^6[0-9]/, discover: /^6(?:011|5)/ };
  const icons  = { visa: '💙 VISA', mastercard: '🔴 MC', amex: '🟦 AMEX', rupay: '🇮🇳 RuPay', discover: '🟠 Disc' };
  let brand = '';
  for (const [k, r] of Object.entries(brands)) { if (r.test(v)) { brand = k; break; } }
  $('card-type-badge').textContent = icons[brand] || '';
  $('card-brand-display').textContent = brand ? icons[brand].split(' ')[0] : '💳';
});

$('card-name').addEventListener('input', function () {
  $('card-holder-display').textContent = this.value.toUpperCase() || 'YOUR NAME';
});

$('card-expiry').addEventListener('input', function () {
  let v = this.value.replace(/\D/g, '').slice(0, 4);
  if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
  this.value = v;
  $('card-expiry-display').textContent = v || 'MM/YY';
});

$('cardPayBtn').addEventListener('click', () => {
  clearErr('card-num-err', 'card-name-err', 'card-exp-err', 'card-cvv-err');
  const num  = $('card-number').value.replace(/\s/g, '');
  const name = $('card-name').value.trim();
  const exp  = $('card-expiry').value;
  const cvv  = $('card-cvv').value;
  let ok = true;
  if (num.length < 16) { setErr('card-num-err', 'Enter a valid 16-digit card number'); ok = false; }
  if (!name)           { setErr('card-name-err', 'Enter cardholder name'); ok = false; }
  if (!/^\d{2}\/\d{2}$/.test(exp)) { setErr('card-exp-err', 'Enter valid expiry MM/YY'); ok = false; }
  else {
    const [m, y] = exp.split('/').map(Number);
    const now = new Date(); const cy = now.getFullYear() % 100, cm = now.getMonth() + 1;
    if (m < 1 || m > 12 || y < cy || (y === cy && m < cm)) { setErr('card-exp-err', 'Card has expired'); ok = false; }
  }
  if (cvv.length < 3) { setErr('card-cvv-err', 'Enter valid CVV'); ok = false; }
  if (!ok) return;
  processPayment('Credit/Debit Card', '•••• •••• •••• ' + num.slice(-4));
});

// ── EMI ───────────────────────────────────────
function updateEmiPlans() {
  const total = getTotal();
  const plans = [
    { months: 3,  rate: 0,    id: '3'  },
    { months: 6,  rate: 0.02, id: '6'  },
    { months: 12, rate: 0.05, id: '12' }
  ];
  plans.forEach(p => {
    const totalWithInt = total * (1 + p.rate);
    const emi = totalWithInt / p.months;
    $('emi-' + p.id).textContent = `${fmt(emi)}/mo · ${p.rate === 0 ? '0%' : (p.rate * 100) + '%'} interest`;
    $('emi-' + p.id + '-total').textContent = fmt(totalWithInt);
  });
  updateEmiSummary();
}

function updateEmiSummary() {
  const total = getTotal();
  const rates = { 3: 0, 6: 0.02, 12: 0.05 };
  const rate  = rates[selectedEmiMonths];
  const totalWithInt = total * (1 + rate);
  const emi   = totalWithInt / selectedEmiMonths;
  $('emi-sel-plan').textContent  = selectedEmiMonths + ' Months';
  $('emi-sel-emi').textContent   = fmt(emi);
  $('emi-sel-total').textContent = fmt(totalWithInt);
  $('emi-pay-amount').textContent = fmt(emi);
}

document.querySelectorAll('.emi-plan-row').forEach(row => {
  row.addEventListener('click', () => {
    document.querySelectorAll('.emi-plan-row').forEach(r => r.classList.remove('active'));
    row.classList.add('active');
    selectedEmiMonths = parseInt(row.dataset.months);
    updateEmiSummary();
  });
});

document.querySelectorAll('.emi-bank').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.emi-bank').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
  });
});

$('emiPayBtn').addEventListener('click', () => {
  const card = $('emi-card').value.replace(/\s/g, '');
  setErr('emi-card-err', '');
  if (card.length < 16) { setErr('emi-card-err', 'Enter a valid card number'); return; }
  const rates = { 3: 0, 6: 0.02, 12: 0.05 };
  const emi = (getTotal() * (1 + rates[selectedEmiMonths])) / selectedEmiMonths;
  processPayment('EMI (' + selectedEmiMonths + ' months)', fmt(emi) + '/mo');
});

// ── NET BANKING ───────────────────────────────
document.querySelectorAll('.nb-bank').forEach(b => {
  b.addEventListener('click', () => {
    document.querySelectorAll('.nb-bank').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    $('nb-select').value = '';
  });
});
$('nb-select').addEventListener('change', function () {
  if (this.value) document.querySelectorAll('.nb-bank').forEach(x => x.classList.remove('active'));
});

$('nbPayBtn').addEventListener('click', () => {
  setErr('nb-err', '');
  const selected = document.querySelector('.nb-bank.active');
  const dropdown = $('nb-select').value;
  if (!selected && !dropdown) { setErr('nb-err', 'Please select a bank'); return; }
  const bank = selected ? selected.dataset.bank.toUpperCase() : dropdown;
  processPayment('Net Banking', bank);
});

// ── PAYMENT PROCESSING ────────────────────────
function processPayment(method, detail) {
  const overlay = $('processing-overlay');
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Animate steps
  const steps = ['step1', 'step2', 'step3'];
  steps.forEach(s => { $(s).classList.remove('active', 'done'); });
  $(steps[0]).classList.add('active');

  setTimeout(() => {
    $(steps[0]).classList.remove('active'); $(steps[0]).classList.add('done');
    $(steps[1]).classList.add('active');
  }, 1200);

  setTimeout(() => {
    $(steps[1]).classList.remove('active'); $(steps[1]).classList.add('done');
    $(steps[2]).classList.add('active');
  }, 2400);

  setTimeout(() => {
    $(steps[2]).classList.remove('active'); $(steps[2]).classList.add('done');
    overlay.classList.add('hidden');
    showSuccess(method, detail);
  }, 3600);
}

// ── SUCCESS SCREEN ────────────────────────────
function showSuccess(method, detail) {
  const plan  = PLANS[selectedPlan];
  const total = getTotal();
  const txnId = 'TXN' + Date.now().toString(36).toUpperCase();
  const now   = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
                  ' ' + now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  $('success-plan-msg').textContent = `You are now a ${plan.label} member! 🎮`;
  $('txn-id').textContent     = txnId;
  $('txn-amount').textContent = fmt(total);
  $('txn-plan').textContent   = plan.label;
  $('txn-date').textContent   = dateStr;

  // Save to localStorage
  const session = JSON.parse(localStorage.getItem('na_session') || '{}');
  session.plan  = selectedPlan;
  session.planLabel = plan.label;
  session.planExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  localStorage.setItem('na_session', JSON.stringify(session));
  localStorage.setItem('na_last_txn', JSON.stringify({ txnId, amount: total, plan: plan.label, method, detail, date: dateStr }));

  $('success-overlay').classList.remove('hidden');
  showToast('🎉 Payment successful!');
}

$('goHubBtn').addEventListener('click', () => { window.location.href = 'index.html'; });

$('downloadReceiptBtn').addEventListener('click', () => {
  const txn = JSON.parse(localStorage.getItem('na_last_txn') || '{}');
  const content = [
    '═══════════════════════════════════',
    '        NEONARCADE RECEIPT         ',
    '═══════════════════════════════════',
    `Transaction ID : ${txn.txnId || '—'}`,
    `Date           : ${txn.date  || '—'}`,
    `Plan           : ${txn.plan  || '—'}`,
    `Amount Paid    : ${fmt(txn.amount || 0)}`,
    `Payment Method : ${txn.method || '—'}`,
    `Status         : SUCCESS ✅`,
    '═══════════════════════════════════',
    'Thank you for supporting NeonArcade!',
    'Play at: NeonArcade',
    '═══════════════════════════════════'
  ].join('\n');

  const blob = new Blob([content], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `NeonArcade_Receipt_${txn.txnId || 'receipt'}.txt`;
  a.click();
  showToast('📄 Receipt downloaded!');
});

// ── Init ──────────────────────────────────────
updateSummary();
updateEmiPlans();
