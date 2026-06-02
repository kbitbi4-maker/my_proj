import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks } from './feedback.js';

// Импортируем генераторы примеров (подключатся по ходу сборки этих файлов)
import { generateExample } from './tens.js';
import { generateMultiExample } from './multiplication.js';
import { generateMixExample } from './mix.js';

/**
 * Обработчик нажатия на кнопки нумпада (цифры, знаки, удаление)
 */
export function pressNum(n) {
    if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
    const activeItem = state.examplesHistory[state.activeIndex];

    if (n === 'C' || n === 'D') {
        activeItem.currentInput = (n === 'C') ? '' : activeItem.currentInput.slice(0, -1);
        resetAllFeedbacks();
    } else {
        const totalEquals = (activeItem.currentInput.match(/=/g) || []).length;
        if (n === '=' && totalEquals >= 2) return; // Защита от лишних знаков равенства
        activeItem.currentInput += n;
    }

    // Запускаем валидацию данных в стейте и проверяем необходимость звуков
    const report = state.validateCurrentInput();
    handleInputSounds(report);

    // Перерисовываем интерфейс (историю и игровой визуал)
    refreshUI(report);
}

/**
 * Обработчик кнопки «Следующий пример»
 */
export function confirmAndNext() {
    resetAllFeedbacks();
    if (state.currentMode === 'tens') generateExample();
    else if (state.currentMode === 'multiplication') generateMultiExample();
    else if (state.currentMode === 'mix') generateMixExample();
}

// Внутренняя функция управления звуковым фидбеком на основе отчета валидации
function handleInputSounds(report) {
    if (report.isFullySolved) {
        if (state.currentMode === 'multiplication' || state.currentMode === 'mix') triggerWinFeedback();
        else triggerTensWinSound();
    } else if (report.isWrongAnswer) {
        triggerFailFeedback();
    }
}

// Функция синхронного обновления левой панели истории и нижней графической зоны
function refreshUI(report) {
    // В следующих шагах мы передадим в renderHistory кастомный метод блоков, а пока вызываем обновление сцены
    // GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, ...);
    
    // Вызываем нужный визуал в зависимости от режима
    if (state.currentMode === 'multiplication' && window.renderMonsterGame) window.renderMonsterGame();
    if (state.currentMode === 'tens') {
        const activeItem = state.examplesHistory[state.activeIndex];
        if (activeItem.exampleText.includes('+') && window.renderAdditionVisual) window.renderAdditionVisual();
        if (activeItem.exampleText.includes('-') && window.renderSubtractionVisual) window.renderSubtractionVisual();
    }
}

// Проброс в window для поддержки текущих inline-событий onclick в HTML
window.pressNum = pressNum;
window.confirmAndNext = confirmAndNext;

