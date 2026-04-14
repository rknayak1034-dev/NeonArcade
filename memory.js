// ── Memory Match ─────────────────────────────
const EMOJIS = ['🐍','🔥','❄️','⚡','👻','🌟','💀','🐉','🎯','🧱','🃏','🐦','🎮','🏆','🚀','💎','🌈','🎵'];

let cards=[], flipped=[], matched=0, moves=0, lockBoard=false, timerInterval, seconds=0, gridSize=4, totalPairs;

// Starfield
const bgC=document.getElementById('bgCanvas'),bgX=bgC.getContext('2d');
bgC.width=window.innerWidth;bgC.height=window.innerHeight;
const stars=Array.from({length:120},()=>({x:Math.random()*bgC.width,y:Math.random()*bgC.height,r:Math.random()*1.2+.3,s:Math.random()*.4+.1}));
(function bg(){bgX.fillStyle='#050510';bgX.fillRect(0,0,bgC.width,bgC.height);stars.forEach(s=>{s.y+=s.s;if(s.y>bgC.height){s.y=0;s.x=Math.random()*bgC.width;}bgX.beginPath();bgX.arc(s.x,s.y,s.r,0,Math.PI*2);bgX.fillStyle=`rgba(255,255,255,${.3+s.r*.3})`;bgX.fill();});requestAnimationFrame(bg);})();

function initGame(){
  clearInterval(timerInterval); seconds=0; moves=0; matched=0; flipped=[]; lockBoard=false;
  document.getElementById('moves').textContent=0;
  document.getElementById('pairs').textContent=0;
  document.getElementById('timer').textContent='0s';
  document.getElementById('msg').textContent='Find all matching pairs!';

  const cols = gridSize===4 ? 4 : 6;
  const rows = 4;
  totalPairs = (cols*rows)/2;
  const pool = EMOJIS.slice(0,totalPairs);
  const deck = [...pool,...pool].sort(()=>Math.random()-.5);

  const grid = document.getElementById('grid');
  grid.style.gridTemplateColumns = `repeat(${cols},1fr)`;
  grid.innerHTML='';
  cards=[];

  deck.forEach((emoji,i)=>{
    const card=document.createElement('div');
    card.className='card';
    card.innerHTML=`<div class="card-back">🎮</div><div class="card-face">${emoji}</div>`;
    card.dataset.emoji=emoji; card.dataset.index=i;
    card.addEventListener('click',()=>flipCard(card));
    grid.appendChild(card); cards.push(card);
  });

  timerInterval=setInterval(()=>{
    seconds++;
    document.getElementById('timer').textContent=seconds+'s';
  },1000);
}

function flipCard(card){
  if(lockBoard||card.classList.contains('flipped')||card.classList.contains('matched')) return;
  card.classList.add('flipped');
  flipped.push(card);
  if(flipped.length===2) checkMatch();
}

function checkMatch(){
  lockBoard=true; moves++;
  document.getElementById('moves').textContent=moves;
  const [a,b]=flipped;
  if(a.dataset.emoji===b.dataset.emoji){
    a.classList.add('matched'); b.classList.add('matched');
    matched++; document.getElementById('pairs').textContent=matched;
    flipped=[]; lockBoard=false;
    if(matched===totalPairs) winGame();
  } else {
    setTimeout(()=>{
      a.classList.remove('flipped'); b.classList.remove('flipped');
      flipped=[]; lockBoard=false;
    },900);
  }
}

function winGame(){
  clearInterval(timerInterval);
  const key=`memoryHS_${gridSize}`;
  const prev=parseInt(localStorage.getItem(key)||'9999');
  const score=moves*10+seconds;
  if(moves<prev||prev===9999){ localStorage.setItem(key,moves); localStorage.setItem('memoryHS',moves); }
  const best=localStorage.getItem(key)||moves;
  document.getElementById('best').textContent=best+' moves';
  document.getElementById('nav-hs').textContent=best;
  document.getElementById('msg').textContent=`🎉 Done! ${moves} moves in ${seconds}s`;
}

document.getElementById('newBtn').addEventListener('click',initGame);
document.querySelectorAll('.dbtn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelector('.dbtn.active').classList.remove('active');
    btn.classList.add('active');
    gridSize=parseInt(btn.dataset.size);
    initGame();
  });
});

// Load best
const b=localStorage.getItem('memoryHS');
document.getElementById('best').textContent=b?b+' moves':'—';
document.getElementById('nav-hs').textContent=b||0;

initGame();
