// version: v2.2 - Hard Isolated String Generation For Pure Examples
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { buildColumnTable } from './column_helper.js';
import { renderAdditionVisual } from './addition_visual.js';
import { renderSubtractionVisual } from './subtraction_visual.js';

let isAddition = true;

export function initTensMode() {
 const isHundreds = state.currentMode === 'hundreds';
 document.querySelector('.header-menu-btn').innerText = isHundreds ? 'Режим: Сотни 🏔️ ▼' : 'Режим: Десятки ▼';
 const gameZone = document.getElementById('game-zone');
 if (gameZone) {
  gameZone.style.display = isHundreds ? 'none' : 'flex';
  document.querySelector('.game-workspace').style.height = isHundreds ? '100%' : '68%';
 }
 generateExample();
}

export function generateExample() {
 if (state.currentMode !== 'tens' && state.currentMode !== 'mix' && state.currentMode !== 'hundreds') return;
 if (!state.usedExamples) state.usedExamples = [];
 let num1, num2, correctValue, text = '';
 const isHundreds = state.currentMode === 'hundreds';
 const min = isHundreds ? 100 : 10, max = isHundreds ? 900 : 90;
 if (isAddition) {
  while (true) {
   num1 = Math.floor(Math.random() * max) + min; num2 = Math.floor(Math.random() * max) + min;
   let sum = num1 + num2;
   if ((num1 % 10 + num2 % 10) > 10 && sum < (isHundreds ? 1000 : 100)) { 
    text = `${num1}+${num2}`; if (!state.usedExamples.includes(text)) { correctValue = sum; break; } 
   }
  }
 } else {
  while (true) {
   num1 = Math.floor(Math.random() * max) + min; num2 = Math.floor(Math.random() * max) + min;
   if (num1 > num2 && num1 % 10 !== 0 && num2 % 10 !== 0) { 
    text = `${num1}-${num2}`; if (!state.usedExamples.includes(text)) { correctValue = num1 - num2; break; } 
   }
  }
 }
 state.usedExamples.push(text);
 state.addExample({ exampleText: String(text).trim(), correctValue: correctValue, currentInput: '' });
 isAddition = !isAddition;
 GameCanvas.clearZone();
 GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getTensHistoryHTML);
}

export function renderTensVisual() {
 if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return GameCanvas.clearZone();
 if (state.currentMode === 'hundreds') return GameCanvas.clearZone();
 const isAdd = state.examplesHistory[state.activeIndex].exampleText.includes('+');
 if (isAdd) renderAdditionVisual(); else renderSubtractionVisual();
}

export function getTensHistoryHTML(item, index, mode) {
 const isHundreds = (mode === 'hundreds' || state.currentMode === 'hundreds');
 const rawInput = item.currentInput || '';
 const parts = rawInput.split('=');
 const finText = parts.length > 1 ? parts[1] : '';
 const report = state.validateCurrentInput(index);

 if (!isHundreds) {
  let simHTML = ` = <span class="block">${rawInput || '_'}</span>`;
  if (rawInput.includes('=')) simHTML = ` = <span class="block ${report.simCorrect ? 'block-correct' : 'block-incorrect'}">${parts[0]}</span>`;
  return { simHTML, finHTML: '' };
 }

 const op = item.exampleText.includes('+') ? '+' : '-';
 let ansClass = 'block';
 if (rawInput.includes('=') && finText.length >= String(item.correctValue).length) {
  ansClass = report.finCorrect ? 'block-correct' : 'block-incorrect';
 }
 
 const combinedHTML = buildColumnTable(item, index, op, finText, ansClass);
 return { simHTML: combinedHTML, finHTML: '' };
}
