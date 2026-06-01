// Глобальные плееры и флаги контроля звуков/эффектов
let currentWinPlayer = null;
let currentFailPlayer = null;
let winRepeatCount = 0;

// Флаги-предохранители для блоков (чтобы не заикалось при вводе)
window.simFailSoundPlayed = false;
window.finFailSoundPlayed = false;
window.simWinSoundPlayed = false;
window.finWinSoundPlayed = false;

// 1. Функция полного сброса всех эффектов (вызывается при генерации нового примера)
function resetAllFeedbacks() {
    if (currentWinPlayer) {
        currentWinPlayer.onended = null;
        currentWinPlayer.pause();
    }
    if (currentFailPlayer) currentFailPlayer.pause();
    
    currentWinPlayer = null;
    currentFailPlayer = null;
    winRepeatCount = 0;
    
    window.simFailSoundPlayed = false;
    window.finFailSoundPlayed = false;
    window.simWinSoundPlayed = false;
    window.finWinSoundPlayed = false;
}

// 2. Функция триггера УСПЕХА (Воспроизведение win.mp3 ровно 3 раза)
function triggerWinFeedback() {
    if (currentWinPlayer) return; // Если уже поёт — не наслаиваем
    try {
        currentWinPlayer = new Audio('audio/win.mp3');
        currentWinPlayer.volume = 0.25;
        winRepeatCount = 1;
        
        currentWinPlayer.onended = function() {
            if (winRepeatCount < 3) {
                winRepeatCount++;
                if (currentWinPlayer) currentWinPlayer.play();
            } else {
                if (currentWinPlayer) {
                    currentWinPlayer.onended = null;
                    currentWinPlayer = null;
                }
            }
        };
        currentWinPlayer.play();
    } catch (e) { console.log("Audio blocked"); }
}

// 3. Функция триггера ОШИБКИ (Воспроизведение fail.mp3 ровно 1 раз)
function triggerFailFeedback() {
    try {
        if (currentFailPlayer) {
            currentFailPlayer.currentTime = 0;
            currentFailPlayer.play();
        } else {
            currentFailPlayer = new Audio('audio/fail.mp3');
            currentFailPlayer.volume = 0.25;
            currentFailPlayer.play();
        }
    } catch (e) { console.log("Audio blocked"); }
}

