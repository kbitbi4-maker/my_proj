// version: v2.0 - Fixed Left Robot Zero Remainder Condition in Phase 2
import { state } from './state.js'; 
import { GameCanvas } from './game_canvas.js'; 
import { parseSubtractionData } from './calculator.js';

export function renderSubtractionHundredsVisual() {
 const item = state.examplesHistory[state.activeIndex]; if (!item) return;
 const report = state.validateCurrentInput(), data = parseSubtractionData(item.exampleText, report), cacheKey = `${item.exampleText}_sub_hundreds_phase${report.phase}_${report.isFullySolved}`;
 let html = '', h1 = Math.floor(data.num1 / 100), h2 = Math.floor(data.num2 / 100), cleanN2 = data.num2 % 100;
 const rL = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л</b></div>`;
 const rR = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П</b></div>`;
 
 if (report.phase === 1) {
 const d1 = `<div class="crystal-deck" style="border-color:#0284c7;">${buildSubHLayout(h1, 0, 0, genSubCargo(data.tens1, data.ones1, 0, 0))}</div>`;
 const d2 = `<div class="crystal-deck" style="border:2px solid #000;background:rgba(0,0,0,0.03);">${buildSubHLayout(0, 0, h2, genSubEmpty(cleanN2, 0))}</div>`;
 html = `<div class="sub-scene-container">${rL}${d1}<div style="font-size:28px;font-weight:bold;color:#94a3b8;">-</div>${d2}${rR}</div>`;
 } else if (report.phase === 2) {
 let curH1 = h1, curH2 = h2, userSubH = 0, isRightZeroRemainder = false, isLeftZeroRemainder = false, leftMixed = 0;
 if (report.simText.includes('-')) {
 const partsArr = report.simText.split('-');
 if (partsArr.length === 2) {
 const leftNum = parseInt(partsArr, 0);
 const rightNum = parseInt(partsArr, 10);
 if (!isNaN(leftNum)) {
 curH1 = Math.floor(leftNum / 100);
 if (leftNum > data.num1 && curH1 > h1) { leftMixed = curH1 - h1; curH1 = h1; }
 if (leftNum % 100 === 0) { isLeftZeroRemainder = true; }
 }
 if (!isNaN(rightNum)) { 
 userSubH = h2 - Math.floor(rightNum / 100); 
 curH2 = Math.floor(rightNum / 100); 
 if (rightNum % 100 === 0) { isRightZeroRemainder = true; }
 }
 }
 }
 const borderColor = report.simCorrect ? '#22c55e' : '#0284c7', shadow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : '';
 
 // Условие: если у левого робота ровные сотни, мелкие кубики скрываем
 const leftSubHTML = isLeftZeroRemainder ? '' : genSubCargo(data.tens1, data.ones1, data.addedAmount, data.subtractedAmount);
 const d1 = `<div class="crystal-deck" style="border-color:${borderColor};${shadow}">${buildSubHLayout(curH1, leftMixed, 0, leftSubHTML)}</div>`;
 
 // Условие: если у отнимателя не остается десятков и единиц, мелкие занятые/пустые блоки не дорисовываем
 const rightSubHTML = isRightZeroRemainder ? '' : genSubEmpty(cleanN2 - data.subtractedAmount, data.addedAmount);
 const d2 = `<div class="crystal-deck" style="border:2px solid #000;">${buildSubHLayout(0, 0, curH2, rightSubHTML)}</div>`;
 
 html = `<div class="sub-scene-container" style="animation:fadeIn 0.3s;">${rL}${d1}<div style="font-size:24px;font-weight:bold;color:#22c55e;">-</div>${d2}${rR}</div>`;
 } else {
 let finalRemainder = (data.num1 - data.num2) % 100;
 let remTens = Math.floor(finalRemainder / 10);
 let remOnes = finalRemainder % 10;
 
 let deckHTML = genSubCargo(remTens, remOnes, 0, 0);
 let finalH1 = Math.floor((data.num1 - data.num2) / 100);
 
 let hCrystals = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
 for (let i = 0; i < finalH1; i++) hCrystals += '<div class="hundred-crystal"></div>';
 hCrystals += '</div>';
 
 const driveAwayClass = report.isFullySolved ? 'sub-drive-away' : '', labelText = report.isFullySolved ? 'Ура! Робот П уехал с правильным грузом! 🎉' : 'Проверяем ответ... 👀';
 const finalDeck = `<div class="crystal-deck" style="background:#e0f2fe;border-color:#ef4444;">${hCrystals}<div style="display:flex;gap:4px;align-items:flex-end;">${deckHTML}</div></div>`;
 html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;overflow:hidden;position:relative;"><div style="display:flex;align-items:center;justify-content:center;gap:20px;width:100%;">${rL}<div class="crystal-deck" style="border-color:#22c55e;">${buildSubHLayout(finalH1, 0, 0, genSubCargo(remTens, remOnes, 0, 0))}</div><div class="${driveAwayClass}" style="display:flex;align-items:center;gap:20px;">${rR}${finalDeck}</div></div><b class="sub-win-text">${labelText}</b></div>`;
 }
 GameCanvas.renderZoneScene(html, cacheKey);
}

function buildSubHLayout(p, c, e, sub) {
 let h = '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">';
 for (let i = 0; i < p; i++) h += '<div class="hundred-crystal"></div>';
 for (let i = 0; i < c; i++) h += '<div class="hundred-crystal mixed"></div>'; // Рендерим заем как mixed (смешанный) кристалл сотни
 for (let i = 0; i < e; i++) h += '<div class="hundred-crystal empty"></div>';
 return h + `</div><div style="display:flex;gap:4px;align-items:flex-end;">${sub}</div>`;
}

function genSubCargo(t, o, a, s) {
 let base = (t * 10) + o, total = base + a, active = total - s, full = Math.floor(total / 10), rem = total % 10, html = '';
 for (let i = 0; i < full; i++) {
 html += `<div class="crystal-column">`;
 for (let j = 1; j <= 10; j++) {
 let currentId = (i * 10) + j;
 html += currentId <= active ? `<div class="${currentId <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`;
 }
 html += `</div>`;
 }
 if (rem > 0) {
 html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
 for (let j = 1; j <= 10; j++) {
 if (j <= rem) {
 let currentId = (full * 10) + j;
 html += currentId <= active ? `<div class="${currentId <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`;
 } else {
 html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
 }
 }
 html += `</div>`;
 }
 return html;
}

function genSubEmpty(e, a) {
 if (e <= 0 && a <= 0) return '';
 let total = e + a, full = Math.floor(total / 10), rem = total % 10, html = '';
 for (let i = 0; i < full; i++) {
 html += `<div class="crystal-column">`;
 for (let j = 1; j <= 10; j++) {
 let currentId = (i * 10) + j;
 html += currentId <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`;
 }
 html += `</div>`;
 }
 if (rem > 0) {
 html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
 for (let j = 1; j <= 10; j++) {
 if (j <= rem) {
 let currentId = (full * 10) + j;
 html += currentId <= e ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`;
 } else {
 html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
 }
 }
 html += `</div>`;
 }
 return html;
}
