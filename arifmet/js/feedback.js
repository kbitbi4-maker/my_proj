// Глобальные плееры и флаги контроля звуков/эффектов
let currentWinPlayer = null;
let currentAlienPlayer = null;
let currentFailPlayer = null;
let alienRepeatCount = 0; // Счётчик только для 3 повторов пришельцев

// Флаги-предохранители для блоков десятков (чтобы не заикалось при вводе цифр)
window.simFailSoundPlayed = false;
window.finFailSoundPlayed = false;
window.simWinSoundPlayed = false;
window.finWinSoundPlayed = false;

// 1. Полный сброс всех звуков (при переходе на новый пример или по истории)
function resetAllFeedbacks() {
    if (currentWinPlayer) { currentWinPlayer.pause(); currentWinPlayer = null; }
    if (currentAlienPlayer) { currentAlienPlayer.onended = null; currentAlienPlayer.pause(); currentAlienPlayer = null; }
    if (currentFailPlayer) { currentFailPlayer.pause(); currentFailPlayer = null; }
    
    alienRepeatCount = 0;
    window.simFailSoundPlayed = false;
    window.finFailSoundPlayed = false;
    window.simWinSoundPlayed = false;
    window.finWinSoundPlayed = false;
}

// 2. ЗВУК ДЛЯ ДЕСЯТКОВ: Воспроизведение обычного win.mp3 ровно 1 раз
function triggerTensWinSound() {
    if (currentWinPlayer) return; 
    try {
        currentWinPlayer = new Audio('audio/win.mp3');
        currentWinPlayer.volume = 0.25;
        currentWinPlayer.onended = function() { currentWinPlayer = null; };
        currentWinPlayer.play();
    } catch (e) { console.log("Audio blocked"); }
}

// 3. ЗВУК ДЛЯ УМНОЖЕНИЯ: Воспроизведение космического alien_win.mp3 ровно 3 раза
function triggerWinFeedback() {
    if (currentAlienPlayer) return; 
    try {
        currentAlienPlayer = new Audio('audio/alien_win.mp3');
        currentAlienPlayer.volume = 0.25;
        alienRepeatCount = 1; // Первый круг пошёл
        
        currentAlienPlayer.onended = function() {
            if (alienRepeatCount < 3) {
                alienRepeatCount++;
                if (currentAlienPlayer) currentAlienPlayer.play(); // 2-й и 3-й круги
            } else {
                if (currentAlienPlayer) {
                    currentAlienPlayer.onended = null;
                    currentAlienPlayer = null;
                }
            }
        };
        currentAlienPlayer.play();
    } catch (e) { console.log("Audio blocked"); }
}

// 4. ЗВУК ОШИБКИ: Воспроизведение fail.mp3 ровно 1 раз для всех режимов
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
