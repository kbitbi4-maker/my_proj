// arifmet/js/numpad.js
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks, soundFlags } from './feedback.js';
import { generateExample, renderTensVisual, getTensHistoryHTML } from './tens.js';
import { generateMultiExample, renderMonsterGame, getMultiplicationHistoryHTML } from './multiplication.js';
import { generateMixExample } from './mix.js';

export function pressNum(n) {
    if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
    const activeItem = state.examplesHistory[state.activeIndex];

    const isColumnMode = state.currentMode === 'column';
    const targetLength = String(activeItem.correctValue).length;

    if (n === 'C' || n === 'D') {
        if (n === 'C') activeItem.currentInput = '';
        else activeItem.currentInput = isColumnMode ? activeItem.currentInput.slice(1) : activeItem.currentInput.slice(0, -1);
        resetAllFeedbacks();
    } else {
        if (isColumnMode && n === '=') return;
        const totalEquals = (activeItem.currentInput.match(/=/g) || []).length;
        if (n === '=' && totalEquals >= 2) return;

        if (isColumnMode) {
            if (activeItem.currentInput.length >= targetLength) return;
            activeItem.currentInput = n + activeItem.currentInput;
        } else {
            activeItem.currentInput += n;
        }
    }

    const report = state.validateCurrentInput();
    handleInputSounds(report, activeItem.exampleText);
    refreshUI();
}

export function confirmAndNext() {
    resetAllFeedbacks();
    if (state.currentMode === 'tens' || state.currentMode === 'hundreds' || state.currentMode === 'column') generateExample();
    else if (state.currentMode === 'multiplication' || state.currentMode === 'archer') generateMultiExample();
    else if (state.currentMode === 'mix') generateMixExample();
}

function handleInputSounds(report, exampleText) {
    const isMulti = exampleText.includes('×');
    const isColumn = state.currentMode === 'column';
    const currentSign = isMulti ? '×' : (exampleText.includes('+') ? '+' : '-');
    
    if (report.isFullySolved) {
        if (!soundFlags.finWinSoundPlayed) {
            if (isMulti) triggerWinFeedback();
            else triggerTensWinSound();

            // ТРИГГЕР СИСТЕМЫ АНИМАЦИЙ: Передаем флаги и текущий режим игры!
            window.dispatchEvent(new CustomEvent('game-success', { 
                detail: { 
                    isMulti: isMulti, 
                    isColumn: isColumn, 
                    sign: currentSign,
                    mode: state.currentMode // Наш мост поймает этот параметр!
                } 
            }));

            soundFlags.finWinSoundPlayed = true;
            soundFlags.simWinSoundPlayed = true;
            soundFlags.simFailSoundPlayed = false;
            soundFlags.finFailSoundPlayed = false;
        }
    } else if (report.simCorrect && report.phase === 2) {
        if (!soundFlags.simWinSoundPlayed) {
            triggerTensWinSound();
            window.dispatchEvent(new CustomEvent('game-success', { detail: { isMulti: false, isColumn: isColumn, sign: currentSign, mode: state.currentMode } }));
            soundFlags.simWinSoundPlayed = true;
            soundFlags.simFailSoundPlayed = false;
        }
    } else if (report.isWrongAnswer) {
        if (state.currentMode === 'column') {
            if (!soundFlags.finFailSoundPlayed) {
                triggerFailFeedback();
                window.dispatchEvent(new CustomEvent('game-fail')); // ТРИГГЕР ТРЯСКИ ЭКРАНА
                soundFlags.finFailSoundPlayed = true;
            }
            return;
        }

        const parts = state.examplesHistory[state.activeIndex].currentInput.split('=');
        const hasFin = parts.length > 1 && parts.at(1).trim().length > 0;
        
        if (hasFin && !soundFlags.finFailSoundPlayed) {
            triggerFailFeedback(); window.dispatchEvent(new CustomEvent('game-fail')); soundFlags.finFailSoundPlayed = true;
        } else if (!hasFin && !soundFlags.simFailSoundPlayed) {
            triggerFailFeedback(); window.dispatchEvent(new CustomEvent('game-fail')); soundFlags.simFailSoundPlayed = true;
        }
    }
}

// Изменили метод обновления UI, чтобы режим archer использовал рендеринг умножения (для теста)
export function refreshUI() {
    if (state.activeIndex === -1) return;
    const activeItem = state.examplesHistory[state.activeIndex];
    const isMulti = activeItem.exampleText.includes('×');
    const isMultiMode = state.currentMode === 'multiplication' || state.currentMode === 'archer';
    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);
    
    if (isMultiMode || (state.currentMode === 'mix' && isMulti)) renderMonsterGame();
    else renderTensVisual();
}
