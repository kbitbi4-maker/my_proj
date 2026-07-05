// version: v2.0 (Четырехэтапный Микс: Сложение сотен -> Вычитание сотен -> Умножение -> Деление)
import { state } from './state.js';
import { generateExample } from './tens.js';
import { generateMultiExample } from './multiplication.js';

export function initMixMode() {
    document.querySelector('.header-menu-btn').innerText = 'Режим: Микс 🎰 ▼';
    state.mixStep = 0;
    generateMixExample();
}

export function generateMixExample() {
    if (state.currentMode !== 'mix') return;
    
    // Определяем текущее действие по остатку от деления на 4
    let type = state.mixStep % 4;
    
    if (type === 0) {
        // Шаг 1: Сложение сотен. Принудительно включаем плюс.
        // Переключаем временно режим, чтобы движок tens сгенерировал числа от 100 до 900
        state.currentMode = 'hundreds';
        
        // В tens.js переменная isAddition чередуется. 
        // Чтобы гарантировать именно сложение, проверим имя примера после генерации.
        // Если сгенерировался минус, мы просто вызовем функцию еще раз (она переключит флаг на плюс)
        generateExample();
        if (state.examplesHistory[state.activeIndex].exampleText.includes('-')) {
            state.examplesHistory.pop();
            state.usedExamples.pop();
            generateExample();
        }
        
        state.currentMode = 'mix';
    } 
    else if (type === 1) {
        // Шаг 2: Вычитание сотен. Принудительно включаем минус.
        state.currentMode = 'hundreds';
        generateExample();
        if (state.examplesHistory[state.activeIndex].exampleText.includes('+')) {
            state.examplesHistory.pop();
            state.usedExamples.pop();
            generateExample();
        }
        state.currentMode = 'mix';
    } 
    else if (type === 2) {
        // Шаг 3: Умножение (числа до 10 с динамическими монстрами)
        generateMultiExample();
    } 
    else if (type === 3) {
        // Шаг 4: Деление (целочисленное деление из школьной таблицы до 6 с тарелкой)
        // Динамически импортируем и вызываем генератор деления
        import('./division.js').then(m => m.generateDivisionExample());
    }
    
    document.querySelector('.header-menu-btn').innerText = 'Режим: Микс 🎰 ▼';
    state.mixStep++;
}
