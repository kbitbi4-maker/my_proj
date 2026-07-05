// version: v2.6 (Интеграция перехвата отчетов через умный фидбек)
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { resetAllFeedbacks, interceptAndTriggerFeedback } from './feedback.js';
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

export function refreshUI() {
    if (state.activeIndex === -1) return;
    const activeItem = state.examplesHistory[state.activeIndex];
    
    // Прогоняем сырой математический отчет через централизованный анализатор фидбека
    let rawReport = state.validateCurrentInput();
    let report = interceptAndTriggerFeedback(rawReport, activeItem.exampleText);

    const isMulti = activeItem.exampleText.includes('×') || activeItem.exampleText.includes('÷');
    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);
    
    if (activeItem.exampleText.includes('×')) {
        renderMonsterGame();
    } else if (activeItem.exampleText.includes('÷')) {
        import('./division_visual.js').then(m => m.renderDivisionVisual());
    } else if (state.currentMode === 'column') {
        import('./column_visual.js').then(m => m.renderColumnVisual());
    } else {
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
