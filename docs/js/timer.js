document.addEventListener('DOMContentLoaded', function() {

    // ── Initialise data stores ──
    loadData();

    setWorkSession();

    document.getElementById("start").addEventListener("click", startTimer);
    document.getElementById("stop").addEventListener("click", stopTimer);
    document.getElementById("reset").addEventListener("click", resetTimer); 
    document.getElementById("session-length").addEventListener("input", setWorkSession);
    document.getElementById("session-length").addEventListener("input", validateSessionInput);

    updateDisplay();

    // ── Music toggle ──
    const audio = document.getElementById("background-music");
    const musicToggle = document.getElementById("music-toggle");
    let isPlaying = false;
    
    musicToggle.addEventListener("click", function() {
        if (isPlaying) {
            audio.pause();
            musicToggle.textContent = "🔇"; 
            isPlaying = false;
        } else {
            audio.play().catch(e => console.log("Audio play failed:", e));
            musicToggle.textContent = "🔊"; 
            isPlaying = true;
        }
    });

    // ── Tabs navigation ──
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + '-panel').classList.add('active');

            if (btn.dataset.tab === 'calendar') renderCalendar();
            if (btn.dataset.tab === 'tracker') renderTracker();
        });
    });

    // ── Task CRUD listeners ──
    document.getElementById('add-task-btn').addEventListener('click', addTask);
    document.getElementById('task-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') addTask();
    });
    document.getElementById('clear-completed-btn').addEventListener('click', clearCompletedTasks);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // ── Calendar navigation ──
    document.getElementById('cal-prev').addEventListener('click', () => { calendarYear--; renderCalendar(); });
    document.getElementById('cal-next').addEventListener('click', () => { calendarYear++; renderCalendar(); });

    // ── Initial renders ──
    renderTasks();
    renderCalendar();
    renderTracker();
});

/* ==============================================================
   TIMER (original, preserved)
   ============================================================== */

let timer = null;
let seconds = 0;
let minutes = 0;
let hours = 0;
let isBreakSession = false; 

function validateSessionInput() {
    const sessionLengthInput = document.getElementById("session-length");
    let value = parseInt(sessionLengthInput.value, 10);
    
    if (value > 90) {
        sessionLengthInput.value = 90;
    } else if (value < 1 && sessionLengthInput.value !== "") {
        sessionLengthInput.value = 1;
    }
}

function updateSessionType() {
    const sessionType = document.getElementById("session-type");
    
    if (isBreakSession) {
        sessionType.textContent = "Break Session";
    } else {
        sessionType.textContent = "Work Session";
    }
}

function startTimer() {
    if (timer === null) {
        timer = setInterval(() => {
            seconds--;
            
            if (seconds < 0) {
                seconds = 59;
                minutes--;
            }
            
            if (minutes < 0) {
                minutes = 59;
                hours--;
            }
        
            if (hours < 0) {
                clearInterval(timer);
                timer = null;
                hours = 0;
                minutes = 0;
                seconds = 0;
                
                if (!isBreakSession) {
                    // ── Record completed work session ──
                    recordSession();

                    Swal.fire({
                        imageUrl: './media/Kuromi-PNG.png', 
                        imageHeight: 200,
                        imageWidth: 200,
                        title: "Work session completed! Scoll ka muna sa tiktok",
                        confirmButtonText: 'Start Break',
                        allowOutsideClick: false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            setBreakSession();  
                            startTimer();     
                        }
                    });
                } else {
                    Swal.fire({
                        imageUrl: './media/kuromi-study.png', 
                        imageHeight: 200,
                        imageWidth: 200,
                        title: "Break session over! Grind ka na uli.",
                        confirmButtonText: 'Start Work Session',
                        allowOutsideClick: false
                    }).then((result) => {
                        if (result.isConfirmed) {
                            setWorkSession();   
                            startTimer();       
                        }
                    });
                }
            }
            
            updateDisplay();
        }, 1000);
    }
}

function stopTimer() {
    clearInterval(timer);
    timer = null;
}

function resetTimer() {
     Swal.fire({
        title: 'Are you sure you want to stop the timer?',
        text: "This will reset the current session.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, stop it!',
        cancelButtonText: 'No, keep going'
    }).then((result) => {
        if (result.isConfirmed) {
            clearInterval(timer);
            timer = null;
            isBreakSession = false;
            setWorkSession();
        }
    });

}

function setWorkSession() {
    const sessionLengthInput = document.getElementById("session-length");
    let sessionLength = parseInt(sessionLengthInput.value, 10);
    
    if (sessionLength > 90) {
        sessionLength = 90;
        sessionLengthInput.value = 90;
    }
    
    if (sessionLength < 1) {
        sessionLength = 1;
        sessionLengthInput.value = 1;
    }
    
    if (!isNaN(sessionLength) && sessionLength > 0) {
        hours = Math.floor(sessionLength / 60);
        minutes = sessionLength % 60;
        seconds = 0;
        isBreakSession = false;
        updateDisplay();
    }
}

function setBreakSession() {
    const sessionLength = parseInt(document.getElementById("session-length").value, 10);
    
    if (!isNaN(sessionLength) && sessionLength > 0) {
        if (sessionLength <= 25) {
            minutes = 5;
        } else {
            minutes = 15;
        }
        
        seconds = 0;
        hours = 0;
        isBreakSession = true;
        updateDisplay();
        startTimer();
    }
}

function updateDisplay() {
    const display = document.getElementById("timer-display");
    display.textContent = 
        (hours < 10 ? "0" + hours : hours) + ":" + 
        (minutes < 10 ? "0" + minutes : minutes) + ":" + 
        (seconds < 10 ? "0" + seconds : seconds);
    updateSessionType();
}

/* ==============================================================
   DATA PERSISTENCE (localStorage)
   ============================================================== */

let tasks = [];
let sessionHistory = []; // [{date:"YYYY-MM-DD", duration:25, timestamp:...}, ...]
let currentFilter = 'all';
let calendarYear = new Date().getFullYear();

function loadData() {
    try {
        tasks = JSON.parse(localStorage.getItem('pomodoro_tasks')) || [];
        sessionHistory = JSON.parse(localStorage.getItem('pomodoro_sessions')) || [];
    } catch (e) {
        tasks = [];
        sessionHistory = [];
    }
}

function saveTasks() {
    localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
}

function saveSessions() {
    localStorage.setItem('pomodoro_sessions', JSON.stringify(sessionHistory));
}

/* ==============================================================
   SESSION RECORDING
   ============================================================== */

function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function recordSession() {
    const duration = parseInt(document.getElementById('session-length').value, 10) || 25;
    sessionHistory.push({
        date: todayStr(),
        duration: duration,
        timestamp: Date.now()
    });
    saveSessions();
    renderTracker();
    // Refresh calendar if visible
    if (document.getElementById('calendar-panel').classList.contains('active')) {
        renderCalendar();
    }
}

/* ==============================================================
   TASK CRUD
   ============================================================== */

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

function addTask() {
    const input = document.getElementById('task-input');
    const name = input.value.trim();
    if (!name) return;

    tasks.push({
        id: generateId(),
        name: name,
        completed: false,
        createdAt: Date.now()
    });

    input.value = '';
    saveTasks();
    renderTasks();
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function startEditTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    // Re-render with edit mode
    renderTasks(id);
}

function saveEditTask(id, newName) {
    const task = tasks.find(t => t.id === id);
    if (task && newName.trim()) {
        task.name = newName.trim();
        saveTasks();
    }
    renderTasks();
}

function clearCompletedTasks() {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) return;
    
    Swal.fire({
        title: 'Clear completed tasks?',
        text: `This will remove ${completedCount} completed task${completedCount > 1 ? 's' : ''}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, clear them!',
        cancelButtonText: 'Cancel'
    }).then(result => {
        if (result.isConfirmed) {
            tasks = tasks.filter(t => !t.completed);
            saveTasks();
            renderTasks();
        }
    });
}

function renderTasks(editingId) {
    const list = document.getElementById('task-list');
    list.innerHTML = '';

    let filtered = tasks;
    if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
    else if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);

    if (filtered.length === 0) {
        list.innerHTML = '<li class="task-empty">No tasks yet. Add one above!</li>';
    } else {
        filtered.forEach(task => {
            const li = document.createElement('li');
            li.className = 'task-item' + (task.completed ? ' completed' : '');

            if (editingId === task.id) {
                li.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <input type="text" class="task-edit-input" value="${escapeHtml(task.name)}" maxlength="100">
                    <div class="task-actions">
                        <button class="task-action-btn save-btn" title="Save">💾</button>
                        <button class="task-action-btn cancel-btn" title="Cancel">✖</button>
                    </div>
                `;
                const editInput = li.querySelector('.task-edit-input');
                const saveBtn = li.querySelector('.save-btn');
                const cancelBtn = li.querySelector('.cancel-btn');
                const checkbox = li.querySelector('.task-checkbox');

                saveBtn.addEventListener('click', () => saveEditTask(task.id, editInput.value));
                cancelBtn.addEventListener('click', () => renderTasks());
                editInput.addEventListener('keydown', e => {
                    if (e.key === 'Enter') saveEditTask(task.id, editInput.value);
                    if (e.key === 'Escape') renderTasks();
                });
                checkbox.addEventListener('change', () => toggleTask(task.id));
                setTimeout(() => { editInput.focus(); editInput.select(); }, 0);
            } else {
                li.innerHTML = `
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-name">${escapeHtml(task.name)}</span>
                    <div class="task-actions">
                        <button class="task-action-btn edit-btn" title="Edit">✏️</button>
                        <button class="task-action-btn delete" title="Delete">🗑️</button>
                    </div>
                `;
                li.querySelector('.task-checkbox').addEventListener('change', () => toggleTask(task.id));
                li.querySelector('.edit-btn').addEventListener('click', () => startEditTask(task.id));
                li.querySelector('.delete').addEventListener('click', () => deleteTask(task.id));
            }

            list.appendChild(li);
        });
    }

    // Update count
    const activeCount = tasks.filter(t => !t.completed).length;
    const totalCount = tasks.length;
    document.getElementById('task-count').textContent =
        `${activeCount} active / ${totalCount} total`;
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ==============================================================
   GITHUB-STYLE PROGRESS CALENDAR
   ============================================================== */

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthsContainer = document.getElementById('calendar-months');
    const yearLabel = document.getElementById('cal-year');
    grid.innerHTML = '';
    monthsContainer.innerHTML = '';
    yearLabel.textContent = calendarYear;

    // Build a map of date -> session count for the selected year
    const countMap = {};
    sessionHistory.forEach(s => {
        if (s.date && s.date.startsWith(calendarYear + '')) {
            countMap[s.date] = (countMap[s.date] || 0) + 1;
        }
    });

    // First day of the year
    const jan1 = new Date(calendarYear, 0, 1);
    const dec31 = new Date(calendarYear, 11, 31);

    // Adjust start to the Monday of the week containing Jan 1
    const startDay = new Date(jan1);
    const dayOfWeek = startDay.getDay(); // 0=Sun
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDay.setDate(startDay.getDate() + mondayOffset);

    // Month labels
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    monthNames.forEach(m => {
        const span = document.createElement('span');
        span.textContent = m;
        monthsContainer.appendChild(span);
    });

    // Generate cells
    const current = new Date(startDay);
    while (current <= dec31 || current.getDay() !== 1) {
        const dateStr = current.getFullYear() + '-' +
            String(current.getMonth() + 1).padStart(2, '0') + '-' +
            String(current.getDate()).padStart(2, '0');

        const cell = document.createElement('div');
        cell.className = 'calendar-cell';

        const count = countMap[dateStr] || 0;
        if (count >= 4) cell.setAttribute('data-count', '4');
        else if (count === 3) cell.setAttribute('data-count', '3');
        else if (count === 2) cell.setAttribute('data-count', '2');
        else if (count === 1) cell.setAttribute('data-count', '1');

        // Dim cells outside the year
        if (current.getFullYear() !== calendarYear) {
            cell.style.opacity = '0.25';
        }

        // Tooltip
        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = count > 0
            ? `${count} session${count > 1 ? 's' : ''} on ${dateStr}`
            : `No sessions on ${dateStr}`;
        cell.appendChild(tooltip);

        grid.appendChild(cell);

        current.setDate(current.getDate() + 1);
        // Stop after completing the week that contains Dec 31 (or first few days of next year)
        if (current > dec31 && current.getDay() === 1) break;
    }
}

/* ==============================================================
   TRACKER / STATS
   ============================================================== */

function renderTracker() {
    const today = todayStr();

    // Today's sessions
    const todaySessions = sessionHistory.filter(s => s.date === today).length;
    document.getElementById('stat-today').textContent = todaySessions;

    // Total sessions
    document.getElementById('stat-total').textContent = sessionHistory.length;

    // Total focus time
    const totalMinutes = sessionHistory.reduce((sum, s) => sum + (s.duration || 25), 0);
    const focusHours = Math.floor(totalMinutes / 60);
    const focusMins = totalMinutes % 60;
    document.getElementById('stat-focus-time').textContent = `${focusHours}h ${focusMins}m`;

    // Unique active days for average
    const uniqueDays = [...new Set(sessionHistory.map(s => s.date))];
    const avg = uniqueDays.length > 0 ? (sessionHistory.length / uniqueDays.length).toFixed(1) : '0';
    document.getElementById('stat-avg').textContent = avg;

    // Streaks
    const { current: currentStreak, best: bestStreak } = calculateStreaks();
    document.getElementById('stat-streak').textContent = currentStreak;
    document.getElementById('stat-best-streak').textContent = bestStreak;

    // Recent session log
    renderSessionLog();
}

function calculateStreaks() {
    if (sessionHistory.length === 0) return { current: 0, best: 0 };

    const uniqueDays = [...new Set(sessionHistory.map(s => s.date))].sort();
    if (uniqueDays.length === 0) return { current: 0, best: 0 };

    let best = 1;
    let streak = 1;

    for (let i = 1; i < uniqueDays.length; i++) {
        const prev = new Date(uniqueDays[i - 1]);
        const curr = new Date(uniqueDays[i]);
        const diff = (curr - prev) / (1000 * 60 * 60 * 24);

        if (diff === 1) {
            streak++;
            if (streak > best) best = streak;
        } else {
            streak = 1;
        }
    }

    // Check if current streak is still active (last day is today or yesterday)
    const lastDay = new Date(uniqueDays[uniqueDays.length - 1]);
    const todayDate = new Date(todayStr());
    const daysSinceLast = (todayDate - lastDay) / (1000 * 60 * 60 * 24);

    const currentStreak = daysSinceLast <= 1 ? streak : 0;

    return { current: currentStreak, best: best };
}

function renderSessionLog() {
    const log = document.getElementById('session-log');
    log.innerHTML = '';

    if (sessionHistory.length === 0) {
        log.innerHTML = '<li class="session-log-empty">No sessions recorded yet. Complete a pomodoro to start tracking!</li>';
        return;
    }

    // Show last 20 sessions, newest first
    const recent = [...sessionHistory].reverse().slice(0, 20);

    recent.forEach(s => {
        const li = document.createElement('li');
        li.className = 'session-log-item';

        const dateObj = new Date(s.timestamp);
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        li.innerHTML = `
            <span class="log-date">${s.date} at ${timeStr}</span>
            <span class="log-duration">${s.duration} min</span>
        `;
        log.appendChild(li);
    });
}
