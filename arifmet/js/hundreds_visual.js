// version: v1.0
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { parseAdditionData, parseSubtractionData } from './calculator.js';

export function renderHundredsVisual() {
    const item = state.examplesHistory[state.activeIndex]; if (!item) return;
    const report = state.validateCurrentInput();
    const isAddition = item.exampleText.includes('+');
    
    // Берем базовые разряды десятков/единиц из готовых методов калькулятора
    const data = isAddition ? parseAdditionData(item.exampleText, report) : parseSubtractionData(item.exampleText, report);
    const cacheKey = `${item.exampleText}_hundreds_phase${report.phase}_${report.isFullySolved}`;

    // Вычисляем количество сотен (ультракристаллов) для стартовых чисел
    const hundreds1 = Math.floor(data.num1 / 100), hundreds2 = Math.floor(data.num2 / 100);
    let html = '';

    if (report.phase === 1) { // ФАЗА 1: СТАРТ
        const content1 = buildHundredsLayoutHTML(hundreds1, generateCrystalColumnsHTML(data.tens1, false, 0) + generateOnesHTML(data.ones1, false));
        const content2 = buildHundredsLayoutHTML(hundreds2, generateCrystalColumnsHTML(data.tens2, true, 0) + generateOnesHTML(data.ones2, true), true);
        html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;">${content1}<div style="font-size:28px;font-weight:bold;color:#94a3b8;">${isAddition ? '+' : '-'}</div>${content2}</div>`;
    } 
    else if (report.phase === 2) { // ФАЗА 2: УПРОЩЕНИЕ
        const borderGlow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : '';
        if (isAddition) {
            const content1 = buildHundredsLayoutHTML(hundreds1, generateCrystalColumnsHTML(data.leftTens, false, data.leftBorrowCount) + generateOnesHTML(data.leftOnes, false));
            const content2 = buildHundredsLayoutHTML(hundreds2, generateCrystalColumnsHTML(data.rightTens, true, data.rightBorrowCount) + generateOnesHTML(data.rightOnes, true), true);
            html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;animation:fadeIn 0.3s;${borderGlow}">${content1}<div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div>${content2}</div>`;
        } else {
            const borderColor = report.simCorrect ? '#22c55e' : '#0284c7', shadow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : '';
            html = `<div class="sub-scene-container" style="animation:fadeIn 0.3s;"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div><div class="crystal-deck" style="border-color:${borderColor};${shadow}">${buildHundredsLayoutHTML(hundreds1, generateSubCargoHTML(data.tens1, data.ones1, data.addedAmount, data.subtractedAmount))}</div><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div><div class="crystal-deck" style="border:2px solid #000;">${buildHundredsLayoutHTML(hundreds2, generateSubEmptyCubesHTML(data.num2 - data.subtractedAmount, data.addedAmount))}</div></div>`;
        }
    } 
    else { // ФАЗА 3: ОТВЕТ (Финальное объединение)
        let deckContentHTML = '';
        const finalHundreds = isAddition ? Math.floor((data.num1 + data.num2) / 100) : Math.floor((data.num1 - data.num2) / 100);
        
        if (isAddition) {
            if (data.rightBorrowCount > 0) deckContentHTML += generateOnesHTML(data.totalOnes, false) + generateCrystalColumnsHTML(data.tens1, false, 0) + generateCrystalColumnsHTML(data.tens2, true, 0) + generateCrystalColumnsHTML(1, true, data.rightBorrowCount);
            else if (data.leftBorrowCount > 0) deckContentHTML += generateCrystalColumnsHTML(data.tens1, false, 0) + generateCrystalColumnsHTML(1, false, data.leftBorrowCount) + generateCrystalColumnsHTML(data.tens2, true, 0) + generateOnesHTML(data.totalOnes, true);
            else deckContentHTML += generateCrystalColumnsHTML(data.tens1, false, 0) + generateOnesHTML(data.ones1, false) + generateCrystalColumnsHTML(data.tens2, true, 0) + generateOnesHTML(data.ones2, true);
        } else {
            deckContentHTML += generateSubCargoHTML(data.tens1, data.ones1, 0, data.currentSubtrahend);
        }
        
        const combinedLayout = buildHundredsLayoutHTML(finalHundreds, deckContentHTML);
        const lAnim = report.isFullySolved ? 'add-robot-left-drive' : '', rAnim = report.isFullySolved ? 'add-robot-right-drive' : '';
        html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;"><div class="win-layout" style="display:flex;align-items:center;justify-content:center;position:relative;"><div class="${lAnim}"><div><span style="font-size:36px;line-height:1;">🤖</span></div></div><div class="crystal-deck" style="background:#f0fdf4;border-color:#4ade80;margin:0 10px;display:flex;flex-direction:column;gap:10px;">${combinedLayout}</div><div class="${rAnim}"><div><span style="font-size:36px;line-height:1;">🤖</span></div></div></div><b style="color:#22c55e;font-size:14px;margin-top:8px;">${report.isFullySolved ? 'Ура! Сотни покорены! 🎉' : 'Проверяем ответ... 👀'}</b></div>`;
    }
    GameCanvas.renderZoneScene(html, cacheKey);
}

function buildHundredsLayoutHTML(hundredsCount, subDeckHTML, isOrange = false) {
    let purpleCrystalsHTML = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:center;width:100%;">';
    for (let i = 0; i < hundredsCount; i++) purpleCrystalsHTML += `<div class="hundred-crystal"></div>`;
    purpleCrystalsHTML += '</div>';
    
    const robotBlock = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div>`;
    const deckBlock = `<div class="crystal-deck ${isOrange ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;">${purpleCrystalsHTML}<div style="display:flex;gap:4px;align-items:flex-end;">${subDeckHTML}</div></div>`;
    return `<div class="crystal-truck">${isOrange ? deckBlock + robotBlock : robotBlock + deckBlock}</div>`;
}

// Переиспользуем ваши точные внутренние рендереры кубиков из v1.1
function generateCrystalColumnsHTML(c, o, b) { let html = ''; for (let i = 0; i < c; i++) { html += `<div class="crystal-column">`; let isLast = (i === c - 1) && (b > 0); for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${(isLast && j > (10 - b)) ? (o ? 'borrow-blue' : 'borrow-orange') : (o ? 'borrow-orange' : 'borrow-blue')}"></div>`; html += `</div>`; } return html; }
function generateOnesHTML(c, o) { if (c === 0) return ''; let html = `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) html += (j <= c) ? `<div class="crystal-item ${o ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; return html + `</div>`; }
function generateSubCargoHTML(t, o, a, s) { let base = (t * 10) + o, total = base + a, active = total - s, full = Math.floor(total / 10), rem = total % 10, g = 0, html = ''; for (let i = 0; i < full; i++) { html += `<div class="crystal-column">`; for (let j = 1; j <= 10; j++) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; } html += `</div>`; } if (rem > 0) { html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; } html += `</div>`; } return html; }
function generateSubEmptyCubesHTML(e, a) { let total = e + a, full = Math.floor(total / 10), rem = total % 10, g = 0, html = ''; for (let i = 0; i < full; i++) { html += `<div class="crystal-column">`; for (let j = 1; j <= 10; j++) { g++; html += g <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } html += `</div>`; } if (rem > 0) { html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; } html += `</div>`; } return html; }
function generateSubFinalCubesHTML(b, o) { let total = b + o, full = Math.floor(total / 10), rem = total % 10, g = 0, html = ''; for (let i = 0; i < full; i++) { html += `<div class="crystal-column">`; for (let j = 1; j <= 10; j++) { g++; html += `<div class="crystal-item ${g <= b ? '' : 'borrow-orange'}"></div>`; } html += `</div>`; } if (rem > 0) { html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += `<div class="crystal-item ${g <= b ? '' : 'borrow-orange'}"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; } html += `</div>`; } return html; }

