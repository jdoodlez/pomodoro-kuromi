/* ============================================================
   CALENDAR / PROGRESS PAGE JS
   ============================================================ */

let calendarYear = new Date().getFullYear();

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('cal-prev').addEventListener('click', () => { calendarYear--; renderCalendar(); });
    document.getElementById('cal-next').addEventListener('click', () => { calendarYear++; renderCalendar(); });
    renderCalendar();
});

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    const monthsContainer = document.getElementById('calendar-months');
    const yearLabel = document.getElementById('cal-year');
    grid.innerHTML = '';
    monthsContainer.innerHTML = '';
    yearLabel.textContent = calendarYear;

    const sessionHistory = loadSessions();

    // Build count map
    const countMap = {};
    sessionHistory.forEach(s => {
        if (s.date && s.date.startsWith(calendarYear + '')) {
            countMap[s.date] = (countMap[s.date] || 0) + 1;
        }
    });

    const jan1 = new Date(calendarYear, 0, 1);
    const dec31 = new Date(calendarYear, 11, 31);

    // Monday of the week containing Jan 1
    const startDay = new Date(jan1);
    const dow = startDay.getDay();
    startDay.setDate(startDay.getDate() + (dow === 0 ? -6 : 1 - dow));

    // Month labels
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    monthNames.forEach(m => {
        const span = document.createElement('span');
        span.textContent = m;
        monthsContainer.appendChild(span);
    });

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

        if (current.getFullYear() !== calendarYear) cell.style.opacity = '0.2';

        const tooltip = document.createElement('span');
        tooltip.className = 'tooltip';
        tooltip.textContent = count > 0
            ? `${count} session${count > 1 ? 's' : ''} on ${dateStr}`
            : `No sessions on ${dateStr}`;
        cell.appendChild(tooltip);
        grid.appendChild(cell);

        current.setDate(current.getDate() + 1);
        if (current > dec31 && current.getDay() === 1) break;
    }
}
