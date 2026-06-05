// version: v1.4 - Fixed Proportional Cargo Counter and Drive Away
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { parseSubtractionData } from './calculator.js';

export function renderSubtractionVisual() {
 const item = state.examplesHistory[state.activeIndex]; if (!item) return;
 const report = state.validateCurrentInput();
 const data = parseSubtractionData(item.exampleText, report); 
 const cacheKey = `${item.exampleText}_phase${report.phase}_${report.isFullySolved}`;
 let html = '';
 if (report.phase === 1) {
 html = `<div class="sub-scene-container"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л (${data.num1})</b></div><div class="crystal-deck" style="border-color:#0284c7;">${generateSubCargoHTML(data.tens1, data.ones1, 0, 0)}</div><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П (${data.num2})</b></div><div class="crystal-deck" style="border:2px solid #000;background:rgba(0,0,0,0.03);">${generateSubEmptyCubesHTML(data.num2, 0)}</div></div>`;
 } 
 else if (report.phase === 2) {
 const borderColor = report.simCorrect ? '#22c55e' : '#0284c7', shadow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : '';
 html = `<div class="sub-scene-container" style="animation:fadeIn 0.3s;"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л</b></div><div class="crystal-deck" style="border-color:${borderColor};${shadow}">${generateSubCargoHTML(data.tens1, data.ones1, data.addedAmount, data.subtractedAmount)}</div><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П</b></div><div class="crystal-deck" style="border:2px solid #000;">${generateSubEmptyCubesHTML(data.num2 - data.subtractedAmount, data.addedAmount)}</div></div>`;
 } 
 else {
 const driveAwayClass = report.isFullySolved ? 'sub-drive-away' : '', labelText = report.isFullySolved ? 'Ура! Робот П уехал с правильным грузом! 🎉' : 'Проверяем ответ... 👀';
 html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;overflow:hidden;position:relative;"><div style="display:flex;align-items:center;justify-content:center;gap:20px;width:100%;"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л</b></div><div class="crystal-deck" style="border-color:#22c55e;">${generateSubCargoHTML(data.tens1, data.ones1, data.finalAddedAmount, data.currentSubtrahend)}</div><div class="${driveAwayClass}" style="display:flex;align-items:center;gap:20px;"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П</b></div><div class="crystal-deck" style="background:#e0f2fe;border-color:#ef4444;">${generateSubFinalCubesHTML(data.currentSubtrahend - data.finalAddedAmount, data.finalAddedAmount)}</div></div></div><b class="sub-win-text">${labelText}</b></div>`;
 }
 GameCanvas.renderZoneScene(html, cacheKey);
}

function generateSubCargoHTML(tens, ones, added, subtracted) {
 let baseCubes = (tens * 10) + ones;
 let totalCubes = Math.max(baseCubes, baseCubes + added);
 let activeCubes = (baseCubes + added) - subtracted;
 let fullCols = Math.floor(totalCubes / 10), remOnes = totalCubes % 10, globalCounter = 0, html = '';
 for (let i = 0; i < fullCols; i++) {
 html += `<div class="crystal-column">`;
 for (let j = 1; j <= 10; j++) { 
 globalCounter++; 
 if (globalCounter <= activeCubes) {
 html += globalCounter <= baseCubes ? `<div class="crystal-item"></div>` : `<div class="crystal-item borrow-orange"></div>`;
 } else {
 html += `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`;
 }
 }
 html += `</div>`;
 }
 if (remOnes > 0) {
 html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
 for (let j = 1; j <= 10; j++) { 
 if (j <= remOnes) { 
 globalCounter++; 
 if (globalCounter <= activeCubes) {
 html += globalCounter <= baseCubes ? `<div class="crystal-item"></div>` : `<div class="crystal-item borrow-orange"></div>`;
 } else {
 html += `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`;
 }
 } else {
 html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
 }
 }
 html += `</div>`;
 }
 return html;
}

function generateSubEmptyCubesHTML(emptyCount, addedOrange) {
 let total = emptyCount + addedOrange, fullCols = Math.floor(total / 10), remOnes = total % 10, globalCounter = 0, html = '';
 for (let i = 0; i < fullCols; i++) {
 html += `<div class="crystal-column">`;
 for (let j = 1; j <= 10; j++) { globalCounter++; html += globalCounter <= emptyCount ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; }
 html += `</div>`;
 }
 if (remOnes > 0) {
 html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
 for (let j = 1; j <= 10; j++) { if (j <= remOnes) { globalCounter++; html += globalCounter <= emptyCount ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; }
 html += `</div>`;
 }
 return html;
}

function generateSubFinalCubesHTML(blueCount, orangeCount) {
 let total = blueCount + orangeCount, fullCols = Math.floor(total / 10), remOnes = total % 10, globalCounter = 0, html = '';
 for (let i = 0; i < fullCols; i++) {
 html += `<div class="crystal-column">`;
 for (let j = 1; j <= 10; j++) { globalCounter++; html += `<div class="crystal-item ${globalCounter <= blueCount ? '' : 'borrow-orange'}"></div>`; }
 html += `</div>`;
 }
 if (remOnes > 0) {
 html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
 for (let j = 1; j <= 10; j++) { if (j <= remOnes) { globalCounter++; html += `<div class="crystal-item ${globalCounter <= blueCount ? '' : 'borrow-orange'}"></div>` ; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; }
 html += `</div>`;
 }
 return html;
}
