/* ============================================================
   SHARED JS — localStorage helpers, nav highlight, music, quotes
   ============================================================ */

/* ── Data helpers ── */
function loadSessions() {
    try {
        return JSON.parse(localStorage.getItem('pomodoro_sessions')) || [];
    } catch (e) { return []; }
}

function saveSessions(sessions) {
    localStorage.setItem('pomodoro_sessions', JSON.stringify(sessions));
}

function loadTasks() {
    try {
        return JSON.parse(localStorage.getItem('pomodoro_tasks')) || [];
    } catch (e) { return []; }
}

function saveTasks(tasks) {
    localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks));
}

function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0');
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function generateId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/* ============================================================
   KUROMI'S INSPIRATIONAL QUOTES
   ============================================================ */

const kuromiQuotes = [
    // Motivational – study / grind
    { text: "Even Kuromi takes it one step at a time. You got this!" },
    { text: "Don't stop until you're proud — Kuromi believes in you!" },
    { text: "Kuromi says: \"Being a little rebellious means not giving up!\"" },
    { text: "Your future self will thank you for studying today." },
    { text: "Small progress is still progress. Keep going!" },
    { text: "Kuromi didn't become iconic by quitting — and neither will you." },
    { text: "Stay focused. Stay fierce. Stay Kuromi." },
    { text: "One pomodoro at a time, you're building something amazing." },
    { text: "Kuromi's secret: work hard in silence, let success make the noise." },
    { text: "You're doing better than you think. Seriously." },

    // Encouraging – task completion
    { text: "Every task you finish is a win. Celebrate it!" },
    { text: "Kuromi is proud of you for showing up today." },
    { text: "You're not lazy — you're recharging between sessions!" },
    { text: "The hardest part is starting. You already did that!" },
    { text: "Discipline is doing it even when you don't feel like it." },

    // Cute / fun Kuromi vibes
    { text: "Kuromi says: \"Be sweet on the inside, fierce on the outside.\"" },
    { text: "Study now, TikTok later. Kuromi's rules!" },
    { text: "Plot twist: you actually finish everything today." },
    { text: "Kuromi-approved grind session in progress..." },
    { text: "Rest if you must, but don't you dare quit." },
    { text: "Success looks good on you. Just like Kuromi's hood." },
    { text: "You and Kuromi have something in common: you never give up." },
    { text: "Let them wonder how you get it all done." },
    { text: "Kuromi whispers: \"You are unstoppable.\"" },
    { text: "Deadlines fear you. Keep that energy." },

    // Break-time vibes
    { text: "Even rebels need rest. Take your break, champ." },
    { text: "Kuromi is taking a break too. Hydrate and chill!" },
    { text: "Good job! Now rest — your brain deserves it." },
    { text: "Break time! Stretch, breathe, and come back stronger." },
    { text: "Kuromi's break-time tip: do something that makes you smile." },
];

/** Get a random Kuromi quote */
function getRandomQuote() {
    return kuromiQuotes[Math.floor(Math.random() * kuromiQuotes.length)];
}

/** Get a category-specific quote */
function getQuoteByMood(mood) {
    const moods = {
        grind: kuromiQuotes.slice(0, 10),
        encourage: kuromiQuotes.slice(10, 15),
        fun: kuromiQuotes.slice(15, 26),
        rest: kuromiQuotes.slice(26),
    };
    const pool = moods[mood] || kuromiQuotes;
    return pool[Math.floor(Math.random() * pool.length)];
}

/** Render the quote banner on pages that have the container */
function initQuoteBanner() {
    const banner = document.getElementById('kuromi-quote-banner');
    if (!banner) return;

    function showQuote() {
        const q = getRandomQuote();
        const textEl = banner.querySelector('.quote-text');
        // Fade out
        banner.classList.remove('quote-visible');
        setTimeout(() => {
            if (textEl) textEl.textContent = q.text;
            // Fade in
            banner.classList.add('quote-visible');
        }, 400);
    }

    showQuote();
    // Rotate quote every 30 seconds
    setInterval(showQuote, 30000);

    // Click to get a new quote
    const refreshBtn = banner.querySelector('.quote-refresh');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', showQuote);
    }
}

/* ── Active nav highlight ── */
document.addEventListener('DOMContentLoaded', function () {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href').replace('./', '');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });

    /* ── Music toggle ── */
    const audio = document.getElementById('background-music');
    const musicToggle = document.getElementById('music-toggle');
    if (audio && musicToggle) {
        let isPlaying = false;
        musicToggle.addEventListener('click', function () {
            if (isPlaying) {
                audio.pause();
                musicToggle.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Music';
                isPlaying = false;
            } else {
                audio.play().catch(e => console.log('Audio play failed:', e));
                musicToggle.innerHTML = '<i class="fa-solid fa-volume-high"></i> Music';
                isPlaying = true;
            }
        });
    }

    /* ── Initialize quote banner ── */
    initQuoteBanner();

    /* ── Kuromi greeting based on time of day ── */
    initKuromiGreeting();

    /* ── Add falling Kuromi sparkles ── */
    createSparkles();
});

/** Dynamically create Kuromi sparkles / bats */
function createSparkles() {
    // Only show on desktop for performance
    if (window.innerWidth < 768) return;

    const sparkleEmojis = ['✨', '🦇', '💀', '💜', '🖤', '🎀'];
    const totalSparkles = 15;

    for (let i = 0; i < totalSparkles; i++) {
        const span = document.createElement('span');
        span.className = 'kuromi-falling-sparkle';
        span.textContent = sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)];
        
        // Randomize starting position & animation values
        const left = Math.random() * 100;
        const duration = Math.random() * 10 + 10; // 10s to 20s
        const delay = Math.random() * 15; // 0s to 15s delay
        const size = Math.random() * 12 + 12; // 12px to 24px

        span.style.left = `${left}vw`;
        span.style.fontSize = `${size}px`;
        span.style.animationDuration = `${duration}s`;
        span.style.animationDelay = `${delay}s`;
        
        document.body.appendChild(span);
    }
}

/** Show a time-of-day Kuromi greeting */
function initKuromiGreeting() {
    const el = document.getElementById('kuromi-greeting');
    if (!el) return;

    const hour = new Date().getHours();
    let greeting, emoji;

    if (hour < 6) {
        greeting = "Burning the midnight oil? Kuromi respects the hustle!";
        emoji = '<i class="fa-solid fa-moon"></i>';
    } else if (hour < 12) {
        greeting = "Good morning! Kuromi says: start strong, finish stronger!";
        emoji = '<i class="fa-solid fa-sun" style="color: #ffcc00;"></i>';
    } else if (hour < 17) {
        greeting = "Afternoon grind! Kuromi's cheering you on!";
        emoji = '<i class="fa-solid fa-bolt" style="color: #ffea00;"></i>';
    } else if (hour < 21) {
        greeting = "Evening session! Keep that focus going!";
        emoji = '<i class="fa-solid fa-city"></i>';
    } else {
        greeting = "Late-night warrior! Kuromi is proud of your dedication!";
        emoji = '<i class="fa-solid fa-moon"></i>';
    }

    el.innerHTML = `<span class="greeting-emoji">${emoji}</span> ${greeting}`;
}
