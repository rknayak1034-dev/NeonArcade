// ─────────────────────────────────────────────
//  Classic Snake Game — script.js
// ─────────────────────────────────────────────

const canvas   = document.getElementById('gameCanvas');
const ctx      = canvas.getContext('2d');
const scoreEl  = document.getElementById('score');
const hsEl     = document.getElementById('high-score');
const overlay  = document.getElementById('overlay');
const oTitle   = document.getElementById('overlay-title');
const oScore   = document.getElementById('overlay-score');
const pauseBtn = document.getElementById('pauseBtn');

// ── Grid ──────────────────────────────────────
const COLS = 20, ROWS = 20;
const CELL = canvas.width / COLS;   // 20px per cell

// ── Game State ────────────────────────────────
let snake, dir, nextDir, food, score, highScore, loop, baseSpeed, paused;

// ── Difficulty ────────────────────────────────
let baseInterval = 150;   // ms — default Easy

document.querySelectorAll('.diff-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.diff-btn.active').classList.remove('active');
    btn.classList.add('active');
    baseInterval = parseInt(btn.dataset.speed);
    if (loop) { clearInterval(loop); initGame(); startLoop(); draw(); }
  });
});

// ── Web Audio (no files needed) ───────────────
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playTone(freq, type = 'square', duration = 0.08) {
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

const sfxEat  = () => playTone(520, 'square', 0.1);
const sfxDie  = () => playTone(160, 'sawtooth', 0.4);

// ── Init / Restart ────────────────────────────
function initGame() {
  snake    = [{ x: 10, y: 10 }];
  dir      = { x: 1, y: 0 };
  nextDir  = { x: 1, y: 0 };
  score    = 0;
  paused   = false;
  highScore = parseInt(localStorage.getItem('snakeHS') || '0');
  scoreEl.textContent = 0;
  hsEl.textContent    = highScore;
  pauseBtn.textContent = '⏸ Pause';
  overlay.classList.add('hidden');
  placeFood();
}

function restartGame() {
  clearInterval(loop);
  initGame();
  startLoop();
}

// ── Game Loop ─────────────────────────────────
function startLoop() {
  // Speed increases every 5 points (min 40 ms)
  const interval = Math.max(40, baseInterval - Math.floor(score / 5) * 8);
  loop = setInterval(tick, interval);
}

function tick() {
  if (paused) return;
  dir = { ...nextDir };
  moveSnake();
}

// ── Snake Movement ────────────────────────────
function moveSnake() {
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  // Wall collision
  if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) return gameOver();

  // Self collision
  if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();

  snake.unshift(head);

  // Food eaten
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    sfxEat();
    placeFood();
    // Restart loop with updated speed
    clearInterval(loop);
    startLoop();
  } else {
    snake.pop();   // remove tail only if no food eaten
  }

  draw();
}

// ── Food Placement ────────────────────────────
function placeFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

// ── Drawing ───────────────────────────────────
function draw() {
  // Background
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Optional subtle grid
  ctx.strokeStyle = '#1a1a1a';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
  }
  for (let j = 0; j <= ROWS; j++) {
    ctx.beginPath(); ctx.moveTo(0, j * CELL); ctx.lineTo(canvas.width, j * CELL); ctx.stroke();
  }

  // Food — glowing circle
  const fx = food.x * CELL + CELL / 2;
  const fy = food.y * CELL + CELL / 2;
  ctx.shadowColor = '#ff4c4c';
  ctx.shadowBlur  = 12;
  ctx.fillStyle   = '#ff4c4c';
  ctx.beginPath();
  ctx.arc(fx, fy, CELL / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Snake
  snake.forEach((seg, i) => {
    const isHead = i === 0;
    const ratio  = 1 - i / snake.length;   // gradient from head to tail
    ctx.fillStyle = isHead
      ? '#4cff91'
      : `hsl(145, 80%, ${25 + ratio * 30}%)`;
    ctx.shadowColor = isHead ? '#4cff91' : 'transparent';
    ctx.shadowBlur  = isHead ? 10 : 0;
    roundRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2, 4);
    ctx.shadowBlur = 0;
  });
}

// Helper: rounded rectangle fill
function roundRect(x, y, w, h, r) {
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
  ctx.fill();
}

// ── Collision → Game Over ─────────────────────
function gameOver() {
  clearInterval(loop);
  sfxDie();

  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('snakeHS', highScore);
    hsEl.textContent = highScore;
  }

  oTitle.textContent = '💀 Game Over';
  oScore.textContent = `Score: ${score}  |  Best: ${highScore}`;
  overlay.classList.remove('hidden');
}

// ── Pause / Resume ────────────────────────────
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
});

// ── Restart Button ────────────────────────────
document.getElementById('restartBtn').addEventListener('click', () => {
  overlay.classList.add('hidden');
  showStartScreen();
});

// ── Keyboard Controls ─────────────────────────
const KEY_MAP = {
  ArrowUp:    { x: 0,  y: -1 },
  ArrowDown:  { x: 0,  y:  1 },
  ArrowLeft:  { x: -1, y:  0 },
  ArrowRight: { x: 1,  y:  0 },
};

document.addEventListener('keydown', e => {
  const d = KEY_MAP[e.key];
  if (!d) return;
  e.preventDefault();   // stop page scroll

  // Resume on keypress if paused
  if (paused) { paused = false; pauseBtn.textContent = '⏸ Pause'; }

  // Prevent 180° reversal
  if (d.x === -dir.x && d.y === -dir.y) return;
  nextDir = d;
});

// ── Touch / Swipe Support ─────────────────────
let touchStart = null;

canvas.addEventListener('touchstart', e => {
  touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
}, { passive: true });

canvas.addEventListener('touchend', e => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  touchStart = null;

  if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;   // tap, ignore

  let d;
  if (Math.abs(dx) > Math.abs(dy)) {
    d = dx > 0 ? KEY_MAP.ArrowRight : KEY_MAP.ArrowLeft;
  } else {
    d = dy > 0 ? KEY_MAP.ArrowDown : KEY_MAP.ArrowUp;
  }
  if (d.x === -dir.x && d.y === -dir.y) return;
  nextDir = d;
}, { passive: true });

// ── Start Screen ─────────────────────────────
const startOverlay = document.getElementById('start-overlay');
const startBtn     = document.getElementById('startBtn');
const startHsVal   = document.getElementById('start-hs-val');

function showStartScreen() {
  const hs = parseInt(localStorage.getItem('snakeHS') || '0');
  startHsVal.textContent = hs;
  startOverlay.classList.remove('hidden');
  // Draw idle board behind the overlay
  drawIdleBoard();
}

function drawIdleBoard() {
  ctx.fillStyle = '#0a0a18';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#12122a';
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= COLS; i++) {
    ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
  }
  for (let j = 0; j <= ROWS; j++) {
    ctx.beginPath(); ctx.moveTo(0, j * CELL); ctx.lineTo(canvas.width, j * CELL); ctx.stroke();
  }
}

startBtn.addEventListener('click', () => {
  startOverlay.classList.add('hidden');
  initGame();
  startLoop();
  draw();
});

// Show start screen on load (don't auto-start)
showStartScreen();
