// version: v2.5 (История кликов переведена на централизованный перехват фидбека)
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { syncMonsterGame, getMultiplicationHistoryHTML } from './multiplication.js';
import { renderTensVisual, getTensHistoryHTML } from './tens.js';
import { resetAllFeedbacks, interceptAndTriggerFeedback } from './feedback.js';

export function selectExample(index) {
    state.activeIndex = index;
    resetAllFeedbacks();

    const item = state.examplesHistory[index];
    
    // Пропускаем отчет клика через централизованный фидбек
    let rawReport = state.validateCurrentInput(index);
    let report = interceptAndTriggerFeedback(rawReport, item.exampleText);

    const isMulti = item.exampleText.includes('×') || item.exampleText.includes('÷');
    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);

    if (item.exampleText.includes('×')) {
        syncMonsterGame();
    } else if (item.exampleText.includes('÷')) {
        import('./division_visual.js').then(m => m.renderDivisionVisual());
    } else if (state.currentMode === 'column') {
        import('./column_visual.js').then(m => m.renderColumnVisual());
    } else {
        const firstNumber = parseInt(item.exampleText, 10);
        if (firstNumber >= 100) {
            if (item.exampleText.includes('+')) {
                import('./addition_hundreds_visual.js').then(m => m.renderAdditionHundredsVisual());
            } else {
                import('./subtraction_hundreds_visual.js').then(m => m.renderSubtractionHundredsVisual());
            }
        } else {
            renderTensVisual();
        }
    }
}
