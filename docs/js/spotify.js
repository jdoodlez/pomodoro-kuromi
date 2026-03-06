/* ============================================================
   SPOTIFY MINIPLAYER — Embedded Spotify player widget
   ============================================================ */

const DEFAULT_PLAYLISTS = [
    { name: "Lo-fi Beats", uri: "37i9dQZF1DWWQRwui0ExPn" },
    { name: "Peaceful Piano", uri: "37i9dQZF1DX4sWSpwq3LiO" },
    { name: "Deep Focus", uri: "37i9dQZF1DWZeKCadgRdKQ" },
    { name: "Chill Vibes", uri: "37i9dQZF1DX889U0CL85jj" },
    { name: "Study Beats", uri: "2QHBB4ioxTVPvRfi3mJxAL" },
];

function initSpotifyPlayer() {
    const toggle = document.getElementById('spotify-toggle');
    const panel = document.getElementById('spotify-panel');
    const closeBtn = document.getElementById('spotify-close');
    const iframe = document.getElementById('spotify-iframe');
    const playlistSelect = document.getElementById('spotify-playlist');
    const customInput = document.getElementById('spotify-custom-input');
    const customBtn = document.getElementById('spotify-custom-btn');

    if (!toggle || !panel) return;

    // Load saved playlist
    const savedUri = localStorage.getItem('spotify_playlist_uri');
    const initialUri = savedUri || DEFAULT_PLAYLISTS[0].uri;

    // Populate dropdown
    if (playlistSelect) {
        DEFAULT_PLAYLISTS.forEach(pl => {
            const opt = document.createElement('option');
            opt.value = pl.uri;
            opt.textContent = pl.name;
            if (pl.uri === initialUri) opt.selected = true;
            playlistSelect.appendChild(opt);
        });

        // Add custom option
        const customOpt = document.createElement('option');
        customOpt.value = '__custom__';
        customOpt.innerHTML = '&#128279; Custom URL...'; // We can just use the emoji symbol or text. Wait, `<option>` can't hold generic HTML icons in some browsers, but I will strip the emoji. Let's just use "custom URL".
        customOpt.textContent = 'Custom URL...';
        playlistSelect.appendChild(customOpt);

        playlistSelect.addEventListener('change', () => {
            if (playlistSelect.value === '__custom__') {
                customInput.parentElement.style.display = 'flex';
                return;
            }
            customInput.parentElement.style.display = 'none';
            loadPlaylist(playlistSelect.value);
        });
    }

    // Custom playlist URL
    if (customBtn && customInput) {
        customBtn.addEventListener('click', () => {
            const url = customInput.value.trim();
            const uri = extractSpotifyUri(url);
            if (uri) {
                loadPlaylist(uri);
                customInput.parentElement.style.display = 'none';
            }
        });
        customInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') customBtn.click();
        });
    }

    function loadPlaylist(uri) {
        if (!iframe) return;
        const type = detectSpotifyType(uri);
        iframe.src = `https://open.spotify.com/embed/${type}/${uri}?utm_source=generator&theme=0`;
        localStorage.setItem('spotify_playlist_uri', uri);
    }

    function detectSpotifyType(uri) {
        // Default to playlist; if it looks like a track/album, adjust
        if (uri.includes(':track:') || uri.length === 22) return 'playlist';
        return 'playlist';
    }

    function extractSpotifyUri(url) {
        // Handle full URLs like https://open.spotify.com/playlist/37i9dQZF1DWWQRwui0ExPn
        const match = url.match(/open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/);
        if (match) return match[2];
        // Handle plain URI
        if (/^[a-zA-Z0-9]{15,}$/.test(url)) return url;
        return null;
    }

    // Toggle panel
    toggle.addEventListener('click', () => {
        const isOpen = panel.classList.toggle('open');
        toggle.classList.toggle('active', isOpen);

        // Lazy load iframe on first open
        if (isOpen && iframe && !iframe.src) {
            loadPlaylist(initialUri);
        }
    });

    // Close
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            panel.classList.remove('open');
            toggle.classList.remove('active');
        });
    }

    // Load on init (lazy — only set src when panel opens)
    // iframe loads on first toggle open
}

document.addEventListener('DOMContentLoaded', initSpotifyPlayer);
