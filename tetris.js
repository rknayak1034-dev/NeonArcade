// ── Neon Tetris ──────────────────────────────
const gc   = document.getElementById('gc');
const ctx  = gc.getContext('2d');
const nc   = document.getElementById('nextCanvas');
const nctx = nc.getContext('2d');
const COLS=10, ROWS=20, CELL=20;

const COLORS = {
  I:'#66ffff', O:'#ffcc00', T:'#cc66ff',
  S:'#4cff91', Z:'#ff6c6c', J:'#66aaff', L:'#ff9944'
};
const PIECES = {
  I:[[1,1,1,1]],
  O:[[1,1],[1,1]],
  T:[[0,1,0],[1,1,1]],
  S:[[0,1,1],[1,1,0]],
  Z:[[1,1,0],[0,1,1]],
  J:[[1,0,0],[1,1,1]],
  L:[[0,0,1],[1,1,1]]
};

let board, score, level, lines, best, piece, pieceX, pieceY, pieceType, nextType, loop, running;

// Starfield
const bgC=document.getElementById('bgCanvas');
const bgX=bgC.getContext('2d');
bgC.width=window.innerWidth; bgC.height=window.innerHeight;
const stars=Array.from({length:120},()=>({x:Math.random()*bgC.width,y:Math.random()*bgC.height,r:Math.random()*1.2+.3,s:Math.random()*.4+.1}));
(function drawBg(){bgX.fillStyle='#050510';bgX.fillRect(0,0,bgC.width,bgC.height);stars.forEach(s=>{s.y+=s.s;if(s.y>bgC.height){s.y=0;s.x=Math.random()*bgC.width;}bgX.beginPath();bgX.arc(s.x,s.y,s.r,0,Math.PI*2);bgX.fillStyle=`rgba(255,255,255,${.3+s.r*.3})`;bgX.fill();});requestAnimationFrame(drawBg);})();

function newBoard(){ return Array.from({length:ROWS},()=>Array(COLS).fill(0)); }

function randomType(){ const k=Object.keys(PIECES); return k[Math.floor(Math.random()*k.length)]; }

function initGame(){
  board=newBoard(); score=0; level=1; lines=0;
  best=parseInt(localStorage.getItem('tetrisHS')||'0');
  updateUI(); nextType=randomType(); spawnPiece(); running=true;
  document.getElementById('overlay').classList.add('hidden');
  clearInterval(loop); loop=setInterval(tick, getSpeed());
}

function getSpeed(){ return Math.max(80, 500 - (level-1)*45); }

function spawnPiece(){
  pieceType=nextType; nextType=randomType();
  piece=PIECES[pieceType].map(r=>[...r]);
  pieceX=Math.floor((COLS-piece[0].length)/2); pieceY=0;
  drawNext();
  if(collides(piece,pieceX,pieceY)){ endGame(); }
}

function collides(p,ox,oy){
  for(let r=0;r<p.length;r++) for(let c=0;c<p[r].length;c++){
    if(!p[r][c]) continue;
    const nx=ox+c, ny=oy+r;
    if(nx<0||nx>=COLS||ny>=ROWS) return true;
    if(ny>=0 && board[ny][nx]) return true;
  }
  return false;
}

function rotate(p){ return p[0].map((_,i)=>p.map(r=>r[i]).reverse()); }

function lock(){
  piece.forEach((r,ri)=>r.forEach((v,ci)=>{ if(v && pieceY+ri>=0) board[pieceY+ri][pieceX+ci]=pieceType; }));
  clearLines(); spawnPiece();
}

function clearLines(){
  let cleared=0;
  for(let r=ROWS-1;r>=0;r--){
    if(board[r].every(c=>c)){ board.splice(r,1); board.unshift(Array(COLS).fill(0)); cleared++; r++; }
  }
  if(cleared){
    const pts=[0,100,300,500,800];
    score += (pts[cleared]||800)*level;
    lines += cleared;
    level = Math.floor(lines/10)+1;
    clearInterval(loop); loop=setInterval(tick,getSpeed());
    updateUI();
    if(score>best){ best=score; localStorage.setItem('tetrisHS',best); document.getElementById('nav-hs').textContent=best; }
  }
}

function tick(){ if(!running) return; pieceY++; if(collides(piece,pieceX,pieceY)){ pieceY--; lock(); } draw(); }

function updateUI(){
  document.getElementById('score').textContent=score;
  document.getElementById('level').textContent=level;
  document.getElementById('lines').textContent=lines;
  document.getElementById('best').textContent=best;
  document.getElementById('nav-hs').textContent=best;
}

function draw(){
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,gc.width,gc.height);
  // Grid
  ctx.strokeStyle='#12122a'; ctx.lineWidth=.5;
  for(let i=0;i<=COLS;i++){ctx.beginPath();ctx.moveTo(i*CELL,0);ctx.lineTo(i*CELL,gc.height);ctx.stroke();}
  for(let j=0;j<=ROWS;j++){ctx.beginPath();ctx.moveTo(0,j*CELL);ctx.lineTo(gc.width,j*CELL);ctx.stroke();}
  // Board
  board.forEach((row,r)=>row.forEach((v,c)=>{ if(v) drawCell(ctx,c,r,COLORS[v]); }));
  // Ghost
  let gy=pieceY;
  while(!collides(piece,pieceX,gy+1)) gy++;
  piece.forEach((r,ri)=>r.forEach((v,ci)=>{ if(v) drawCell(ctx,pieceX+ci,gy+ri,COLORS[pieceType],0.2); }));
  // Active piece
  piece.forEach((r,ri)=>r.forEach((v,ci)=>{ if(v) drawCell(ctx,pieceX+ci,pieceY+ri,COLORS[pieceType]); }));
}

function drawCell(c,x,y,color,alpha=1){
  c.globalAlpha=alpha;
  c.fillStyle=color; c.shadowColor=color; c.shadowBlur=alpha===1?8:0;
  c.fillRect(x*CELL+1,y*CELL+1,CELL-2,CELL-2);
  c.globalAlpha=1; c.shadowBlur=0;
}

function drawNext(){
  nctx.fillStyle='#0a0a18'; nctx.fillRect(0,0,nc.width,nc.height);
  const p=PIECES[nextType], cs=16;
  const ox=Math.floor((nc.width/cs-p[0].length)/2);
  const oy=Math.floor((nc.height/cs-p.length)/2);
  p.forEach((r,ri)=>r.forEach((v,ci)=>{ if(v){ nctx.fillStyle=COLORS[nextType]; nctx.shadowColor=COLORS[nextType]; nctx.shadowBlur=6; nctx.fillRect((ox+ci)*cs+1,(oy+ri)*cs+1,cs-2,cs-2); nctx.shadowBlur=0; } }));
}

function endGame(){
  running=false; clearInterval(loop);
  if(score>best){ best=score; localStorage.setItem('tetrisHS',best); }
  const ov=document.getElementById('overlay');
  document.getElementById('otitle').textContent='💀 Game Over';
  document.getElementById('omsg').textContent=`Score: ${score} | Best: ${best}`;
  ov.classList.remove('hidden');
}

// Controls
document.addEventListener('keydown',e=>{
  if(!running) return;
  if(e.key==='ArrowLeft'){ if(!collides(piece,pieceX-1,pieceY)) pieceX--; }
  else if(e.key==='ArrowRight'){ if(!collides(piece,pieceX+1,pieceY)) pieceX++; }
  else if(e.key==='ArrowDown'){ pieceY++; if(collides(piece,pieceX,pieceY)) { pieceY--; lock(); } }
  else if(e.key==='ArrowUp'||e.key===' '){ const r=rotate(piece); if(!collides(r,pieceX,pieceY)) piece=r; e.preventDefault(); }
  draw();
});
document.getElementById('btn-left').addEventListener('click',()=>{ if(!running) return; if(!collides(piece,pieceX-1,pieceY)) pieceX--; draw(); });
document.getElementById('btn-right').addEventListener('click',()=>{ if(!running) return; if(!collides(piece,pieceX+1,pieceY)) pieceX++; draw(); });
document.getElementById('btn-down').addEventListener('click',()=>{ if(!running) return; pieceY++; if(collides(piece,pieceX,pieceY)){pieceY--;lock();} draw(); });
document.getElementById('btn-rotate').addEventListener('click',()=>{ if(!running) return; const r=rotate(piece); if(!collides(r,pieceX,pieceY)) piece=r; draw(); });
document.getElementById('startBtn').addEventListener('click', initGame);

// Load best
const b=parseInt(localStorage.getItem('tetrisHS')||'0');
document.getElementById('best').textContent=b;
document.getElementById('nav-hs').textContent=b;
