import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { syncMonsterGame, getMultiplicationHistoryHTML } from './multiplication.js';
import { renderTensVisual, getTensHistoryHTML } from './tens.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks } from './feedback.js';

/**
 * Переключает активный пример при клике пользователя на строку истории
 */
export function selectExample(index) {
    state.activeIndex = index;
    resetAllFeedbacks(); // Сбрасываем аудио, чтобы звуки не накладывались

    // 1. Проверяем стадию решения примера и подтягиваем нужные «дофаминовые плюшки»
    const report = state.validateCurrentInput();
    if (report.isFullySolved) {
        if (state.currentMode === 'multiplication' || state.currentMode === 'mix') triggerWinFeedback();
        else triggerTensWinSound();
    } else if (report.isWrongAnswer) {
        triggerFailFeedback();
    }

    // 2. Принудительно заставляем GameCanvas обновить синий пунктир и блоки в левой панели
    const isMulti = state.currentMode === 'multiplication' || (state.currentMode === 'mix' && state.examplesHistory[index].exampleText.includes('×'));
    const historyRenderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, historyRenderer);

    // 3. Синхронизируем интерфейс и включаем нижний визуал
    if (isMulti) {
        syncMonsterGame();
    } else {
        renderTensVisual();
    }
}
