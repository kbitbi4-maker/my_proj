// version: v1.4
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { parseAdditionData, parseSubtractionData } from './calculator.js';

export function renderHundredsVisual() {
    const item = state.examplesHistory[state.activeIndex]; if (!item) return;
    const report = state.validateCurrentInput(), isAdd = item.exampleText.includes('+');
    const data = isAdd ? parseAdditionData(item.exampleText, report) : parseSubtractionData(item.exampleText, report);
    const cacheKey = `${item.exampleText}_hundreds_phase${report.phase}_${report.isFullySolved}`;
    let html = '', h1 = Math.floor(data.num1 / 100), h2 = Math.floor(data.num2 / 100);

    if (report.phase === 1) {
        const content1 = buildHundredsLayoutHTML(h1, 0, genCols(data.tens1, false, 0) + genOnes(data.ones1, false), false);
        const content2 = buildHundredsLayoutHTML(0, h2, genCols(data.tens2, true, 0) + genOnes(data.ones2, true), true);
        html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;">${content1}<div style="font-size:28px;font-weight:bold;color:#94a3b8;">${isAdd ? '+' : '-'}</div>${content2}</div>`;
    } 
    else if (report.phase === 2) {
        const borderGlow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : '';
        let currentH1 = h1, currentH2 = h2;
        if (report.simText.includes(isAdd ? '+' : '-')) {
            const parts = report.simText.split(isAdd ? '+' : '-'), leftNum = parseInt(parts[0], 10), rightNum = parseInt(parts[1], 10);
            if (!isNaN(leftNum)) currentH1 = Math.floor(leftNum / 100);
            if (!isNaN(rightNum)) currentH2 = Math.floor(rightNum / 100);
        }
        if (isAdd) {
            const content1 = buildHundredsLayoutHTML(currentH1, 0, genCols(data.leftTens, false, data.leftBorrowCount) + genOnes(data.leftOnes, false), false);
            const content2 = buildHundredsLayoutHTML(0, currentH2, genCols(data.rightTens, true, data.rightBorrowCount) + genOnes(data.rightOnes, true), true);
            html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;animation:fadeIn 0.3s;${borderGlow}">${content1}<div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div>${content2}</div>`;
        } else {
            const borderColor = report.simCorrect ? '#22c55e' : '#0284c7', shadow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : '';
            html = `<div class="sub-scene-container" style="animation:fadeIn 0.3s;"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div><div class="crystal-deck" style="border-color:${borderColor};${shadow}">${buildHundredsLayoutHTML(currentH1, 0, genSubCargo(data.tens1, data.ones1, data.addedAmount, data.subtractedAmount), false, true)}</div><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div><div class="crystal-deck" style="border:2px solid #000;">${buildHundredsLayoutHTML(0, currentH2, genSubEmpty(data.num2 - data.subtractedAmount, data.addedAmount), true, true)}</div></div>`;
        }
    } 
    else {
        let deckHTML = '', finalH1 = h1, finalH2 = h2;
        if (report.simText.includes(isAdd ? '+' : '-')) {
            const parts = report.simText.split(isAdd ? '+' : '-'), leftNum = parseInt(parts[0], 10), rightNum = parseInt(parts[1], 10);
            if (!isNaN(leftNum)) finalH1 = Math.floor(leftNum / 100); if (!isNaN(rightNum)) finalH2 = Math.floor(rightNum / 100);
        }
        if (isAdd) {
            if (data.rightBorrowCount > 0) deckHTML += genOnes(data.totalOnes, false) + genCols(data.tens1, false, 0) + genCols(data.tens2, true, 0) + genCols(1, true, data.rightBorrowCount);
            else if (data.leftBorrowCount > 0) deckHTML += genCols(data.tens1, false, 0) + genCols(1, false, data.leftBorrowCount) + genCols(data.tens2, true, 0) + genOnes(data.totalOnes, true);
            else deckHTML += genCols(data.tens1, false, 0) + genOnes(data.ones1, false) + genCols(data.tens2, true, 0) + genOnes(data.ones2, true);
        } else { deckHTML += genSubCargo(data.tens1, data.ones1, 0, data.currentSubtrahend); finalH1 = Math.floor((data.num1 - data.num2) / 100); finalH2 = 0; }
        
        // ФАЗА 3 ФИНАЛ: Идеальное сохранение исходных цветов ультракристаллов сотен (ИСПРАВЛЕНО!)
        let hCrystals = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
        for (let i = 0; i < finalH1; i++) hCrystals += '<div class="hundred-crystal"></div>';
        for (let i = 0; i < finalH2; i++) hCrystals += '<div class="hundred-crystal crimson"></div>';
        hCrystals += '</div>';
        
        const lAnim = report.isFullySolved ? 'add-robot-left-drive' : '', rAnim = report.isFullySolved ? 'add-robot-right-drive' : '';
        html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;"><div class="win-layout" style="display:flex;align-items:center;justify-content:center;position:relative;"><div class="${lAnim}"><div><span style="font-size:36px;line-height:1;">🤖</span></div></div><div class="crystal-deck" style="background:#f0fdf4;border-color:#4ade80;margin:0 10px;display:flex;flex-direction:column;gap:5px;min-width:140px;align-items:flex-start;padding:8px;">${hCrystals}<div style="display:flex;gap:4px;align-items:flex-end;">${deckHTML}</div></div><div class="${rAnim}"><div><span style="font-size:36px;line-height:1;">🤖</span></div></div></div><b style="color:#22c55e;font-size:14px;margin-top:8px;">${report.isFullySolved ? 'Ура! Сотни покорены! 🎉' : 'Проверяем ответ... 👀'}</b></div>`;
    }
    GameCanvas.renderZoneScene(html, cacheKey);
}

function buildHundredsLayoutHTML(purpleCount, crimsonCount, subDeckHTML, isOrange = false, flatMode = false) {
    let hHTML = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
    for (let i = 0; i < purpleCount; i++) hHTML += '<div class="hundred-crystal"></div>';
    for (let i = 0; i < crimsonCount; i++) hHTML += '<div class="hundred-crystal crimson"></div>';
    hHTML += '</div>';
    if (flatMode) return `${hHTML}<div style="display:flex;gap:4px;align-items:flex-end;">${subDeckHTML}</div>`;
    const deck = `<div class="crystal-deck ${isOrange ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;">${hHTML}<div style="display:flex;gap:4px;align-items:flex-end;">${subDeckHTML}</div></div>`;
    return `<div class="crystal-truck">${isOrange ? deck + '<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div>' : '<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div>' + deck}</div>`;
}

function genCols(c, o, b) { let html = ''; for (let i = 0; i < c; i++) { html += `<div class="crystal-column">`; let last = (i === c - 1) && (b > 0); for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${(last && j > (10 - b)) ? (o ? 'borrow-blue' : 'borrow-orange') : (o ? 'borrow-orange' : 'borrow-blue')}"></div>`; html += `</div>`; } return html; }
function genOnes(c, o) { if (c === 0) return ''; let html = `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) html += (j <= c) ? `<div class="crystal-item ${o ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; return html + `</div>`; }
function genSubCargo(t, o, a, s) { let base = (t * 10) + o, total = base + a, active = total - s, full = Math.floor(total / 10), rem = total % 10, g = 0, html = ''; for (let i = 0; i < full; i++) { html += `<div class="crystal-column">`; for (let j = 1; j <= 10; j++) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; } html += `</div>`; } if (rem > 0) { html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; } html += `</div>`; } return html; }
function genSubEmpty(e, a) { let total = e + a, full = Math.floor(total / 10), rem = total % 10, g = 0, html = ''; for (let i = 0; i < full; i++) { html += `<div class="crystal-column">`; for (let j = 1; j <= 10; j++) { g++; html += g <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } html += `</div>`; } if (rem > 0) { html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; } html += `</div>`; } return html; }
