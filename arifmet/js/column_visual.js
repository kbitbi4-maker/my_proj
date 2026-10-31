// version: v3.0 (Сетка 12x6, переносы без клика на единицах, раздельные раскладки сложения/вычитания)
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

    // Максимальная длина числа (учитываем 4 знака для ответа)
    const maxLen = Math.max(String(num1).length, String(num2).length, String(item.correctValue).length, 4);
    
    // Строки сетки (всего 5 строк по ТЗ: 1 пустая, 2, 3, 4, 5)
    const rows = 5;
    const cols = 12;

    // Подготовка строк для чисел
    const s1 = String(num1).padStart(maxLen, ' ');
    const s2 = String(num2).padStart(maxLen, ' ');
    const userAns = report.finText || report.simText || '';
    const paddedAns = userAns.padStart(maxLen, ' ');

    // Генерация строки с числом в сетке
    function makeNumberRow(str, startCol) {
        let html = '';
        for (let c = 0; c < cols; c++) {
            let content = '';
            if (c >= startCol && c < startCol + maxLen) {
                const ch = str[c - startCol];
                content = (ch === ' ') ? '' : ch;
            }
            html += `<div class="grid-cell">${content}</div>`;
        }
        return html;
    }

    // Генерация строки с переносами
    function makeCarryRow(startCol) {
        let html = '';
        for (let c = 0; c < cols; c++) {
            let content = '';
            let clickable = false;
            let digitType = '';
            
            if (c >= startCol && c < startCol + maxLen) {
                const digitPos = c - startCol; // позиция разряда (0 - самый левый)
                const posFromRight = maxLen - 1 - digitPos; // 0 - единицы, 1 - десятки и т.д.
                
                // Первый столбец (единицы) не кликабелен
                if (posFromRight > 0) {
                    clickable = true;
                    if (posFromRight === 1) digitType = 'tens';
                    else if (posFromRight === 2) digitType = 'hundreds';
                    else if (posFromRight === 3) digitType = 'thousands';
                    
                    content = carries[digitType] || '';
                }
            }
            
            const cls = clickable ? 'grid-cell carry-box-clickable' : 'grid-cell';
            const dataAttr = clickable ? `data-digit="${digitType}"` : '';
            html += `<div class="${cls}" ${dataAttr}>${content}</div>`;
        }
        return html;
    }

    // Генерация строки ответа
    function makeAnswerRow(startCol) {
        let html = '';
        const isSolved = report.isFullySolved;
        const isWrong = report.isWrongAnswer;
        
        for (let c = 0; c < cols; c++) {
            let content = '';
            let extraClass = '';
            if (c >= startCol && c < startCol + maxLen) {
                const ch = paddedAns[c - startCol];
                content = (ch === ' ') ? '_' : ch;
                if (isSolved) extraClass = 'ans-correct';
                else if (isWrong) extraClass = 'ans-incorrect';
            }
            html += `<div class="grid-cell ${extraClass}">${content}</div>`;
        }
        return html;
    }

    // Вычисляем стартовую колонку для чисел (прижимаем к правому краю, оставляя отступ 1 клетку)
    const startCol = cols - maxLen - 1;

    // Сборка сцены в зависимости от режима
    let gridRowsHTML = '';

    if (isAdd) {
        // Сложение: 1 пустая, 2 переносы, 3 число1, 4 число2, 5 ответ
        gridRowsHTML += `<div class="grid-row">${makeNumberRow('', 0)}</div>`; // пустая
        gridRowsHTML += `<div class="grid-row">${makeCarryRow(startCol)}</div>`; // переносы
        gridRowsHTML += `<div class="grid-row">${makeNumberRow(s1, startCol)}</div>`; // число 1
        gridRowsHTML += `<div class="grid-row">${makeNumberRow(s2, startCol)}</div>`; // число 2
        gridRowsHTML += `<div class="grid-row">${makeAnswerRow(startCol)}</div>`; // ответ
    } else {
        // Вычитание: 1 пустая, 2 число1, 3 переносы, 4 число2, 5 ответ
        gridRowsHTML += `<div class="grid-row">${makeNumberRow('', 0)}</div>`; // пустая
        gridRowsHTML += `<div class="grid-row">${makeNumberRow(s1, startCol)}</div>`; // число 1
        gridRowsHTML += `<div class="grid-row">${makeCarryRow(startCol)}</div>`; // переносы
        gridRowsHTML += `<div class="grid-row">${makeNumberRow(s2, startCol)}</div>`; // число 2
        gridRowsHTML += `<div class="grid-row">${makeAnswerRow(startCol)}</div>`; // ответ
    }

    // Знак операции ставим на строку с числом 2 (индекс 3 для сложения, 4 для вычитания)
    // Но т.к. у нас нет отдельной колонки под знак, мы добавим его как абсолютно позиционированный элемент
    // или просто вставим в первую пустую ячейку строки.
    // По ТЗ знак должен быть визуально слева от числа 2. Сделаем через position: absolute.

    const cacheKey = `${item.exampleText}_col_v3_${report.phase}_${userAns}_${carries.thousands}_${carries.hundreds}_${carries.tens}`;

    let html = `
    <div class="column-math-container" style="display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; padding: 10px; box-sizing: border-box;">
        <div class="grid-wrapper" style="position: relative; display: inline-block; background: #f8fafc; border-radius: 8px; padding: 4px; box-shadow: inset 0 0 0 1px #e2e8f0;">
            <div class="grid-sign" style="position: absolute; left: ${startCol * 3.2 + 0.5}vw; top: ${(isAdd ? 3 : 4) * 4.5 + 1}vh; font-size: 3vh; font-weight: bold; color: #64748b; pointer-events: none;">${sign}</div>
            ${gridRowsHTML}
            <div style="position: absolute; left: ${startCol * 3.2 + 0.5}vw; right: 10px; top: ${(isAdd ? 4.5 : 5.5) * 4.5}vh; border-top: 3px solid #475569; pointer-events: none;"></div>
        </div>
    </div>
    `;

    GameCanvas.renderZoneScene(html, cacheKey);

    // Обработчики кликов по кликабельным квадратикам переносов
    const container = document.getElementById('game-zone');
    if (container) {
        container.querySelectorAll('.carry-box-clickable').forEach(box => {
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
