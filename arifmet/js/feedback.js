let currentWinPlayer = null, currentAlienPlayer = null, currentFailPlayer = null, alienRepeatCount = 0;
window.simFailSoundPlayed = false;
window.finFailSoundPlayed = false;
window.simWinSoundPlayed = false;
window.finWinSoundPlayed = false;
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
function triggerTensWinSound() { // Обычный победный звук упрощения (win.mp3)
    if (currentWinPlayer) return; 
    try {
        currentWinPlayer = new Audio('audio/win.mp3');
        currentWinPlayer.volume = 0.25;
        currentWinPlayer.onended = function() { currentWinPlayer = null; };
        currentWinPlayer.play();
    } catch (e) { console.log("Audio blocked"); }
}
function triggerWinFeedback() { // Финальный космический звук для умножения (alien_win.mp3 на 3 круга)
    if (currentAlienPlayer) return; 
    try {
        currentAlienPlayer = new Audio('audio/alien_win.mp3');
        currentAlienPlayer.volume = 0.25;
        alienRepeatCount = 1;
        currentAlienPlayer.onended = function() {
            if (alienRepeatCount < 3) {
                alienRepeatCount++;
                if (currentAlienPlayer) currentAlienPlayer.play();
            } else if (currentAlienPlayer) {
                currentAlienPlayer.onended = null;
                currentAlienPlayer = null;
            }
        };
        currentAlienPlayer.play();
    } catch (e) { console.log("Audio blocked"); }
}
function triggerFailFeedback() { // Звук ошибки для всех режимов (fail.mp3)
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
