// version: v2.6 - Fixed renderTensVisual Export and self-import error
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
   if ((num1 % 10 + num2 % 10) > 10 && sum < (isHundreds ? 1000 : 100)) { text = `${num1}+${num2}`; correctValue = sum; break; }
  }
 } else {
  while (true) {
   num1 = Math.floor(Math.random() * max) + min; num2 = Math.floor(Math.random() * max) + min;
   if (num1 > num2 && num1 % 10 !== 0 && num2 % 10 !== 0) { text = `${num1}-${num2}`; correctValue = num1 - num2; break; }
  }
 }

 state.usedExamples.push(text);
 state.addExample({ exampleText: String(text), correctValue: correctValue, currentInput: '' });
 isAddition = !isAddition;
 
 GameCanvas.clearZone();
 GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getTensHistoryHTML);
}

export function renderTensVisual() {
 if (state.activeIndex === -1 || state.currentMode === 'hundreds') return GameCanvas.clearZone();
 const isAdd = state.examplesHistory[state.activeIndex].exampleText.includes('+');
 if (isAdd) renderAdditionVisual(); else renderSubtractionVisual();
}

export function getTensHistoryHTML(item, index, mode) {
 const isHundreds = (mode === 'hundreds' || state.currentMode === 'hundreds');
 const finText = item.currentInput || '';
 const report = state.validateCurrentInput(index);

 if (!isHundreds || index !== state.activeIndex) {
  const isCorrect = (parseInt(finText, 10) === item.correctValue);
  const ansClass = isCorrect ? 'block-correct' : 'block-incorrect';
  let html = ` = <span class="${finText ? ansClass : 'block'}">${finText || '_'}</span>`;
  return { simHTML: html, finHTML: '' };
 }

 const op = item.exampleText.includes('+') ? '+' : '-';
 const isCorrect = (parseInt(finText, 10) === item.correctValue);
 const ansClass = finText.length >= String(item.correctValue).length ? (isCorrect ? 'block-correct' : 'block-incorrect') : 'block';
 
 const combinedHTML = buildColumnTable(item, index, op, finText, ansClass);
 return { simHTML: combinedHTML, finHTML: '' };
}
