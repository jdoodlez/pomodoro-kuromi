document.addEventListener('DOMContentLoaded', function() {

    setWorkSession();

    document.getElementById("start").addEventListener("click", startTimer);
    document.getElementById("stop").addEventListener("click", stopTimer);
    document.getElementById("reset").addEventListener("click", resetTimer); 
    document.getElementById("session-length").addEventListener("input", setWorkSession);

    updateDisplay();

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
});

let timer = null;
let seconds = 0;
let minutes = 0;
let hours = 0;
let isBreakSession = false; 

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
                    Swal.fire({
                        imageUrl: '../media/Kuromi-PNG.png', 
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
                        imageUrl: '../media/kuromi-study.png', 
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
    const sessionLength = parseInt(document.getElementById("session-length").value, 10);
    if (!isNaN(sessionLength) && sessionLength > 0) {
        minutes = sessionLength;
        seconds = 0;
        hours = 0;
        isBreakSession = false;
        updateDisplay();
    }
}

function setBreakSession() {
    const sessionLength = parseInt(document.getElementById("session-length").value, 10);
    
    if (!isNaN(sessionLength) && sessionLength > 0) {
        if (sessionLength <= 25) {
            seconds = 1;
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
