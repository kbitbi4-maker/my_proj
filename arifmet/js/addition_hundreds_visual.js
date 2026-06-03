// version: v1.0
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { parseAdditionData } from './calculator.js';

export function renderAdditionHundredsVisual() {
    const item = state.examplesHistory[state.activeIndex]; if (!item) return;
    const report = state.validateCurrentInput();
    const data = parseAdditionData(item.exampleText, report);
    const cacheKey = `${item.exampleText}_add_hundreds_phase${report.phase}_${report.isFullySolved}`;
    let html = '', h1 = Math.floor(data.num1 / 100), h2 = Math.floor(data.num2 / 100);

    if (report.phase === 1) {
        const content1 = buildHLayout(h1, 0, genCols(data.tens1, false, 0) + genOnes(data.ones1, false), false);
        const content2 = buildHLayout(0, h2, genCols(data.tens2, true, 0) + genOnes(data.ones2, true), true);
        html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;">${content1}<div style="font-size:28px;font-weight:bold;color:#94a3b8;">+</div>${content2}</div>`;
    } 
    else if (report.phase === 2) {
        const borderGlow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : '';
        let curH1 = h1, curH2 = h2, leftCrimson = 0, rightPurple = 0;
        if (report.simText.includes('+')) {
            const parts = report.simText.split('+'), leftNum = parseInt(parts[0], 10), rightNum = parseInt(parts[1], 10);
            if (!isNaN(leftNum) && !isNaN(rightNum)) {
                curH1 = Math.floor(leftNum / 100); curH2 = Math.floor(rightNum / 100);
                if (curH1 > h1) leftCrimson = curH1 - h1; if (curH2 > h2) rightPurple = curH2 - h2;
                if (leftCrimson > 0) curH1 = h1; if (rightPurple > 0) curH2 = h2;
            }
        }
        const content1 = buildHLayout(curH1, leftCrimson, genCols(data.leftTens, false, data.leftBorrowCount) + genOnes(data.leftOnes, false), false);
        const content2 = buildHLayout(rightPurple, curH2, genCols(data.rightTens, true, data.rightBorrowCount) + genOnes(data.rightOnes, true), true);
        html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;animation:fadeIn 0.3s;${borderGlow}">${content1}<div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div>${content2}</div>`;
    } 
    else {
        let deckHTML = '', finalH1 = h1, finalH2 = h2;
        if (report.simText.includes('+')) {
            const parts = report.simText.split('+'), leftNum = parseInt(parts[0], 10), rightNum = parseInt(parts[1], 10);
            if (!isNaN(leftNum) && !isNaN(rightNum)) { finalH1 = Math.floor(leftNum / 100); finalH2 = Math.floor(rightNum / 100); if (finalH1 > h1) finalH1 = h1; }
        }
        if (data.rightBorrowCount > 0) deckHTML += genOnes(data.totalOnes, false) + genCols(data.tens1, false, 0) + genCols(data.tens2, true, 0) + genCols(1, true, data.rightBorrowCount);
        else if (data.leftBorrowCount > 0) deckHTML += genCols(data.tens1, false, 0) + genCols(1, false, data.leftBorrowCount) + genCols(data.tens2, true, 0) + genOnes(data.totalOnes, true);
        else deckHTML += genCols(data.tens1, false, 0) + genOnes(data.ones1, false) + genCols(data.tens2, true, 0) + genOnes(data.ones2, true);
        
        let hCrystals = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
        for (let i = 0; i < finalH1; i++) hCrystals += '<div class="hundred-crystal"></div>';
        for (let i = 0; i < (h1 + h2 - finalH1); i++) hCrystals += '<div class="hundred-crystal crimson"></div>';
        hCrystals += '</div>';
        const lAnim = report.isFullySolved ? 'add-robot-left-drive' : '', rAnim = report.isFullySolved ? 'add-robot-right-drive' : '';
        html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;"><div class="win-layout" style="display:flex;align-items:center;justify-content:center;position:relative;"><div class="${lAnim}"><div><span style="font-size:36px;line-height:1;">🤖</span></div></div><div class="crystal-deck" style="background:#f0fdf4;border-color:#4ade80;margin:0 10px;display:flex;flex-direction:column;gap:5px;min-width:140px;align-items:flex-start;padding:8px;">${hCrystals}<div style="display:flex;gap:4px;align-items:flex-end;">${deckHTML}</div></div><div class="${rAnim}"><div><span style="font-size:36px;line-height:1;">🤖</span></div></div></div><b style="color:#22c55e;font-size:14px;margin-top:8px;">${report.isFullySolved ? 'Ура! Сотни покорены! 🎉' : 'Проверяем ответ... 👀'}</b></div>`;
    }
    GameCanvas.renderZoneScene(html, cacheKey);
}

function buildHLayout(purple, crimson, sub, isO = false) {
    let h = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
    for (let i = 0; i < purple; i++) h += '<div class="hundred-crystal"></div>';
    for (let i = 0; i < crimson; i++) h += '<div class="hundred-crystal crimson"></div>';
    h += '</div>';
    const deck = `<div class="crystal-deck ${isO ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;">${h}<div style="display:flex;gap:4px;align-items:flex-end;">${sub}</div></div>`;
    return `<div class="crystal-truck">${isO ? deck + '<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div>' : '<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div>' + deck}</div>`;
}
function genCols(c, o, b) { let html = ''; for (let i = 0; i < c; i++) { html += `<div class="crystal-column">`; let last = (i === c - 1) && (b > 0); for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${(last && j > (10 - b)) ? (o ? 'borrow-blue' : 'borrow-orange') : (o ? 'borrow-orange' : 'borrow-blue')}"></div>`; html += `</div>`; } return html; }
function genOnes(c, o) { if (c === 0) return ''; let html = `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) html += (j <= c) ? `<div class="crystal-item ${o ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; return html + `</div>`; }

