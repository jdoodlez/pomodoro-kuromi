/* ============================================================
   TIMER PAGE JS — Pomodoro countdown logic
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
    if (!loadTimerState()) {
        setWorkSession();
    }

    document.getElementById('start').addEventListener('click', startTimer);
    document.getElementById('stop').addEventListener('click', stopTimer);
    document.getElementById('reset').addEventListener('click', resetTimer);
    document.getElementById('session-length').addEventListener('input', setWorkSession);
    document.getElementById('session-length').addEventListener('input', validateSessionInput);

    updateDisplay();
    populateTaskDropdown();
    updateTimerStats();
    
    // Feature initializations
    initClock();
    initMinigame();
});

let timer = null;
let seconds = 0;
let minutes = 0;
let hours = 0;
let isBreakSession = false;

function loadTimerState() {
    try {
        const stateStr = localStorage.getItem('kuromi_timer_state');
        if (!stateStr) return false;
        
        const state = JSON.parse(stateStr);
        let rem = state.remainingSeconds;
        
        // Subtract elapsed time if the timer was supposed to be running
        if (state.isRunning) {
            const elapsed = Math.floor((Date.now() - state.timestamp) / 1000);
            rem -= elapsed;
        }
        
        if (rem < 0) rem = 0;

        hours = Math.floor(rem / 3600);
        minutes = Math.floor((rem % 3600) / 60);
        seconds = rem % 60;
        isBreakSession = state.isBreakSession;

        if (state.isRunning) {
            startTimer();
        }

        return true;
    } catch (e) {
        console.log("Failed to load timer state", e);
        return false;
    }
}

function saveTimerState() {
    const remainingSeconds = hours * 3600 + minutes * 60 + seconds;
    localStorage.setItem('kuromi_timer_state', JSON.stringify({
        remainingSeconds: remainingSeconds,
        isBreakSession: isBreakSession,
        isRunning: timer !== null,
        timestamp: Date.now()
    }));
}

function validateSessionInput() {
    const input = document.getElementById('session-length');
    let value = parseInt(input.value, 10);
    if (value > 90) input.value = 90;
    else if (value < 1 && input.value !== '') input.value = 1;
}

function updateSessionType() {
    const el = document.getElementById('session-type');
    el.textContent = isBreakSession ? 'Break Session' : 'Work Session';
}

function startTimer() {
    const card = document.querySelector('.timer-card');
    if (timer === null) {
        if (card) card.classList.add('running');
        timer = setInterval(() => {
            seconds--;

            if (seconds < 0) { seconds = 59; minutes--; }
            if (minutes < 0) { minutes = 59; hours--; }

            if (hours < 0) {
                clearInterval(timer);
                timer = null;
                if (card) card.classList.remove('running');
                saveTimerState();
                hours = 0; minutes = 0; seconds = 0;

                if (!isBreakSession) {
                    recordSession();
                    const q = getQuoteByMood('encourage');
                    Swal.fire({
                        imageUrl: './media/Kuromi-PNG.png',
                        imageHeight: 200, imageWidth: 200,
                        title: "Work session completed!",
                        html: `<p style="margin-bottom:8px">Scoll ka muna sa tiktok <i class="fa-solid fa-heart"></i></p>
                               <p style="font-style:italic; color:#c56cf0; font-size:14px">${q.text}</p>`,
                        confirmButtonText: 'Start Break',
                        confirmButtonColor: '#9b30ff',
                        allowOutsideClick: false
                    }).then(result => {
                        if (result.isConfirmed) { setBreakSession(); startTimer(); }
                    });
                } else {
                    const q = getQuoteByMood('grind');
                    Swal.fire({
                        imageUrl: './media/kuromi-study.png',
                        imageHeight: 200, imageWidth: 200,
                        title: "Break session over!",
                        html: `<p style="margin-bottom:8px">Grind ka na uli. <i class="fa-solid fa-heart" style="color:#cc88ff;"></i></p>
                               <p style="font-style:italic; color:#c56cf0; font-size:14px">${q.text}</p>`,
                        confirmButtonText: 'Start Work Session',
                        confirmButtonColor: '#9b30ff',
                        allowOutsideClick: false
                    }).then(result => {
                        if (result.isConfirmed) { setWorkSession(); startTimer(); }
                    });
                }
            }
            updateDisplay();
        }, 1000);
        saveTimerState(); // save immediately that it is running
    }
}

function stopTimer() {
    clearInterval(timer);
    timer = null;
    const card = document.querySelector('.timer-card');
    if (card) card.classList.remove('running');
    saveTimerState();
}

function resetTimer() {
    Swal.fire({
        title: 'Are you sure you want to stop the timer?',
        text: 'This will reset the current session.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, stop it!',
        cancelButtonText: 'No, keep going'
    }).then(result => {
        if (result.isConfirmed) {
            clearInterval(timer);
            timer = null;
            const card = document.querySelector('.timer-card');
            if (card) card.classList.remove('running');
            isBreakSession = false;
            setWorkSession();
            saveTimerState();
        }
    });
}

function setWorkSession() {
    const input = document.getElementById('session-length');
    let len = parseInt(input.value, 10);
    if (len > 90) { len = 90; input.value = 90; }
    if (len < 1) { len = 1; input.value = 1; }
    if (!isNaN(len) && len > 0) {
        hours = Math.floor(len / 60);
        minutes = len % 60;
        seconds = 0;
        isBreakSession = false;
        updateDisplay();
    }
}

function setBreakSession() {
    const len = parseInt(document.getElementById('session-length').value, 10);
    if (!isNaN(len) && len > 0) {
        minutes = len <= 25 ? 5 : 15;
        seconds = 0;
        hours = 0;
        isBreakSession = true;
        updateDisplay();
        startTimer();
    }
}

function updateDisplay() {
    const display = document.getElementById('timer-display');
    display.textContent =
        (hours < 10 ? '0' + hours : hours) + ':' +
        (minutes < 10 ? '0' + minutes : minutes) + ':' +
        (seconds < 10 ? '0' + seconds : seconds);
    updateSessionType();
    saveTimerState();
}

function recordSession() {
    const duration = parseInt(document.getElementById('session-length').value, 10) || 25;
    
    // Get selected task
    const taskSelect = document.getElementById('session-task');
    const taskId = taskSelect ? taskSelect.value : null;
    let taskName = null;
    
    if (taskSelect && taskSelect.selectedIndex > 0) {
        taskName = taskSelect.options[taskSelect.selectedIndex].text;
    }
    
    const sessions = loadSessions();
    sessions.push({ 
        date: todayStr(), 
        duration: duration, 
        timestamp: Date.now(),
        taskId: taskId,
        taskName: taskName
    });
    saveSessions(sessions);
    
    // Update daily mini-stats if available
    updateTimerStats();
}

function updateTimerStats() {
    const sessions = loadSessions();
    const today = todayStr();
    const todaysSessions = sessions.filter(s => s.date === today);
    const count = todaysSessions.length;
    
    let statsEl = document.getElementById('timer-daily-stats');
    if (!statsEl) {
        // Create it if it doesn't exist
        const card = document.querySelector('.timer-card');
        if (card) {
            statsEl = document.createElement('div');
            statsEl.id = 'timer-daily-stats';
            statsEl.style.marginTop = '20px';
            statsEl.style.fontSize = '0.9rem';
            statsEl.style.color = 'var(--text-muted)';
            card.appendChild(statsEl);
        }
    }
    
    if (statsEl) {
        const totalMin = todaysSessions.reduce((sum, s) => sum + (s.duration || 25), 0);
        statsEl.innerHTML = `<span style="color:var(--primary)">Today's Progress:</span> ${count} session${count !== 1 ? 's' : ''} (${Math.floor(totalMin/60)}h ${totalMin%60}m)`;
    }
}

function populateTaskDropdown() {
    const select = document.getElementById('session-task');
    if (!select) return;
    
    const tasks = loadTasks().filter(t => !t.completed); // only active tasks
    
    // Keep first option "No specific task"
    select.innerHTML = '<option value="">No specific task</option>';
    
    tasks.forEach(t => {
        const opt = document.createElement('option');
        opt.value = t.id;
        opt.textContent = t.name;
        select.appendChild(opt);
    });
}

/* ============================================================
   CLOCK & MINIGAME (Tic-Tac-Toe)
   ============================================================ */

function initClock() {
    const clockEl = document.getElementById('live-clock');
    if (!clockEl) return;
    
    function updateClock() {
        const now = new Date();
        clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    
    updateClock();
    setInterval(updateClock, 1000);
}

function initMinigame() {
    const toggleBtn = document.getElementById('toggle-minigame');
    const container = document.getElementById('minigame-container');
    const board = document.getElementById('ttt-board');
    const status = document.getElementById('ttt-status');
    const resetBtn = document.getElementById('reset-ttt');

    if (!toggleBtn || !container || !board) return;

    // Toggle visibility
    toggleBtn.addEventListener('click', () => {
        if (container.style.display === 'none') {
            container.style.display = 'block';
            toggleBtn.innerHTML = '<i class="fa-solid fa-gamepad"></i> Close Minigame';
            toggleBtn.style.background = 'var(--primary)';
            toggleBtn.style.color = '#fff';
        } else {
            container.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fa-solid fa-gamepad"></i> Minigame';
            toggleBtn.style.background = 'var(--bg-card)';
            toggleBtn.style.color = 'var(--primary)';
        }
    });

    let currentPlayer = 'X';
    let cells = Array(9).fill('');
    let gameActive = true;

    function renderBoard() {
        board.innerHTML = '';
        cells.forEach((cell, index) => {
            const div = document.createElement('div');
            div.style.background = 'rgba(255, 255, 255, 0.1)';
            div.style.border = '1px solid rgba(200, 200, 255, 0.3)';
            div.style.borderRadius = '8px';
            div.style.display = 'flex';
            div.style.alignItems = 'center';
            div.style.justifyContent = 'center';
            div.style.fontSize = '2rem';
            div.style.cursor = 'pointer';
            div.style.color = cell === 'X' ? 'var(--primary)' : '#fff';
            div.style.transition = 'background 0.2s';
            
            div.textContent = cell === 'O' ? 'X' : (cell === 'X' ? 'O' : ''); // Just using normal text 'X' and 'O' now since emojis were replacing the font 

            // Actually, let's use the icons directly inside the html instead:
            div.innerHTML = cell === 'O' ? '<i class="fa-solid fa-skull" style="color:#aaa;"></i>' : (cell === 'X' ? '<i class="fa-solid fa-heart" style="color:var(--primary);"></i>' : '');

            div.addEventListener('click', () => handleCellClick(index));
            board.appendChild(div);
        });
    }

    function checkWin() {
        const winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        for (let pattern of winPatterns) {
            const [a, b, c] = pattern;
            if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
                gameActive = false;
                const winnerText = cells[a] === 'X' ? '<i class="fa-solid fa-heart" style="color:var(--primary);"></i> Kuromi Wins!' : '<i class="fa-solid fa-skull" style="color:#aaa;"></i> Baku Wins!';
                status.innerHTML = winnerText;
                setTimeout(() => Swal.fire({
                    title: winnerText,
                    icon: cells[a] === 'X' ? 'success' : 'error',
                    confirmButtonText: 'Play Again',
                    confirmButtonColor: '#9b30ff'
                }).then(() => resetBtn.click()), 300);
                return true;
            }
        }
        
        if (!cells.includes('')) {
            gameActive = false;
            status.textContent = "It's a Draw!";
            setTimeout(() => Swal.fire({
                title: "It's a Draw!",
                text: "No one completed a row.",
                icon: 'info',
                confirmButtonText: 'Try Again',
                confirmButtonColor: '#9b30ff'
            }).then(() => resetBtn.click()), 300);
            return true;
        }
        return false;
    }

    function computerMove() {
        if (!gameActive) return;
        const emptyIndices = cells.map((v, i) => v === '' ? i : null).filter(v => v !== null);
        if (emptyIndices.length > 0) {
            const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            cells[randomIndex] = 'O';
            renderBoard();
            if (!checkWin()) {
                currentPlayer = 'X';
                status.innerHTML = 'Your turn <i class="fa-solid fa-heart" style="color:#cc88ff;"></i>';
            }
        }
    }

    function handleCellClick(index) {
        if (!gameActive || cells[index] !== '' || currentPlayer !== 'X') return;
        
        cells[index] = 'X';
        renderBoard();
        
        if (!checkWin()) {
            currentPlayer = 'O';
            status.innerHTML = "Computer's turn <i class=\"fa-solid fa-skull\"></i>...";
            setTimeout(computerMove, 500);
        }
    }

    resetBtn.addEventListener('click', () => {
        cells = Array(9).fill('');
        currentPlayer = 'X';
        gameActive = true;
        status.innerHTML = 'Your turn <i class="fa-solid fa-heart" style="color:#cc88ff;"></i>';
        renderBoard();
    });

    renderBoard();
}
