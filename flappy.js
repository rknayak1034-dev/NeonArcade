// ── Flappy Neon ──────────────────────────────
const gc  = document.getElementById('gc');
const ctx = gc.getContext('2d');
const W=gc.width, H=gc.height;

// Starfield bg
const bgC=document.getElementById('bgCanvas'),bgX=bgC.getContext('2d');
bgC.width=window.innerWidth;bgC.height=window.innerHeight;
const stars=Array.from({length:120},()=>({x:Math.random()*bgC.width,y:Math.random()*bgC.height,r:Math.random()*1.2+.3,s:Math.random()*.4+.1}));
(function bg(){bgX.fillStyle='#050510';bgX.fillRect(0,0,bgC.width,bgC.height);stars.forEach(s=>{s.y+=s.s;if(s.y>bgC.height){s.y=0;s.x=Math.random()*bgC.width;}bgX.beginPath();bgX.arc(s.x,s.y,s.r,0,Math.PI*2);bgX.fillStyle=`rgba(255,255,255,${.3+s.r*.3})`;bgX.fill();});requestAnimationFrame(bg);})();

const GRAVITY=0.45, FLAP=-8, PIPE_W=52, GAP=130, PIPE_SPEED=2.4;
let bird, pipes, score, best, state, raf, frameCount;
// state: 'idle' | 'playing' | 'dead'

function init(){
  bird={x:80, y:H/2, vy:0, r:14};
  pipes=[]; score=0; frameCount=0;
  best=parseInt(localStorage.getItem('flappyHS')||'0');
  state='idle';
  document.getElementById('score').textContent=0;
  document.getElementById('best').textContent=best;
  document.getElementById('nav-hs').textContent=best;
  cancelAnimationFrame(raf); loop();
}

function flap(){
  if(state==='idle'){ state='playing'; }
  else if(state==='dead'){ init(); return; }
  bird.vy=FLAP;
}

function spawnPipe(){
  const top=60+Math.random()*(H-GAP-120);
  pipes.push({x:W, top, scored:false});
}

function loop(){
  update(); draw();
  raf=requestAnimationFrame(loop);
}

function update(){
  if(state!=='playing') return;
  frameCount++;
  bird.vy+=GRAVITY; bird.y+=bird.vy;
  // Spawn pipes
  if(frameCount%90===0) spawnPipe();
  // Move pipes
  pipes.forEach(p=>p.x-=PIPE_SPEED);
  pipes=pipes.filter(p=>p.x+PIPE_W>0);
  // Score
  pipes.forEach(p=>{
    if(!p.scored && p.x+PIPE_W<bird.x){ p.scored=true; score++; document.getElementById('score').textContent=score; }
  });
  // Collision
  if(bird.y-bird.r<0||bird.y+bird.r>H){ die(); return; }
  for(const p of pipes){
    if(bird.x+bird.r>p.x && bird.x-bird.r<p.x+PIPE_W){
      if(bird.y-bird.r<p.top || bird.y+bird.r>p.top+GAP){ die(); return; }
    }
  }
}

function die(){
  state='dead';
  if(score>best){ best=score; localStorage.setItem('flappyHS',best); document.getElementById('best').textContent=best; document.getElementById('nav-hs').textContent=best; }
}

function draw(){
  // BG
  ctx.fillStyle='#0a0a18'; ctx.fillRect(0,0,W,H);
  // Grid
  ctx.strokeStyle='#12122a'; ctx.lineWidth=.5;
  for(let i=0;i<=16;i++){ctx.beginPath();ctx.moveTo(i*20,0);ctx.lineTo(i*20,H);ctx.stroke();}
  for(let j=0;j<=24;j++){ctx.beginPath();ctx.moveTo(0,j*20);ctx.lineTo(W,j*20);ctx.stroke();}
  // Pipes
  pipes.forEach(p=>{
    ctx.fillStyle='#4cff91'; ctx.shadowColor='#4cff91'; ctx.shadowBlur=10;
    // Top pipe
    ctx.beginPath(); ctx.roundRect(p.x,0,PIPE_W,p.top,4); ctx.fill();
    // Bottom pipe
    ctx.beginPath(); ctx.roundRect(p.x,p.top+GAP,PIPE_W,H-(p.top+GAP),4); ctx.fill();
    ctx.shadowBlur=0;
    // Pipe caps
    ctx.fillStyle='#3dcc77';
    ctx.fillRect(p.x-4,p.top-14,PIPE_W+8,14);
    ctx.fillRect(p.x-4,p.top+GAP,PIPE_W+8,14);
  });
  // Bird
  const tilt=Math.min(Math.max(bird.vy*3,-30),70);
  ctx.save(); ctx.translate(bird.x,bird.y); ctx.rotate(tilt*Math.PI/180);
  ctx.font=`${bird.r*2.2}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🐦',0,0);
  ctx.restore();
  // Score on canvas
  ctx.fillStyle='#ffcc00'; ctx.font='bold 28px Orbitron,sans-serif'; ctx.textAlign='center';
  ctx.shadowColor='#ffcc00'; ctx.shadowBlur=12;
  ctx.fillText(score,W/2,50); ctx.shadowBlur=0;
  // Idle screen
  if(state==='idle'){
    ctx.fillStyle='#05051099'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffcc00'; ctx.font='bold 22px Orbitron,sans-serif'; ctx.textAlign='center';
    ctx.shadowColor='#ffcc00'; ctx.shadowBlur=16;
    ctx.fillText('🐦 FLAPPY NEON',W/2,H/2-40); ctx.shadowBlur=0;
    ctx.fillStyle='#fff'; ctx.font='14px Orbitron,sans-serif';
    ctx.fillText('Tap / Click to Start',W/2,H/2+10);
    ctx.fillStyle='#ffcc0066'; ctx.font='12px Orbitron,sans-serif';
    ctx.fillText(`Best: ${best}`,W/2,H/2+40);
  }
  // Dead screen
  if(state==='dead'){
    ctx.fillStyle='#05051099'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ff6c6c'; ctx.font='bold 22px Orbitron,sans-serif'; ctx.textAlign='center';
    ctx.shadowColor='#ff6c6c'; ctx.shadowBlur=16;
    ctx.fillText('💀 GAME OVER',W/2,H/2-50); ctx.shadowBlur=0;
    ctx.fillStyle='#fff'; ctx.font='16px Orbitron,sans-serif';
    ctx.fillText(`Score: ${score}`,W/2,H/2-10);
    ctx.fillStyle='#ffcc00'; ctx.font='14px Orbitron,sans-serif';
    ctx.fillText(`Best: ${best}`,W/2,H/2+20);
    ctx.fillStyle='#4cff91'; ctx.font='13px Orbitron,sans-serif';
    ctx.fillText('Tap to Play Again',W/2,H/2+60);
  }
}

// Input
gc.addEventListener('click', flap);
gc.addEventListener('touchend', e=>{ e.preventDefault(); flap(); },{passive:false});
document.addEventListener('keydown', e=>{ if(e.code==='Space'||e.code==='ArrowUp'){ e.preventDefault(); flap(); } });

init();
