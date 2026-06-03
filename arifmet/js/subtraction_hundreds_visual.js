// version: v1.1
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { parseSubtractionData } from './calculator.js';

export function renderSubtractionHundredsVisual() {
    const item = state.examplesHistory[state.activeIndex]; if (!item) return;
    const report = state.validateCurrentInput();
    const data = parseSubtractionData(item.exampleText, report);
    const cacheKey = `${item.exampleText}_sub_hundreds_phase${report.phase}_${report.isFullySolved}`;
    let html = '', h1 = Math.floor(data.num1 / 100), h2 = Math.floor(data.num2 / 100);

    if (report.phase === 1) {
        const content1 = buildSubHLayout(h1, 0, 0, genSubCargo(data.tens1, data.ones1, 0, 0), false);
        const content2 = buildSubHLayout(0, h2, 0, genSubEmpty(data.num2, 0), true);
        html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;">${content1}<div style="font-size:28px;font-weight:bold;color:#94a3b8;">-</div>${content2}</div>`;
    } 
    else if (report.phase === 2) {
        let curH1 = h1, curH2 = Math.floor(data.currentSubtrahend / 100);
        if (report.simText.includes('-')) {
            const parts = report.simText.split('-'), leftNum = parseInt(parts[0], 10);
            if (!isNaN(leftNum)) curH1 = Math.floor(leftNum / 100);
        }
        const borderColor = report.simCorrect ? '#22c55e' : '#0284c7', shadow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : '';
        html = `<div class="sub-scene-container" style="animation:fadeIn 0.3s;"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div><div class="crystal-deck" style="border-color:${borderColor};${shadow}">${buildSubHLayout(curH1, 0, 0, genSubCargo(data.tens1, data.ones1, data.addedAmount, data.subtractedAmount), false, true)}</div><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span></div><div class="crystal-deck" style="border:2px solid #000;">${buildSubHLayout(0, curH2, 0, genSubEmpty(data.num2 - data.subtractedAmount, data.addedAmount), true, true)}</div></div>`;
    } 
    else {
        let deckHTML = genSubCargo(data.tens1, data.ones1, 0, data.currentSubtrahend);
        let finalH1 = Math.floor((data.num1 - data.num2) / 100);
        let hCrystals = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
        for (let i = 0; i < finalH1; i++) hCrystals += '<div class="hundred-crystal"></div>';
        hCrystals += '</div>';
        const lAnim = report.isFullySolved ? 'add-robot-left-drive' : '', rAnim = report.isFullySolved ? 'add-robot-right-drive' : '';
        html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;"><div class="win-layout" style="display:flex;align-items:center;justify-content:center;position:relative;"><div class="${lAnim}"><div><span style="font-size:36px;line-height:1;">🤖</span></div></div><div class="crystal-deck" style="background:#f0fdf4;border-color:#4ade80;margin:0 10px;display:flex;flex-direction:column;gap:5px;min-width:140px;align-items:flex-start;padding:8px;">${hCrystals}<div style="display:flex;gap:4px;align-items:flex-end;">${deckHTML}</div></div><div class="${rAnim}"><div><span style="font-size:36px;line-height:1;">🤖</span></div></div></div><b style="color:#22c55e;font-size:14px;margin-top:8px;">${report.isFullySolved ? 'Ура! Сотни покорены! 🎉' : 'Проверяем ответ... 👀'}</b></div>`;
    }
    GameCanvas.renderZoneScene(html, cacheKey);
}

function buildSubHLayout(purple, crimson, mixed, sub, isO = false, flat = false) {
    let h = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
    for (let i = 0; i < purple; i++) h += '<div class="hundred-crystal"></div>';
    for (let i = 0; i < crimson; i++) h += '<div class="hundred-crystal crimson"></div>';
    for (let i = 0; i < mixed; i++) h += '<div class="hundred-crystal mixed"></div>';
    h += '</div>'; if (flat) return `${h}<div style="display:flex;gap:4px;align-items:flex-end;">${sub}</div>`;
    const deck = `<div class="crystal-deck ${isO ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;">${h}<div style="display:flex;gap:4px;align-items:flex-end;">${sub}</div></div>`;
    return `<div class="crystal-truck">${isO ? deck + '🤖' : '🤖' + deck}</div>`;
}
function genSubCargo(t, o, a, s) { let base = (t * 10) + o, total = base + a, active = total - s, full = Math.floor(total / 10), rem = total % 10, g = 0, html = ''; for (let i = 0; i < full; i++) { html += `<div class="crystal-column">`; for (let j = 1; j <= 10; j++) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; } html += `</div>`; } if (rem > 0) { html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; } html += `</div>`; } return html; }
function genSubEmpty(e, a) { let total = e + a, full = Math.floor(total / 10), rem = total % 10, g = 0, html = ''; for (let i = 0; i < full; i++) { html += `<div class="crystal-column">`; for (let j = 1; j <= 10; j++) { g++; html += g <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } html += `</div>`; } if (rem > 0) { html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; } html += `</div>`; } return html; }
