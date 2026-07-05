// version: v2.4 (Исправлен визуал сотен в режиме Микс)
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
        if (n === 'C') {
            activeItem.currentInput = '';
        } else {
            activeItem.currentInput = isColumnMode ? activeItem.currentInput.slice(1) : activeItem.currentInput.slice(0, -1);
        }
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
    else if (state.currentMode === 'multiplication') generateMultiExample();
    else if (state.currentMode === 'mix') generateMixExample();
    else if (state.currentMode === 'division') {
        import('./division.js').then(m => m.generateDivisionExample());
    }
}

function handleInputSounds(report, exampleText) {
    const isMulti = exampleText.includes('×') || exampleText.includes('÷');
    
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
        if (state.currentMode === 'column' || (isMulti && !state.examplesHistory[state.activeIndex].currentInput.includes('='))) {
            if (!soundFlags.finFailSoundPlayed) {
                triggerFailFeedback();
                soundFlags.finFailSoundPlayed = true;
            }
            return;
        }

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
    const isMulti = activeItem.exampleText.includes('×') || activeItem.exampleText.includes('÷');
    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);
    
    // ХИРУРГИЧЕСКИЙ РОУТИНГ СЦЕНЫ: Смотрим строго на знаки и длину чисел в примере
    if (activeItem.exampleText.includes('×')) {
        renderMonsterGame();
    } else if (activeItem.exampleText.includes('÷')) {
        import('./division_visual.js').then(m => m.renderDivisionVisual());
    } else if (state.currentMode === 'column') {
        import('./column_visual.js').then(m => m.renderColumnVisual());
    } else {
        // Проверяем, сотни это или десятки, извлекая первое число примера
        const firstNumber = parseInt(activeItem.exampleText, 10);
        if (firstNumber >= 100) {
            if (activeItem.exampleText.includes('+')) {
                import('./addition_hundreds_visual.js').then(m => m.renderAdditionHundredsVisual());
            } else {
                import('./subtraction_hundreds_visual.js').then(m => m.renderSubtractionHundredsVisual());
            }
        } else {
            renderTensVisual();
        }
    }
}
