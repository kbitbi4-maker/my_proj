import { state } from './state.js';
import { syncMonsterGame } from './multiplication.js';
import { renderTensVisual } from './tens.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks } from './feedback.js';

export function selectExample(index) {
    state.activeIndex = index;
    resetAllFeedbacks(); // Сбрасываем старые плееры, чтобы звуки не накладывались

    // 1. Проверяем стадию решения примера и подтягиваем нужные «дофаминовые плюшки»
    const report = state.validateCurrentInput();
    if (report.isFullySolved) {
        if (state.currentMode === 'multiplication' || state.currentMode === 'mix') triggerWinFeedback();
        else triggerTensWinSound();
    } else if (report.isWrongAnswer) {
        triggerFailFeedback();
    }

    // 2. Синхронизируем интерфейс и включаем визуал, соответствующий стадии
    if (state.currentMode === 'multiplication') {
        syncMonsterGame();
    } else if (state.currentMode === 'tens' || state.currentMode === 'mix') {
        renderTensVisual();
    }
}
