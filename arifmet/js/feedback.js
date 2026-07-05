// version: v1.2 (Добавлен интеллектуальный предохранитель для сотен)
import { state } from './state.js';

let currentWinPlayer = null;
let currentAlienPlayer = null;
let currentFailPlayer = null;
let alienRepeatCount = 0;

export const soundFlags = {
    simFailSoundPlayed: false,
    finFailSoundPlayed: false,
    simWinSoundPlayed: false,
    finWinSoundPlayed: false
};

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

export function triggerTensWinSound() {
    if (currentWinPlayer) return; 
    try {
        currentWinPlayer = new Audio('audio/win.mp3');
        currentWinPlayer.volume = 0.25;
        currentWinPlayer.onended = () => { currentWinPlayer = null; };
        currentWinPlayer.play();
    } catch (e) { console.warn("Audio blocked:", e); }
}

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

export function triggerFailFeedback() {
    // ПРЕДОХРАНИТЕЛЬ: Проверяем, не пытаемся ли мы шуметь во время первого этапа упрощения сотен
    if (state.activeIndex !== -1 && state.examplesHistory[state.activeIndex]) {
        const item = state.examplesHistory[state.activeIndex];
        const firstNumber = parseInt(item.exampleText, 10);
        const isHundreds = !isNaN(firstNumber) && firstNumber >= 100 && (item.exampleText.includes('+') || item.exampleText.includes('-'));
        const totalEquals = (item.currentInput.match(/=/g) || []).length;

        // Если это сотни и введено меньше 2 знаков "=", полностью блокируем звук ошибки
        if (isHundreds && totalEquals < 2) {
            return;
        }
    }

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
