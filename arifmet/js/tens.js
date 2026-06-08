// version: v1.0 - Restored Pure Original File Clean Setup
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { renderAdditionVisual } from './addition_visual.js';
import { renderSubtractionVisual } from './subtraction_visual.js';

let isAddition = true;

export function initTensMode() {
 document.querySelector('.header-menu-btn').innerText = 'Режим: Десятки ▼';
 const gameZone = document.getElementById('game-zone');
 if (gameZone) {
  gameZone.style.display = 'flex';
  document.querySelector('.game-workspace').style.height = '68%';
 }
 generateExample();
}

export function generateExample() {
 if (state.currentMode !== 'tens' && state.currentMode !== 'mix') return;
 if (!state.usedExamples) state.usedExamples = [];
 let num1, num2, correctValue, text;
 if (isAddition) {
  while (true) {
   num1 = Math.floor(Math.random() * 90) + 10; num2 = Math.floor(Math.random() * 90) + 10;
   let sum = num1 + num2;
   if ((num1 % 10 + num2 % 10) > 10 && sum < 100) { 
    text = `${num1}+${num2}`; if (!state.usedExamples.includes(text)) { correctValue = sum; break; } 
   }
  }
 } else {
  while (true) {
   num1 = Math.floor(Math.random() * 90) + 10; num2 = Math.floor(Math.random() * 90) + 10;
   if (num1 > num2 && num1 % 10 !== 0 && num2 % 10 !== 0) { 
    text = `${num1}-${num2}`; if (!state.usedExamples.includes(text)) { correctValue = num1 - num2; break; } 
   }
  }
 }
 state.usedExamples.push(text);
 state.addExample({ exampleText: text, correctValue: correctValue, currentInput: '' });
 isAddition = !isAddition;
 GameCanvas.clearZone();
 GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getTensHistoryHTML);
}

export function renderTensVisual() {
 if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return GameCanvas.clearZone();
 const isAdd = state.examplesHistory[state.activeIndex].exampleText.includes('+');
 if (isAdd) renderAdditionVisual(); else renderSubtractionVisual();
}

export function getTensHistoryHTML(item, index, mode) {
 const parts = item.currentInput.split('='), simText = parts[0] || '', finText = parts[1] || '';
 const report = state.validateCurrentInput(index);
 let simHTML = ` = <span class="block">${simText || '_'}</span>`;
 if (item.currentInput.includes('=')) simHTML = ` = <span class="block ${report.simCorrect ? 'block-correct' : 'block-incorrect'}">${simText || '?'}</span>`;
 let finHTML = '';
 if (parts.length > 1) {
  if (finText.trim().length >= String(item.correctValue).length) finHTML = ` = <span class="block ${report.finCorrect ? 'block-correct' : 'block-incorrect'}">${finText}</span>`;
  else finHTML = ` = <span class="block">${finText || '_'}</span>`;
 }
 return { simHTML, finHTML };
}
