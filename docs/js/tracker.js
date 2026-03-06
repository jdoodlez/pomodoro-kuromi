/* ============================================================
   TRACKER PAGE JS — Stats & recent session log
   ============================================================ */

document.addEventListener('DOMContentLoaded', function () {
    renderTracker();
});

function renderTracker() {
    const sessionHistory = loadSessions();
    const today = todayStr();

    // Today
    document.getElementById('stat-today').textContent =
        sessionHistory.filter(s => s.date === today).length;

    // Total
    document.getElementById('stat-total').textContent = sessionHistory.length;

    // Focus time
    const totalMin = sessionHistory.reduce((sum, s) => sum + (s.duration || 25), 0);
    document.getElementById('stat-focus-time').textContent =
        `${Math.floor(totalMin / 60)}h ${totalMin % 60}m`;

    // Average
    const uniqueDays = [...new Set(sessionHistory.map(s => s.date))];
    document.getElementById('stat-avg').textContent =
        uniqueDays.length > 0 ? (sessionHistory.length / uniqueDays.length).toFixed(1) : '0';

    // Streaks
    const { current: cur, best } = calculateStreaks(sessionHistory);
    document.getElementById('stat-streak').textContent = cur;
    document.getElementById('stat-best-streak').textContent = best;

    renderSessionLog(sessionHistory);
}

function calculateStreaks(sessions) {
    if (sessions.length === 0) return { current: 0, best: 0 };
    const days = [...new Set(sessions.map(s => s.date))].sort();
    if (days.length === 0) return { current: 0, best: 0 };

    let best = 1, streak = 1;
    for (let i = 1; i < days.length; i++) {
        const diff = (new Date(days[i]) - new Date(days[i - 1])) / 864e5;
        if (diff === 1) { streak++; if (streak > best) best = streak; }
        else streak = 1;
    }

    const last = new Date(days[days.length - 1]);
    const now = new Date(todayStr());
    const daysSince = (now - last) / 864e5;
    return { current: daysSince <= 1 ? streak : 0, best };
}

function renderSessionLog(sessions) {
    const log = document.getElementById('session-log');
    log.innerHTML = '';

    if (sessions.length === 0) {
        log.innerHTML = `<li class="session-log-empty"><span class="empty-icon"><i class="fa-solid fa-chart-simple"></i></span>No sessions recorded yet. Complete a pomodoro to start tracking!</li>`;
        return;
    }

    [...sessions].reverse().slice(0, 25).forEach(s => {
        const li = document.createElement('li');
        li.className = 'session-log-item';
        const time = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let taskLabel = '';
        if (s.taskName) {
            taskLabel = `<span class="log-task" style="display:block; font-size: 0.85em; color: var(--text-muted); margin-top: 4px;"><i class="fa-solid fa-bullseye"></i> ${escapeHtml(s.taskName)}</span>`;
        }

        li.innerHTML = `
            <div style="flex-grow: 1;">
                <span class="log-date">${s.date} at ${time}</span>
                ${taskLabel}
            </div>
            <span class="log-duration">${s.duration} min</span>
        `;
        log.appendChild(li);
    });
}
