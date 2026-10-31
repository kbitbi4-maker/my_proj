// version: v3.1 (Исправлено позиционирование, Grid-сетка, фикс наложения)
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

    const maxLen = Math.max(String(num1).length, String(num2).length, String(item.correctValue).length, 3);
    
    // Готовим строки
    const s1 = String(num1).padStart(maxLen, ' ');
    const s2 = String(num2).padStart(maxLen, ' ');
    const userAns = report.finText || report.simText || '';
    const paddedAns = userAns.padStart(maxLen, ' ');

    // Вспомогательная функция: рендер одной ячейки
    function cell(content, isClickable, digitType, extraClass = '') {
        const cls = `col-cell ${isClickable ? 'clickable' : ''} ${extraClass}`.trim();
        const data = isClickable ? `data-digit="${digitType}"` : '';
        return `<div class="${cls}" ${data}>${content || ''}</div>`;
    }

    // Генерируем ряды
    let rowCarry = '', rowNum1 = '', rowNum2 = '', rowAns = '', rowSign = '';

    for (let i = 0; i < maxLen; i++) {
        const posFromRight = maxLen - 1 - i; // 0 - единицы, 1 - десятки, ...
        
        // Ряд переносов
        let carryContent = '', carryClickable = false, carryType = '';
        if (posFromRight > 0) { // Квадратик есть только над десятками и выше
            carryClickable = true;
            if (posFromRight === 1) carryType = 'tens';
            else if (posFromRight === 2) carryType = 'hundreds';
            else if (posFromRight === 3) carryType = 'thousands';
            carryContent = carries[carryType] || '';
        }
        rowCarry += cell(carryContent, carryClickable, carryType);

        // Ряды с числами
        const ch1 = s1[i], ch2 = s2[i];
        rowNum1 += cell(ch1 === ' ' ? '' : ch1);
        
        // Знак ставим только в самую левую ячейку второго числа
        const signHTML = (i === 0) ? `<span class="col-sign">${sign}</span>` : '';
        rowNum2 += cell(signHTML + (ch2 === ' ' ? '' : ch2));

        // Ряд ответа
        const chAns = paddedAns[i];
        const ansClass = report.isFullySolved ? 'ans-correct' : (report.isWrongAnswer ? 'ans-incorrect' : '');
        rowAns += cell(chAns === ' ' ? '_' : chAns, false, '', ansClass);
    }

    // Собираем сетку в зависимости от режима (Сложение/Вычитание)
    let gridHTML = '';
    if (isAdd) {
        gridHTML = `
            <div class="col-grid">
                <div class="col-row">${rowCarry}</div>
                <div class="col-row">${rowNum1}</div>
                <div class="col-row">${rowNum2}</div>
                <div class="col-row divider"></div>
                <div class="col-row">${rowAns}</div>
            </div>
        `;
    } else {
        gridHTML = `
            <div class="col-grid">
                <div class="col-row">${rowNum1}</div>
                <div class="col-row">${rowCarry}</div>
                <div class="col-row">${rowNum2}</div>
                <div class="col-row divider"></div>
                <div class="col-row">${rowAns}</div>
            </div>
        `;
    }

    const cacheKey = `${item.exampleText}_col_v3.1_${report.phase}_${userAns}_${carries.thousands}_${carries.hundreds}_${carries.tens}`;
    GameCanvas.renderZoneScene(gridHTML, cacheKey);

    // Обработчики кликов по переносам
    const container = document.getElementById('game-zone');
    if (container) {
        container.querySelectorAll('.col-cell.clickable').forEach(box => {
            box.addEventListener('click', (e) => {
                const digitType = e.currentTarget.getAttribute('data-digit');
                if (!digitType) return;
                let currentVal = carryState[state.activeIndex][digitType];
                
                // Цикл: '' -> '1' -> ''
                if (currentVal === '') currentVal = '1';
                else currentVal = '';

                carryState[state.activeIndex][digitType] = currentVal;
                renderColumnVisual();
            });
        });
    }
}
