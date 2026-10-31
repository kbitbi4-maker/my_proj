// version: v3.3 (Добавлены отступы между разрядами и серый фон ячеек)
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

    // Инициализация состояния переносов
    if (!carryState[state.activeIndex]) {
        carryState[state.activeIndex] = {};
    }
    const carries = carryState[state.activeIndex];

    const maxLen = Math.max(String(num1).length, String(num2).length, String(item.correctValue).length, 3);
    
    // Готовим строки
    const s1 = String(num1).padStart(maxLen, ' ');
    const s2 = String(num2).padStart(maxLen, ' ');
    const userAns = report.finText || report.simText || '';
    const paddedAns = userAns.padStart(maxLen, ' ');

    // Вспомогательная функция: рендер одной ячейки
    function cell(content, isClickable, digitPosFromRight, extraClass = '') {
        let cls = `col-cell ${isClickable ? 'clickable' : ''} ${extraClass}`.trim();
        
        // Добавляем отступ для тысяч, миллионов (каждый 3-й разряд справа)
        if (digitPosFromRight > 0 && digitPosFromRight % 3 === 0) {
            cls += ' group-gap';
        }
        
        const data = isClickable ? `data-pos="${digitPosFromRight}"` : '';
        return `<div class="${cls}" ${data}>${content || ''}</div>`;
    }

    // Генерируем ряды
    let rowCarry = '', rowNum1 = '', rowNum2 = '', rowAns = '';

    for (let i = 0; i < maxLen; i++) {
        const posFromRight = maxLen - 1 - i; // 0 - единицы, 1 - десятки, ...
        
        // Ряд переносов
        let carryContent = '', carryClickable = false;
        if (posFromRight > 0) { // Квадратик есть только над десятками и выше
            carryClickable = true;
            carryContent = carries[posFromRight] || '';
        }
        // Если перенос пустой и не кликабельный (т.е. единицы) - делаем прозрачным
        const carryEmptyClass = (!carryClickable && !carryContent) ? 'empty-cell' : '';
        rowCarry += cell(carryContent, carryClickable, posFromRight, carryEmptyClass);

        // Ряды с числами
        const ch1 = s1[i], ch2 = s2[i];
        rowNum1 += cell(ch1 === ' ' ? '' : ch1, false, posFromRight, ch1 === ' ' ? 'empty-cell' : '');
        
        // Знак ставим только в самую левую ячейку второго числа
        const signHTML = (i === 0) ? `<span class="col-sign">${sign}</span>` : '';
        rowNum2 += cell(signHTML + (ch2 === ' ' ? '' : ch2), false, posFromRight, ch2 === ' ' ? 'empty-cell' : '');

        // Ряд ответа
        const chAns = paddedAns[i];
        const ansClass = report.isFullySolved ? 'ans-correct' : (report.isWrongAnswer ? 'ans-incorrect' : '');
        rowAns += cell(chAns === ' ' ? '_' : chAns, false, posFromRight, ansClass);
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

    const cacheKey = `${item.exampleText}_col_v3.3_${report.phase}_${userAns}_${JSON.stringify(carries)}`;
    GameCanvas.renderZoneScene(gridHTML, cacheKey);

    // Обработчики кликов по переносам
    const container = document.getElementById('game-zone');
    if (container) {
        container.querySelectorAll('.col-cell.clickable').forEach(box => {
            box.addEventListener('click', (e) => {
                const posStr = e.currentTarget.getAttribute('data-pos');
                if (posStr === null) return;
                const pos = parseInt(posStr, 10);
                
                let currentVal = carries[pos] || '';
                
                // Цикл: '' -> '1' -> ''
                if (currentVal === '') currentVal = '1';
                else currentVal = '';

                carries[pos] = currentVal;
                renderColumnVisual();
            });
        });
    }
}
