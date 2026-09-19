let mySymbol='', otherSymbol='', currentTurn='', myScore=0, otherScore=0, round=1, maxRounds=5, gameOver=false, board=["","","","","","","","",""];
const grid=document.getElementById('grid'), turnText=document.getElementById('turnText'), nextBtn=document.getElementById('nextBtn');

function buildGrid(){
  grid.innerHTML='';
  for(let i=0;i<9;i++){
    let c=document.createElement('div');
    c.className='cell'; c.id='c'+i;
    c.onclick=()=>play(i);
    grid.appendChild(c);
  }
}
buildGrid();

function pick(sym){
  mySymbol=sym; otherSymbol= sym==='X'?'O':'X';
  document.getElementById('mySymbol').textContent=mySymbol;
  document.getElementById('otherSymbol').textContent=otherSymbol;
  document.getElementById('chooseModal').style.display='none';
  currentTurn = (round%2===1)? mySymbol : otherSymbol;
  updateTurn();
}

function updateTurn(){
  if(gameOver) return;
  let who = (currentTurn===mySymbol) ? 'انت' : 'صاحبك';
  turnText.textContent=`الدور على: ${who} (${currentTurn}) - الجولة ${round}`;
  document.getElementById('round').textContent=`الجولة ${round} من ${maxRounds} | النتيجة ${myScore} - ${otherScore}`;
}

function play(i){
  if(board[i]!=='' || gameOver) return;
  board[i]=currentTurn;
  let cell=document.getElementById('c'+i);
  cell.textContent=currentTurn;
  cell.classList.add(currentTurn.toLowerCase());
  
  let win = checkWin();
  if(win){
    gameOver=true;
    win.combo.forEach(j=>document.getElementById('c'+j).classList.add('win'));
    if(win.winner===mySymbol){myScore++; turnText.textContent=`🏆 انت كسبت الجولة دي!`; }
    else{otherScore++; turnText.textContent=`🏆 صاحبك كسب الجولة دي!`; }
    document.getElementById('myScore').textContent=myScore;
    document.getElementById('otherScore').textContent=otherScore;
    if(round>=maxRounds) endMatch(); else nextBtn.style.display='block';
    return;
  }
  if(board.every(v=>v!=='')){
    gameOver=true; turnText.textContent='🤝 تعادل في الجولة دي!';
    if(round>=maxRounds) endMatch(); else nextBtn.style.display='block';
    return;
  }
  currentTurn = currentTurn==='X'?'O':'X';
  updateTurn();
}

function checkWin(){
  const combos=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for(let c of combos){ if(board[c[0]] && board[c[0]]===board[c[1]] && board[c[0]]===board[c[2]]) return {winner:board[c[0]], combo:c}; }
  return null;
}

function nextRound(){
  round++; board=["","","","","","","","",""]; gameOver=false; nextBtn.style.display='none';
  buildGrid();
  currentTurn = (round%2===1)? mySymbol : otherSymbol;
  updateTurn();
}

function endMatch(){
  nextBtn.style.display='none';
  setTimeout(()=>{
    let msg = myScore>otherScore? `🏆 انت البطل! ${myScore} - ${otherScore}` : otherScore>myScore? `🏆 صاحبك البطل! ${otherScore} - ${myScore}` : `🤝 تعادل كبير ${myScore} - ${otherScore}`;
    turnText.textContent=msg;
  },300);
}

function resetAll(){
  myScore=0; otherScore=0; round=1; board=["","","","","","","","",""]; gameOver=false;
  document.getElementById('myScore').textContent=0; document.getElementById('otherScore').textContent=0;
  nextBtn.style.display='none'; buildGrid();
  document.getElementById('chooseModal').style.display='flex';
  turnText.textContent='اختار X او O الاول';
}