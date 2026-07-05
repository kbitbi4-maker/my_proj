// version: v2.3 (Исправлен визуал сотен при клике на историю Микса)
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { syncMonsterGame, getMultiplicationHistoryHTML } from './multiplication.js';
import { renderTensVisual, getTensHistoryHTML } from './tens.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks, soundFlags } from './feedback.js';

export function selectExample(index) {
    state.activeIndex = index;
    resetAllFeedbacks();

    const item = state.examplesHistory[index];
    const report = state.validateCurrentInput(index);
    const isMulti = item.exampleText.includes('×') || item.exampleText.includes('÷');

    if (report.isFullySolved) {
        if (isMulti) triggerWinFeedback(); else triggerTensWinSound();
        soundFlags.finWinSoundPlayed = true; soundFlags.simWinSoundPlayed = true;
    } else if (report.simCorrect && report.phase === 2) {
        triggerTensWinSound();
        soundFlags.simWinSoundPlayed = true;
    } else if (report.isWrongAnswer) {
        triggerFailFeedback();
        if (item.currentInput.includes('=')) {
            const parts = item.currentInput.split('=');
            if (parts.length > 1 && parts.at(1).trim().length > 0) soundFlags.finFailSoundPlayed = true;
            else soundFlags.simFailSoundPlayed = true;
        } else if (isMulti) {
            soundFlags.finFailSoundPlayed = true;
        }
    }

    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);

    // ХИРУРГИЧЕСКИЙ РОУТИНГ СЦЕНЫ ИСТОРИИ: Автономное определение по структуре примера
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
