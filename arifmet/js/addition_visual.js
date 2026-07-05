// version: v1.1
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { parseAdditionData } from './calculator.js';

export function renderAdditionVisual() {
    const item = state.examplesHistory[state.activeIndex]; if (!item) return;
    const report = state.validateCurrentInput();
    const data = parseAdditionData(item.exampleText, report); // Запрос к калькулятору!
    const cacheKey = `${item.exampleText}_phase${report.phase}_${report.isFullySolved}`;
    let html = '';

    if (report.phase === 1) {
        const truck1 = buildTruckHTML(data.num1, '#0284c7', generateCrystalColumnsHTML(data.tens1, false, 0) + generateOnesHTML(data.ones1, false), 'margin-left:10px;');
        const truck2 = buildTruckHTML(data.num2, '#ea580c', generateCrystalColumnsHTML(data.tens2, true, 0) + generateOnesHTML(data.ones2, true), 'margin-left:10px;', true);
        html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;">${truck1}<div style="font-size:28px;font-weight:bold;color:#94a3b8;">+</div>${truck2}</div>`;
    } 
    else if (report.phase === 2) {
        const borderGlow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : '';
        const truck1 = buildTruckHTML(data.leftLabel, '#22c55e', generateCrystalColumnsHTML(data.leftTens, false, data.leftBorrowCount) + generateOnesHTML(data.leftOnes, false), `margin-left:10px;${borderGlow}`);
        const truck2 = buildTruckHTML(data.rightLabel, '#ea580c', generateCrystalColumnsHTML(data.rightTens, true, data.rightBorrowCount) + generateOnesHTML(data.rightOnes, true), `margin-right:10px;${report.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : ''}`, true);
        html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;animation:fadeIn 0.3s;">${truck1}<div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div>${truck2}</div>`;
    } 
    else {
        let deckContentHTML = '';
        if (data.rightBorrowCount > 0) {
            deckContentHTML += generateOnesHTML(data.totalOnes, false) + generateCrystalColumnsHTML(data.tens1, false, 0) + generateCrystalColumnsHTML(data.tens2, true, 0) + generateCrystalColumnsHTML(1, true, data.rightBorrowCount);
        } else if (data.leftBorrowCount > 0) {
            deckContentHTML += generateCrystalColumnsHTML(data.tens1, false, 0) + generateCrystalColumnsHTML(1, false, data.leftBorrowCount) + generateCrystalColumnsHTML(data.tens2, true, 0) + generateOnesHTML(data.totalOnes, true);
        } else {
            deckContentHTML += generateCrystalColumnsHTML(data.tens1, false, 0) + generateOnesHTML(data.ones1, false) + generateCrystalColumnsHTML(data.tens2, true, 0) + generateOnesHTML(data.ones2, true);
        }        
        const lAnim = report.isFullySolved ? 'add-robot-left-drive' : '', rAnim = report.isFullySolved ? 'add-robot-right-drive' : '';
        const jumpL = report.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate;' : '', jumpR = report.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate-reverse;' : '';
        html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;"><div class="win-layout" style="display:flex;align-items:center;justify-content:center;position:relative;"><div class="${lAnim}"><div style="${jumpL}"><span style="font-size:36px;line-height:1;">🤖</span></div></div><div class="crystal-deck" style="background:#f0fdf4;border-color:#4ade80;margin:0 10px;">${deckContentHTML}</div><div class="${rAnim}"><div style="${jumpR}"><span style="font-size:36px;line-height:1;">🤖</span></div></div></div><b style="color:#22c55e;font-size:14px;margin-top:8px;">${report.isFullySolved ? 'Ура! Ответ верный! Ты гений! 🎉' : 'Проверяем ответ... 👀'}</b></div>`;
    }
    GameCanvas.renderZoneScene(html, cacheKey);
}

function buildTruckHTML(label, color, deckHTML, deckStyle, isOrange = false) {
    const robot = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${color};font-size:13px;margin-top:1px;">${label}</b></div>`;
    return `<div class="crystal-truck">${isOrange ? `<div class="crystal-deck orange-theme" style="${deckStyle}">${deckHTML}</div>` + robot : robot + `<div class="crystal-deck" style="${deckStyle}">${deckHTML}</div>`}</div>`;
}

function generateCrystalColumnsHTML(count, isOrange, borrow) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-column">`; let isLast = (i === count - 1) && (borrow > 0);
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${(isLast && j > (10 - borrow)) ? (isOrange ? 'borrow-blue' : 'borrow-orange') : (isOrange ? 'borrow-orange' : 'borrow-blue')}"></div>`;
        html += `</div>`;
    }
    return html;
}

function generateOnesHTML(count, isOrange) {
    if (count === 0) return '';
    let html = `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
    for (let j = 1; j <= 10; j++) html += (j <= count) ? `<div class="crystal-item ${isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
    return html + `</div>`;
}
