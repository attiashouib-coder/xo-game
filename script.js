// 1. قراءة رقم الغرفة من الرابط أو إنشائه تلقائياً
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

// إخفاء نافذة الاختيار (Modal) تلقائياً لتظهر الشبكة مباشرة
function hideModal() {
    const modal = document.querySelector('.modal') || document.querySelector('#modal') || document.querySelector('.overlay');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 2. كود اللعب عند عدم توفر قاعدة البيانات
function initLocalGame() {
    hideModal();
    cells.forEach((cell, index) => {
        cell.onclick = () => {
            if (currentBoard[index] === "") {
                currentBoard[index] = currentTurn;
                cell.textContent = currentTurn;
                currentTurn = currentTurn === 'X' ? 'O' : 'X';
                if (statusText) statusText.textContent = `دور اللاعب: ${currentTurn}`;
            }
        };
    });
}

// 3. الربط الأونلاين عبر Firebase
function initOnlineGame() {
    hideModal();
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

// أزرار الاختيار (X أو O) في النافذة القديمة إذا تم الضغط عليها
document.addEventListener('DOMContentLoaded', () => {
    const btnX = document.querySelector('#chooseX') || document.querySelectorAll('.modal button')[0];
    const btnO = document.querySelector('#chooseO') || document.querySelectorAll('.modal button')[1];

    if (btnX) btnX.onclick = () => { playerRole = 'X'; hideModal(); };
    if (btnO) btnO.onclick = () => { playerRole = 'O'; hideModal(); };
});

window.addEventListener('load', () => {
    setTimeout(() => {
        if (window.database) {
            initOnlineGame();
        } else {
            initLocalGame();
        }
    }, 300);
});