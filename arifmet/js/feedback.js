// version: v2.0 (Умный фидбек: универсальный мягкий ввод и управление фазами для всех режимов) 
import { state } from './state.js';

let currentWinPlayer = null;
let currentAlienPlayer = null;
let currentFailPlayer = null;
let alienRepeatCount = 0;

export const soundFlags = {
    simFailSoundPlayed: false,
    finFailSoundPlayed: false,
    simWinSoundPlayed: false,
    finWinSoundPlayed = false
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

/**
 * ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗАТОР ВВОДА
 * Перехватывает сырой отчет валидации и на лету модифицирует фазы игры,
 * обеспечивая мягкий ввод (прямой ответ или упрощение) для всех режимов.
 */
export function interceptAndTriggerFeedback(report, exampleText) {
    if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return report;
    const item = state.examplesHistory[state.activeIndex];
    
    const isMulti = exampleText.includes('×');
    const isDiv = exampleText.includes('÷');
    const firstNumber = parseInt(exampleText, 10);
    const isHundreds = !isNaN(firstNumber) && firstNumber >= 100 && (exampleText.includes('+') || exampleText.includes('-'));
    const isTens = !isNaN(firstNumber) && firstNumber < 100 && firstNumber >= 10 && (exampleText.includes('+') || exampleText.includes('-'));

    // ФАЗА А: Ребёнок пишет число напрямую (знака "=" в строке ввода нет)
    if (!item.currentInput.includes('=')) {
        const inputNum = parseInt(item.currentInput, 10);
        
        // Если введён ТОЧНЫЙ итоговый ответ — принудительно включаем триумф
        if (inputNum === item.correctValue) {
            report.isFullySolved = true;
            report.isWrongAnswer = false;
            report.phase = 3;
            report.simCorrect = true;
            report.finCorrect = true;
            report.finText = item.currentInput;

            if (!soundFlags.finWinSoundPlayed) {
                if (isMulti || isDiv || isHundreds) triggerWinFeedback();
                else triggerTensWinSound();
                soundFlags.finWinSoundPlayed = true;
                soundFlags.simWinSoundPlayed = true;
            }
            return report;
        }

        // Если вводится что-то другое (выражение упрощения или неполное число) — 
        // мы замораживаем любые ошибки и держим нейтральный статус фазы 1
        if (isHundreds || isTens || isMulti || isDiv) {
            report.isFullySolved = false;
            report.isWrongAnswer = false;
            report.phase = 1;
            report.simCorrect = false;
            report.finCorrect = false;
            return report;
        }
    }

    // ФАЗА Б: Ребёнок идёт через знак "=" (упрощение)
    const totalEquals = (item.currentInput.match(/=/g) || []).length;
    
    // Мягкий порядок слагаемых для умножения на этапе упрощения
    if (isMulti && report.simCorrect && totalEquals === 1) {
        const parts = item.currentInput.split('=');
        const simText = parts[0] || '';
        const checkParts = simText.split('+');
        const cleanText = exampleText.replace(/×/g, '*');
        const factors = cleanText.split('*');
        const f1 = parseInt(factors[0], 10);
        const f2 = parseInt(factors[1], 10);
        
        const isVariantA = (checkParts.length === f2 && parseInt(checkParts[0], 10) === f1);
        const isVariantB = (checkParts.length === f1 && parseInt(checkParts[0], 10) === f2);
        
        if (!isVariantA && !isVariantB) {
            report.simCorrect = false;
            report.isFullySolved = false;
        }
    }

    // Обработка звуков для классической двухэтапной схемы
    if (report.isFullySolved) {
        if (!soundFlags.finWinSoundPlayed) {
            if (isMulti || isDiv || isHundreds) triggerWinFeedback();
            else triggerTensWinSound();
            soundFlags.finWinSoundPlayed = true;
            soundFlags.simWinSoundPlayed = true;
        }
    } else if (report.simCorrect && report.phase === 2) {
        if (!soundFlags.simWinSoundPlayed) {
            triggerTensWinSound();
            soundFlags.simWinSoundPlayed = true;
        }
    } else if (report.isWrongAnswer) {
        const parts = item.currentInput.split('=');
        const hasFin = parts.length > 1 && parts[1].trim().length > 0;
        const targetLength = String(item.correctValue).length;

        if (hasFin) {
            if (parts[1].trim().length >= targetLength && !soundFlags.finFailSoundPlayed) {
                triggerFailFeedback();
                soundFlags.finFailSoundPlayed = true;
            }
        } else if (!soundFlags.simFailSoundPlayed) {
            triggerFailFeedback();
            soundFlags.simFailSoundPlayed = true;
        }
    }

    return report;
}
