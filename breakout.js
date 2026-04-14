// ── Breakout Blitz ───────────────────────────
const gc  = document.getElementById('gc');
const ctx = gc.getContext('2d');
const W   = gc.width;   // 400
const H   = gc.height;  // 480

// ── Starfield background ──────────────────────
const bgC = document.getElementById('bgCanvas');
const bgX = bgC.getContext('2d');
bgC.width = window.innerWidth;
bgC.height = window.innerHeight;
const stars = Array.from({length: 120}, () => ({
  x: Math.random() * bgC.width,
  y: Math.random() * bgC.height,
  r: Math.random() * 1.2 + 0.3,
  s: Math.random() * 0.4 + 0.1
}));
(function bgLoop() {
  bgX.fillStyle = '#050510';
  bgX.fillRect(0, 0, bgC.width, bgC.height);
  stars.forEach(s => {
    s.y += s.s;
    if (s.y > bgC.height) { s.y = 0; s.x = Math.random() * bgC.width; }
    bgX.beginPath(); bgX.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    bgX.fillStyle = `rgba(255,255,255,${0.3 + s.r * 0.3})`; bgX.fill();
  });
  requestAnimationFrame(bgLoop);
})();

// ── Layout constants ──────────────────────────
// 8 cols × (44px brick + 4px gap) + 4px left pad = 388px — fits 400px canvas
const BRICK_COLS = 8;
const BRICK_ROWS = 5;
const BRICK_PAD  = 4;
const BRICK_TOP  = 50;
const BRICK_W    = Math.floor((W - BRICK_PAD * (BRICK_COLS + 1)) / BRICK_COLS); // ~44px
const BRICK_H    = 16;
const COLORS     = ['#ff6c6c', '#ff9944', '#ffcc00', '#4cff91', '#66ccff', '#cc66ff'];

const PAD_H = 12;
const PAD_Y = H - 36;

// ── Game state ────────────────────────────────
let paddle, ball, bricks, score, level, lives, best, running, raf, launched, bricksHit;

// ── Rounded rect helper (cross-browser) ───────
function rRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ── Init / Restart ────────────────────────────
function initGame() {
  score   = 0;
  level   = 1;
  lives   = 3;
  best    = parseInt(localStorage.getItem('breakoutHS') || '0');
  running = true;
  launched = false;

  bricksHit = 0;
  buildLevel();
  resetBall();
  updateUI();

  document.getElementById('overlay').classList.add('hidden');
  cancelAnimationFrame(raf);
  gameLoop();
}

// ── Build brick grid for current level ────────
function buildLevel() {
  // FIX: use colon `:` not `=` for object properties
  paddle = { x: W / 2 - 45, y: PAD_Y, w: 90, h: PAD_H };
  bricks = [];
  for (let r = 0; r < BRICK_ROWS; r++) {
    for (let c = 0; c < BRICK_COLS; c++) {
      const hp = r < 2 ? Math.min(level + 1, 4) : 1;
      bricks.push({
        x:     BRICK_PAD + c * (BRICK_W + BRICK_PAD),
        y:     BRICK_TOP + r * (BRICK_H + BRICK_PAD),
        w:     BRICK_W,
        h:     BRICK_H,
        hp,
        maxHp: hp,
        color: COLORS[r % COLORS.length],
        alive: true
      });
    }
  }
}

// ── Spawn / reset ball on paddle ──────────────
function resetBall() {
  // Base speed 6, grows +1 per level, capped at 14
  const spd = Math.min(6 + (level - 1) * 1.2, 14);
  ball = {
    x:   paddle.x + paddle.w / 2,
    y:   PAD_Y - 10,
    r:   7,
    dx:  spd * 0.7 * (Math.random() < 0.5 ? 1 : -1),
    dy:  -spd,
    spd: spd          // track base speed for boost
  };
  launched = false;
}

// ── Game loop ─────────────────────────────────
function gameLoop() {
  if (!running) return;
  update();
  draw();
  raf = requestAnimationFrame(gameLoop);
}

// ── Update ────────────────────────────────────
function update() {
  // Ball follows paddle until launched
  if (!launched) {
    ball.x = paddle.x + paddle.w / 2;
    ball.y = PAD_Y - ball.r - 1;
    return;
  }

  ball.x += ball.dx;
  ball.y += ball.dy;

  // Wall bounces
  if (ball.x - ball.r < 0)  { ball.x = ball.r;     ball.dx =  Math.abs(ball.dx); }
  if (ball.x + ball.r > W)  { ball.x = W - ball.r; ball.dx = -Math.abs(ball.dx); }
  if (ball.y - ball.r < 0)  { ball.y = ball.r;     ball.dy =  Math.abs(ball.dy); }

  // Paddle collision
  if (
    ball.dy > 0 &&
    ball.y + ball.r >= paddle.y &&
    ball.y + ball.r <= paddle.y + paddle.h + 4 &&
    ball.x >= paddle.x - ball.r &&
    ball.x <= paddle.x + paddle.w + ball.r
  ) {
    ball.y  = paddle.y - ball.r;
    ball.dy = -Math.abs(ball.dy);
    // Angle based on hit position (-1 left edge, +1 right edge)
    const hit = (ball.x - (paddle.x + paddle.w / 2)) / (paddle.w / 2);
    const spd = Math.hypot(ball.dx, ball.dy);
    ball.dx = hit * spd * 1.1;
    // Clamp so ball never goes perfectly vertical
    ball.dx = Math.max(-spd * 0.95, Math.min(spd * 0.95, ball.dx));
    ball.dy = -Math.sqrt(Math.max(0, spd * spd - ball.dx * ball.dx));
  }

  // Brick collisions
  for (const b of bricks) {
    if (!b.alive) continue;
    if (
      ball.x + ball.r > b.x &&
      ball.x - ball.r < b.x + b.w &&
      ball.y + ball.r > b.y &&
      ball.y - ball.r < b.y + b.h
    ) {
      b.hp--;
      if (b.hp <= 0) {
        b.alive = false;
        score += 10 * level;
        bricksHit++;
        // Speed boost every 5 bricks destroyed (max cap 16)
        if (bricksHit % 5 === 0) {
          const cur = Math.hypot(ball.dx, ball.dy);
          const boost = Math.min(cur + 0.8, 16);
          const ratio = boost / cur;
          ball.dx *= ratio;
          ball.dy *= ratio;
        }
      }

      // Determine bounce axis
      const overlapL = (ball.x + ball.r) - b.x;
      const overlapR = (b.x + b.w) - (ball.x - ball.r);
      const overlapT = (ball.y + ball.r) - b.y;
      const overlapB = (b.y + b.h) - (ball.y - ball.r);
      const minH = Math.min(overlapL, overlapR);
      const minV = Math.min(overlapT, overlapB);
      if (minH < minV) ball.dx *= -1; else ball.dy *= -1;

      updateUI();
      if (score > best) {
        best = score;
        localStorage.setItem('breakoutHS', best);
        document.getElementById('nav-hs').textContent = best;
      }
      break; // one brick per frame
    }
  }

  // All bricks cleared → next level
  if (bricks.every(b => !b.alive)) {
    level++;
    bricksHit = 0;
    buildLevel();
    resetBall();
    updateUI();
    return;
  }

  // Ball fell below canvas
  if (ball.y - ball.r > H) {
    lives--;
    updateUI();
    if (lives <= 0) { endGame(); return; }
    resetBall();
  }
}

// ── Draw ──────────────────────────────────────
function draw() {
  // Background
  ctx.fillStyle = '#0a0a18';
  ctx.fillRect(0, 0, W, H);

  // Subtle grid
  ctx.strokeStyle = '#12122a';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= W / 20; i++) {
    ctx.beginPath(); ctx.moveTo(i * 20, 0); ctx.lineTo(i * 20, H); ctx.stroke();
  }
  for (let j = 0; j <= H / 20; j++) {
    ctx.beginPath(); ctx.moveTo(0, j * 20); ctx.lineTo(W, j * 20); ctx.stroke();
  }

  // Bricks
  bricks.forEach(b => {
    if (!b.alive) return;
    const alpha = 0.45 + 0.55 * (b.hp / b.maxHp);
    ctx.globalAlpha = alpha;
    ctx.fillStyle   = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur  = 10;
    rRect(b.x, b.y, b.w, b.h, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;
    // HP number on multi-hit bricks
    if (b.maxHp > 1) {
      ctx.fillStyle   = '#fff';
      ctx.font        = 'bold 9px Orbitron, sans-serif';
      ctx.textAlign   = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.hp, b.x + b.w / 2, b.y + b.h / 2);
    }
  });

  // Paddle
  ctx.fillStyle   = '#ff6c6c';
  ctx.shadowColor = '#ff6c6c';
  ctx.shadowBlur  = 14;
  rRect(paddle.x, paddle.y, paddle.w, paddle.h, 6);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Ball
  ctx.fillStyle   = '#ffffff';
  ctx.shadowColor = '#ff6c6c';
  ctx.shadowBlur  = 18;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Launch hint
  if (!launched) {
    ctx.fillStyle    = '#ff6c6c66';
    ctx.font         = '11px Orbitron, sans-serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CLICK OR TAP TO LAUNCH', W / 2, H / 2);
  }

  // Level banner (brief)
  ctx.fillStyle    = '#ffffff22';
  ctx.font         = 'bold 11px Orbitron, sans-serif';
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(`LVL ${level}`, W - 8, 8);
}

// ── UI ────────────────────────────────────────
function updateUI() {
  document.getElementById('score').textContent = score;
  document.getElementById('level').textContent = level;
  document.getElementById('lives').textContent = '❤️'.repeat(Math.max(0, lives));
  document.getElementById('best').textContent  = best;
}

// ── Game Over ─────────────────────────────────
function endGame() {
  running = false;
  cancelAnimationFrame(raf);
  if (score > best) { best = score; localStorage.setItem('breakoutHS', best); }
  document.getElementById('otitle').textContent = '💀 Game Over';
  document.getElementById('omsg').textContent   = `Score: ${score}  |  Best: ${best}`;
  document.getElementById('overlay').classList.remove('hidden');
}

// ── Paddle: mouse ─────────────────────────────
gc.addEventListener('mousemove', e => {
  if (!running) return;
  const rect = gc.getBoundingClientRect();
  const scaleX = W / rect.width;
  const mx = (e.clientX - rect.left) * scaleX;
  paddle.x = Math.max(0, Math.min(W - paddle.w, mx - paddle.w / 2));
});

// ── Paddle: touch ─────────────────────────────
gc.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!running) return;
  const rect = gc.getBoundingClientRect();
  const scaleX = W / rect.width;
  const mx = (e.touches[0].clientX - rect.left) * scaleX;
  paddle.x = Math.max(0, Math.min(W - paddle.w, mx - paddle.w / 2));
}, { passive: false });

// ── Launch on click / tap ─────────────────────
gc.addEventListener('click',    () => { if (running && !launched) launched = true; });
gc.addEventListener('touchend', () => { if (running && !launched) launched = true; });

// ── Keyboard: arrow keys move paddle, space launches ──
document.addEventListener('keydown', e => {
  if (!running) return;
  if (e.key === 'ArrowLeft')  paddle.x = Math.max(0, paddle.x - 32);
  if (e.key === 'ArrowRight') paddle.x = Math.min(W - paddle.w, paddle.x + 32);
  if (e.key === ' ' && !launched) { launched = true; e.preventDefault(); }
});

// ── Start button ──────────────────────────────
document.getElementById('startBtn').addEventListener('click', initGame);

// ── Show best on load ─────────────────────────
const savedBest = parseInt(localStorage.getItem('breakoutHS') || '0');
document.getElementById('best').textContent    = savedBest;
document.getElementById('nav-hs').textContent  = savedBest;
