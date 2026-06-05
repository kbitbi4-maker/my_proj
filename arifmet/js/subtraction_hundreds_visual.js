// version: v1.5 - Fixed Hundreds Destruction and Bounds Mapping
import { state } from './state.js'; 
import { GameCanvas } from './game_canvas.js'; 
import { parseSubtractionData } from './calculator.js';

export function renderSubtractionHundredsVisual() {
 const item = state.examplesHistory[state.activeIndex]; if (!item) return;
 const report = state.validateCurrentInput(), data = parseSubtractionData(item.exampleText, report), cacheKey = `${item.exampleText}_sub_hundreds_phase${report.phase}_${report.isFullySolved}`;
 let html = '', h1 = Math.floor(data.num1 / 100), h2 = Math.floor(data.num2 / 100), cleanN2 = data.num2 % 100, cleanSub = data.currentSubtrahend % 100;
 const rL = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л</b></div>`;
 const rR = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П</b></div>`;
 
 if (report.phase === 1) {
 const d1 = `<div class="crystal-deck" style="border-color:#0284c7;">${buildSubHLayout(h1, 0, 0, genSubCargo(data.tens1, data.ones1, 0, 0))}</div>`;
 const d2 = `<div class="crystal-deck" style="border:2px solid #000;background:rgba(0,0,0,0.03);">${buildSubHLayout(0, 0, h2, genSubEmpty(cleanN2, 0))}</div>`;
 html = `<div class="sub-scene-container">${rL}${d1}<div style="font-size:28px;font-weight:bold;color:#94a3b8;">-</div>${d2}${rR}</div>`;
 } else if (report.phase === 2) {
 let curH1 = h1, curH2 = Math.floor(data.currentSubtrahend / 100), userSubH = 0;
 if (report.simText.includes('-')) {
 const partsArr = report.simText.split('-');
 const leftNum = parseInt(partsArr[0], 10);
 const rightNum = parseInt(partsArr[1], 10);
 if (!isNaN(leftNum)) curH1 = Math.floor(leftNum / 100);
 if (!isNaN(rightNum)) { userSubH = h2 - Math.floor(rightNum / 100); curH2 = 0; }
 }
 const borderColor = report.simCorrect ? '#22c55e' : '#0284c7', shadow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : '';
 const d1 = `<div class="crystal-deck" style="border-color:${borderColor};${shadow}">${buildSubHLayout(curH1, userSubH, 0, genSubCargo(data.tens1, data.ones1, data.addedAmount, data.subtractedAmount))}</div>`;
 const d2 = `<div class="crystal-deck" style="border:2px solid #000;">${buildSubHLayout(0, 0, curH2, genSubEmpty(cleanN2 - data.subtractedAmount, data.addedAmount))}</div>`;
 html = `<div class="sub-scene-container" style="animation:fadeIn 0.3s;">${rL}${d1}<div style="font-size:24px;font-weight:bold;color:#22c55e;">-</div>${d2}${rR}</div>`;
 } else {
 let deckHTML = genSubCargo(data.tens1, data.ones1, 0, cleanSub), finalH1 = Math.floor((data.num1 - data.num2) / 100);
 let hCrystals = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
 for (let i = 0; i < finalH1; i++) hCrystals += '<div class="hundred-crystal"></div>';
 hCrystals += '</div>';
 const driveAwayClass = report.isFullySolved ? 'sub-drive-away' : '', labelText = report.isFullySolved ? 'Ура! Робот П уехал с правильным грузом! 🎉' : 'Проверяем ответ... 👀';
 const finalDeck = `<div class="crystal-deck" style="background:#e0f2fe;border-color:#ef4444;">${hCrystals}<div style="display:flex;gap:4px;align-items:flex-end;">${deckHTML}</div></div>`;
 html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;overflow:hidden;position:relative;"><div style="display:flex;align-items:center;justify-content:center;gap:20px;width:100%;">${rL}<div class="crystal-deck" style="border-color:#22c55e;">${buildSubHLayout(finalH1, 0, 0, genSubCargo(data.tens1, data.ones1, 0, cleanSub))}</div><div class="${driveAwayClass}" style="display:flex;align-items:center;gap:20px;">${rR}${finalDeck}</div></div><b class="sub-win-text">${labelText}</b></div>`;
 }
 GameCanvas.renderZoneScene(html, cacheKey);
}

function buildSubHLayout(p, c, e, sub) {
 let h = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
 for (let i = 0; i < p; i++) h += '<div class="hundred-crystal"></div>';
 for (let i = 0; i < c; i++) h += '<div class="hundred-crystal crimson"></div>';
 for (let i = 0; i < e; i++) h += '<div class="hundred-crystal empty"></div>';
 return h + `</div><div style="display:flex;gap:4px;align-items:flex-end;">${sub}</div>`;
}

function genSubCargo(t, o, a, s) { let base = (t * 10) + o, total = base + a, active = total - s, full = Math.floor(total / 10), rem = total % 10, g = 0, html = ''; for (let i = 0; i < full; i++) { html += `<div class="crystal-column">`; for (let j = 1; j <= 10; j++) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; } html += `</div>`; } if (rem > 0) { html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; } html += `</div>`; } return html; }
function genSubEmpty(e, a) { let total = e + a, full = Math.floor(total / 10), rem = total % 10, g = 0, html = ''; for (let i = 0; i < full; i++) { html += `<div class="crystal-column">`; for (let j = 1; j <= 10; j++) { g++; html += g <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } html += `</div>`; } if (rem > 0) { html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; } html += `</div>`; } return html; }
