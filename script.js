let mode = null; // 'offline' or 'online'
let peer=null, conn=null, mySymbol='X', otherSymbol='O', board=["","","","","","","","",""], myScore=0, otherScore=0, currentTurn='X', round=1, maxRounds=5, gameOver=false;

const gridEl=document.getElementById('grid'), statusEl=document.getElementById('status'), scoreEl=document.getElementById('score'), roundInfo=document.getElementById('roundInfo');

// --- التنقل بين القوائم ---
function showOnlineMenu(){ document.getElementById('mainMenu').style.display='none'; document.getElementById('onlineLobby').style.display='block'; }
function backToMain(){ document.getElementById('onlineLobby').style.display='none'; document.getElementById('mainMenu').style.display='block'; }

// --- 1. نظام الاوفلاين ---
function startOffline(){
  mode='offline';
  mySymbol='X'; otherSymbol='O'; round=1; myScore=0; otherScore=0;
  document.getElementById('mainMenu').style.display='none';
  document.getElementById('gameArea').style.display='block';
  document.getElementById('info').textContent='وضع: اوفلاين على نفس الجهاز';
  document.getElementById('mySym').textContent='';
  document.getElementById('roomCodeGame').textContent='';
  resetOfflineBoard();
}

function resetOfflineBoard(){
  board=["","","","","","","","",""]; gameOver=false; currentTurn = (round%2===1)?'X':'O';
  buildGrid(); updateOfflineUI();
}

function updateOfflineUI(){
  statusEl.textContent = `دور: ${currentTurn} - الجولة ${round} من ${maxRounds}`;
  roundInfo.textContent = `الجولة ${round} من ${maxRounds}`;
  scoreEl.textContent = `X: ${mySymbol==='X'?myScore:otherScore} | O: ${mySymbol==='O'?myScore:otherScore}`;
  if(mySymbol==='X') scoreEl.textContent = `انت (X): ${myScore} | صاحبك (O): ${otherScore}`;
  else scoreEl.textContent = `صاحبك (X): ${otherScore} | انت (O): ${myScore}`;
}

// --- 2. نظام الاونلاين ---
function createRoom(){
  let roomId = Math.floor(1000+Math.random()*9000).toString();
  mode='online'; mySymbol='X';
  peer = new Peer('xo-'+roomId);
  peer.on('open', ()=>{
    document.getElementById('myIdText').style.display='block';
    document.getElementById('roomCode').textContent=roomId;
    document.getElementById('roomCodeGame').textContent=roomId;
    document.getElementById('mySym').textContent='X';
    document.getElementById('onlineLobby').style.display='none';
    document.getElementById('gameArea').style.display='block';
    document.getElementById('info').innerHTML=`كود الغرفة: <b style="color:#ffe600">${roomId}</b> | انت: X`;
    statusEl.textContent='مستني اليوزر التاني يدخل... ابعتله الكود';
    buildGrid();
  });
  peer.on('connection', c=>{ conn=c; setupConnection(); });
}

function joinRoom(){
  let code = document.getElementById('roomInput').value.trim();
  if(!code) return alert('اكتب الكود الاول');
  mode='online'; mySymbol='O';
  peer = new Peer();
  peer.on('open', ()=>{
    conn = peer.connect('xo-'+code);
    document.getElementById('roomCodeGame').textContent=code;
    document.getElementById('mySym').textContent='O';
    document.getElementById('onlineLobby').style.display='none';
    document.getElementById('gameArea').style.display='block';
    document.getElementById('info').innerHTML=`الغرفة: ${code} | انت: O`;
    buildGrid(); setupConnection();
  });
}

function setupConnection(){
  conn.on('open', ()=>{
    statusEl.textContent = mySymbol==='X'? 'اليوزر دخل! دورك انت X' : 'دخلت! دور صاحبك X استنى...';
    if(mySymbol==='X') conn.send({board, turn:currentTurn, myScore, otherScore});
  });
  conn.on('data', data=>{
    board=data.board; currentTurn=data.turn; myScore=data.scores?data.scores[mySymbol==='X'?'O':'X']?0:0:data.myScore; otherScore=data.otherScore;
    // تصحيح النقط
    if(data.scores){ myScore=data.scores[mySymbol]; otherScore=data.scores[mySymbol==='X'?'O':'X']; }
    else { myScore=data.myScore; otherScore=data.otherScore; if(mySymbol==='O'){ let tmp=myScore; myScore=otherScore; otherScore=tmp; } } // عشان النقط متتلخبطش
    // هنخليها ابسط: نبعت scores كـ object
    if(data.scoresObj){ myScore=data.scoresObj[mySymbol]; otherScore=data.scoresObj[mySymbol==='X'?'O':'X']; }
    renderBoard(); checkWinAndHandle(false);
    scoreEl.textContent=`انت: ${myScore} | اليوزر التاني: ${otherScore}`;
  });
}

// --- مشترك بين الاتنين ---
function buildGrid(){
  gridEl.innerHTML='';
  for(let i=0;i<9;i++){
    let d=document.createElement('div');
    d.className='cell'; d.id='c'+i;
    d.onclick=()=>handleClick(i);
    gridEl.appendChild(d);
  }
}

function handleClick(i){
  if(mode==='offline') playOffline(i);
  else playOnline(i);
}

function playOffline(i){
  if(board[i]!=='' || gameOver) return;
  board[i]=currentTurn;
  renderBoard();
  let win=checkWin(board);
  if(win){ win.combo.forEach(j=>document.getElementById('c'+j).classList.add('win')); if(win.winner==='X'){ if(mySymbol==='X') myScore++; else otherScore++; } else { if(mySymbol==='O') myScore++; else otherScore++; } statusEl.textContent=`كسب الجولة: ${win.winner}!`; gameOver=true; if(round>=maxRounds) setTimeout(()=>{ statusEl.textContent= myScore>otherScore?`انت البطل ${myScore}-${otherScore}`:myScore<otherScore?`صاحبك البطل ${otherScore}-${myScore}`:`تعادل ${myScore}-${otherScore}`; },500); else setTimeout(()=>{ round++; resetOfflineBoard(); },2000); return; }
  if(board.every(v=>v!=='')){ statusEl.textContent='تعادل!'; gameOver=true; if(round<maxRounds) setTimeout(()=>{ round++; resetOfflineBoard(); },2000); return; }
  currentTurn = currentTurn==='X'?'O':'X'; updateOfflineUI();
}

function playOnline(i){
  if(board[i]!=='' || gameOver || currentTurn!==mySymbol) return;
  board[i]=mySymbol; currentTurn=mySymbol==='X'?'O':'X';
  renderBoard();
  let ended = checkWinAndHandle(true);
  // ابعت للي معاك
  if(conn) conn.send({board, turn:currentTurn, myScore, otherScore, scoresObj: {[mySymbol]:mySymbol==='X'?myScore:otherScore, [mySymbol==='X'?'O':'X']:mySymbol==='X'?otherScore:myScore} });
  if(ended) setTimeout(resetOnlineBoard,2000);
}

function renderBoard(){
  board.forEach((v,i)=>{ let c=document.getElementById('c'+i); if(c){ c.textContent=v; c.className='cell '+(v?v.toLowerCase():''); } });
  if(mode==='offline') updateOfflineUI();
  else { statusEl.textContent = gameOver?statusEl.textContent : (currentTurn===mySymbol?`دورك انت (${mySymbol})`:`دور اليوزر التاني (${currentTurn})`); }
}

function checkWin(b){ const combos=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; for(let c of combos){ if(b[c[0]]&&b[c[0]]===b[c[1]]&&b[c[0]]===b[c[2]]) return {winner:b[c[0]], combo:c}; } return null; }

function checkWinAndHandle(isMyMove){
  let win=checkWin(board);
  if(win){
    gameOver=true; win.combo.forEach(j=>document.getElementById('c'+j).classList.add('win'));
    if(win.winner===mySymbol){ myScore++; statusEl.textContent='كسبت الجولة! 🎉'; } else { otherScore++; statusEl.textContent='اليوزر التاني كسب الجولة'; }
    scoreEl.textContent=`انت: ${myScore} | اليوزر التاني: ${otherScore}`;
    return true;
  }
  if(board.every(v=>v!=='')){ gameOver=true; statusEl.textContent='تعادل 🤝'; return true; }
  return false;
}

function resetOnlineBoard(){
  board=["","","","","","","","",""]; currentTurn='X'; gameOver=false; buildGrid();
  if(mySymbol==='X' && conn) conn.send({board, turn:currentTurn, scoresObj:{[mySymbol]:myScore, [mySymbol==='X'?'O':'X']:otherScore}});
}