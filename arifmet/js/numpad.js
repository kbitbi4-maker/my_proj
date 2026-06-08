// version: v1.2
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks, soundFlags } from './feedback.js';
import { generateExample, renderTensVisual, getTensHistoryHTML } from './tens.js';
import { generateMultiExample, renderMonsterGame, getMultiplicationHistoryHTML } from './multiplication.js';
import { generateMixExample } from './mix.js';

export function pressNum(n) {
    if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
    const activeItem = state.examplesHistory[state.activeIndex];

    if (n === 'C' || n === 'D') {
        activeItem.currentInput = (n === 'C') ? '' : activeItem.currentInput.slice(0, -1);
        resetAllFeedbacks();
    } else {
        const totalEquals = (activeItem.currentInput.match(/=/g) || []).length;
        if (n === '=' && totalEquals >= 2) return;
        activeItem.currentInput += n;
    }

    const report = state.validateCurrentInput();
    handleInputSounds(report, activeItem.exampleText);
    refreshUI();
}

export function confirmAndNext() {
    resetAllFeedbacks();
    // ИСПРАВЛЕНО ДЛЯ СОТЕН: Добавлена поддержка режима hundreds для генерации следующей задачи
    if (state.currentMode === 'tens' || state.currentMode === 'hundreds') generateExample();
    else if (state.currentMode === 'multiplication') generateMultiExample();
    else if (state.currentMode === 'mix') generateMixExample();
}

function handleInputSounds(report, exampleText) {
    const isMulti = exampleText.includes('×');
    
    if (report.isFullySolved) {
        if (!soundFlags.finWinSoundPlayed) {
            if (isMulti) triggerWinFeedback();
            else triggerTensWinSound();
            soundFlags.finWinSoundPlayed = true;
            soundFlags.simWinSoundPlayed = true;
            soundFlags.simFailSoundPlayed = false;
            soundFlags.finFailSoundPlayed = false;
        }
    } else if (report.simCorrect && report.phase === 2) {
        if (!soundFlags.simWinSoundPlayed) {
            triggerTensWinSound();
            soundFlags.simWinSoundPlayed = true;
            soundFlags.simFailSoundPlayed = false;
        }
    } else if (report.isWrongAnswer) {
        const parts = state.examplesHistory[state.activeIndex].currentInput.split('=');
        const hasFin = parts.length > 1 && parts.at(1).trim().length > 0;
        
        if (hasFin && !soundFlags.finFailSoundPlayed) {
            triggerFailFeedback(); soundFlags.finFailSoundPlayed = true;
        } else if (!hasFin && !soundFlags.simFailSoundPlayed) {
            triggerFailFeedback(); soundFlags.simFailSoundPlayed = true;
        }
    }
}

export function refreshUI() {
    if (state.activeIndex === -1) return;
    const activeItem = state.examplesHistory[state.activeIndex];
    const isMulti = activeItem.exampleText.includes('×');
    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);
    
    if (state.currentMode === 'multiplication' || (state.currentMode === 'mix' && isMulti)) renderMonsterGame();
    else renderTensVisual();
}
