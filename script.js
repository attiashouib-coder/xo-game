// 1. تحديد رقم الغرفة من الرابط (أو إنشائها تلقائياً)// 1. قراءة رقم الغرفة من الرابط أو إنشاؤه تلقائياً
const urlParams = new URLSearchParams(window.location.search);
let roomId = urlParams.get('room');

if (!roomId) {
    roomId = Math.floor(1000 + Math.random() * 9000);
    window.history.pushState({}, '', `?room=${roomId}`);
}

let playerRole = null;
let currentBoard = ["", "", "", "", "", "", "", "", ""];
let currentTurn = "X";

const cells = document.querySelectorAll('.cell');
const statusText = document.querySelector('#status') || document.querySelector('h2');

// 2. كود اللعب المحلي (لو شغالين على نفس الجهاز أو بدون نت)
function initLocalGame() {
    cells.forEach((cell, index) => {
        cell.addEventListener('click', () => {
            if (currentBoard[index] === "") {
                currentBoard[index] = currentTurn;
                cell.textContent = currentTurn;
                
                // تحديث البيانات في Firebase لو متصل
                if (window.database && window.dbRef && window.dbSet) {
                    const roomRef = window.dbRef(window.database, 'rooms/' + roomId);
                    const nextTurn = currentTurn === 'X' ? 'O' : 'X';
                    window.dbSet(roomRef, {
                        board: currentBoard,
                        turn: nextTurn
                    });
                } else {
                    // التبديل محلياً لو Firebase مش متصل
                    currentTurn = currentTurn === 'X' ? 'O' : 'X';
                    if (statusText) statusText.textContent = `دور اللاعب: ${currentTurn}`;
                }
            }
        });
    });
}

// 3. الربط أونلاين مع Firebase
function initOnlineGame() {
    if (!window.database || !window.dbRef || !window.dbOnValue) {
        initLocalGame();
        return;
    }

    const roomRef = window.dbRef(window.database, 'rooms/' + roomId);

    window.dbOnValue(roomRef, (snapshot) => {
        const data = snapshot.val();

        if (!data) {
            playerRole = 'X';
            window.dbSet(roomRef, {
                board: ["", "", "", "", "", "", "", "", ""],
                turn: "X"
            });
        } else {
            if (!playerRole) playerRole = 'O';
            currentBoard = data.board || ["", "", "", "", "", "", "", "", ""];
            currentTurn = data.turn || "X";
            updateUI();
        }
    });

    cells.forEach((cell, index) => {
        cell.onclick = () => {
            // لو اللعب أونلاين مع شخص ثاني
            if (playerRole && currentTurn !== playerRole) {
                alert("انتظر دورك!");
                return;
            }

            if (currentBoard[index] !== "") return;

            currentBoard[index] = playerRole || currentTurn;
            const nextTurn = (playerRole || currentTurn) === 'X' ? 'O' : 'X';

            window.dbSet(roomRef, {
                board: currentBoard,
                turn: nextTurn
            });
        };
    });
}

function updateUI() {
    cells.forEach((cell, index) => {
        cell.textContent = currentBoard[index];
    });

    if (statusText) {
        if (playerRole) {
            if (currentTurn === playerRole) {
                statusText.textContent = `دورك الآن (${playerRole})`;
            } else {
                statusText.textContent = `في انتظار حركة المنافس (${currentTurn})...`;
            }
        } else {
            statusText.textContent = `دور اللاعب: ${currentTurn}`;
        }
    }
}

// تشغيل اللعبة فوراً
window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.database) {
            initOnlineGame();
        } else {
            initLocalGame();
        }
    }, 500);
});