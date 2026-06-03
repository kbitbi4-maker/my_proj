<!-- version: v1.0 -->
let currentWinPlayer = null;
let currentAlienPlayer = null;
let currentFailPlayer = null;
let alienRepeatCount = 0;

// Локальный объект флагов, защищенный от внешнего вмешательства
export const soundFlags = {
    simFailSoundPlayed: false,
    finFailSoundPlayed: false,
    simWinSoundPlayed: false,
    finWinSoundPlayed: false
};

/**
 * Полный сброс всех аудиоплееров и флагов при смене примера или режима
 */
export function resetAllFeedbacks() {
    if (currentWinPlayer) { currentWinPlayer.pause(); currentWinPlayer = null; }
    if (currentAlienPlayer) { currentAlienPlayer.onended = null; currentAlienPlayer.pause(); currentAlienPlayer = null; }
    if (currentFailPlayer) { currentFailPlayer.pause(); currentFailPlayer = null; }
    
    alienRepeatCount = 0;
    
    soundFlags.simFailSoundPlayed = false;
    soundFlags.finFailSoundPlayed = false;
    soundFlags.simWinSoundPlayed = false;
    soundFlags.finWinSoundPlayed = false;
}

/**
 * Обычный победный звук для режима десятков (win.mp3)
 */
export function triggerTensWinSound() {
    if (currentWinPlayer) return; 
    try {
        currentWinPlayer = new Audio('audio/win.mp3');
        currentWinPlayer.volume = 0.25;
        currentWinPlayer.onended = () => { currentWinPlayer = null; };
        currentWinPlayer.play();
    } catch (e) { console.warn("Audio blocked:", e); }
}

/**
 * Финальный космический звук для умножения (alien_win.mp3 на 3 круга)
 */
export function triggerWinFeedback() {
    if (currentAlienPlayer) return; 
    try {
        currentAlienPlayer = new Audio('audio/alien_win.mp3');
        currentAlienPlayer.volume = 0.25;
        alienRepeatCount = 1;
        currentAlienPlayer.onended = () => {
            if (alienRepeatCount < 3) {
                alienRepeatCount++;
                currentAlienPlayer?.play();
            } else if (currentAlienPlayer) {
                currentAlienPlayer.onended = null;
                currentAlienPlayer = null;
            }
        };
        currentAlienPlayer.play();
    } catch (e) { console.warn("Audio blocked:", e); }
}

/**
 * Звук ошибки для всех режимов (fail.mp3)
 */
export function triggerFailFeedback() {
    try {
        if (currentFailPlayer) {
            currentFailPlayer.currentTime = 0;
            currentFailPlayer.play();
        } else {
            currentFailPlayer = new Audio('audio/fail.mp3');
            currentFailPlayer.volume = 0.25;
            currentFailPlayer.play();
        }
    } catch (e) { console.warn("Audio blocked:", e); }
}
