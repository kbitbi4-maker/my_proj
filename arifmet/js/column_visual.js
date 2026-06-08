// version: v1.1
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';

const carryState = {};

export function renderColumnVisual() {
    const item = state.examplesHistory[state.activeIndex];
    if (!item) return;

    const report = state.validateCurrentInput();
    const isAdd = item.exampleText.includes('+');
    const sign = isAdd ? '+' : '−';
    
    const nums = item.exampleText.split(/[+\-]/);
    const num1 = parseInt(nums[0], 10);
    const num2 = parseInt(nums[1], 10);

    if (!carryState[state.activeIndex]) {
        carryState[state.activeIndex] = { thousands: '', hundreds: '', tens: '' };
    }
    const carries = carryState[state.activeIndex];

    // Форматируем слагаемые/уменьшаемые (строго 3 символа с пробелами слева для выравнивания)
    const s1 = String(num1).padStart(3, ' ');
    const s2 = String(num2).padStart(3, ' ');

    // Получаем текущий ввод (он уже растет справа налево благодаря новому numpad.js)
    const userAns = report.finText || report.simText || '';
    
    // Формируем красивую строку ответа длиной в 4 символа (тысячи, сотни, десятки, единицы)
    // Если символов не хватает, пробелы слева заменяем на невидимые разделители или фиксированные места
    const paddedAns = userAns.padStart(4, ' ');
    let answerHTML = '';
    for (let i = 0; i < 4; i++) {
        const char = paddedAns[i];
        if (char === ' ') {
            // Пока ребенок не дошел до этого разряда, рисуем аккуратную пустую ячейку/подчеркивание
            answerHTML += `<span style="color: #cbd5e1; font-weight: normal;">_</span>`;
        } else {
            answerHTML += `<span>${char}</span>`;
        }
    }

    const cacheKey = `${item.exampleText}_col_p${report.phase}_input${userAns}_th${carries.thousands}_h${carries.hundreds}_t${carries.tens}`;

    let html = `
    <div class="column-math-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: monospace; font-size: 4.5vh; font-weight: bold; color: #334155; line-height: 1.2; user-select: none;">
        
        <!-- Памятки переноса разрядов -->
        <div class="carry-row" style="display: flex; justify-content: flex-end; width: 140px; margin-bottom: 2px; height: 4vh;">
            <div class="carry-box" data-digit="thousands" style="width: 35px; text-align: center; color: #a855f7; font-size: 2.5vh; background: #f3e8ff; border-radius: 4px; margin-right: 2px; cursor: pointer; min-height: 3.5vh; display: flex; align-items: center; justify-content: center;">${carries.thousands}</div>
            <div class="carry-box" data-digit="hundreds" style="width: 35px; text-align: center; color: #3b82f6; font-size: 2.5vh; background: #dbeafe; border-radius: 4px; margin-right: 2px; cursor: pointer; min-height: 3.5vh; display: flex; align-items: center; justify-content: center;">${carries.hundreds}</div>
            <div class="carry-box" data-digit="tens" style="width: 35px; text-align: center; color: #10b981; font-size: 2.5vh; background: #d1fae5; border-radius: 4px; margin-right: 2px; cursor: pointer; min-height: 3.5vh; display: flex; align-items: center; justify-content: center;">${carries.tens}</div>
            <div style="width: 35px;"></div>
        </div>

        <!-- Сетка чисел -->
        <div style="position: relative; width: 140px; text-align: right; letter-spacing: 12px; padding-right: 4px;">
            <div style="position: absolute; left: -25px; top: 1.2vh; color: #64748b; letter-spacing: normal;">${sign}</div>
            <div>${s1}</div>
            <div>${s2}</div>
            <div style="width: 165px; position: absolute; left: -25px; border-top: 4px solid #475569; margin-top: 2px; margin-bottom: 2px;"></div>
        </div>

        <!-- Посимвольная область ответа, выровненная по сетке -->
        <div class="answer-row ${report.isFullySolved ? 'block-correct' : (report.isWrongAnswer ? 'block-incorrect' : '')}" style="width: 140px; text-align: right; letter-spacing: 12px; margin-top: 12px; padding-right: 4px; color: ${report.isFullySolved ? '#155724' : (report.isWrongAnswer ? '#721c24' : '#1e293b')}; min-height: 5.5vh;">
            ${answerHTML}
        </div>

        <div style="font-size: 1.8vh; margin-top: 15px; color: #64748b; letter-spacing: normal; font-family: sans-serif;">
            ${report.isFullySolved ? 'Великолепно! Правильно в столбик! 🎉' : 'Считаем справа налево: сначала единицы, потом десятки 📝'}
        </div>
    </div>
    `;

    GameCanvas.renderZoneScene(html, cacheKey);

    const container = document.getElementById('game-zone');
    if (container) {
        container.querySelectorAll('.carry-box').forEach(box => {
            box.addEventListener('click', (e) => {
                const digitType = e.currentTarget.getAttribute('data-digit');
                let currentVal = carryState[state.activeIndex][digitType];
                
                if (currentVal === '') currentVal = '1';
                else if (currentVal === '1') currentVal = '2';
                else currentVal = '';

                carryState[state.activeIndex][digitType] = currentVal;
                renderColumnVisual();
            });
        });
    }
}
