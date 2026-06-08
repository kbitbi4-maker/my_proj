// version: v3.0 - Fully Encapsulated Hundreds Column Game Engine
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { triggerTensWinSound, resetAllFeedbacks, soundFlags } from './feedback.js';

let isAddition = true;

if (!window.changeHundredsCarry) {
 window.changeHundredsCarry = (carryIdx, delta) => {
  const item = state.examplesHistory[state.activeIndex];
  if (!item || !item.userCarries) return;
  let val = item.userCarries[carryIdx] + delta;
  item.userCarries[carryIdx] = val < 0 ? 9 : (val > 9 ? 0 : val);
  renderHundredsWorkspace();
 };
}

export function initHundredsColumnMode() {
 document.querySelector('.header-menu-btn').innerText = 'Режим: Сотни 🏔️ ▼';
 const gameZone = document.getElementById('game-zone');
 if (gameZone) {
  gameZone.style.display = 'none';
  document.querySelector('.game-workspace').style.height = '100%';
 }
 generateHundredsExample();
}

function generateHundredsExample() {
 if (!state.usedExamples) state.usedExamples = [];
 let num1, num2, correctValue, text = '';
 const min = 100, max = 900;
 
 while (true) {
  num1 = Math.floor(Math.random() * max) + min;
  num2 = Math.floor(Math.random() * max) + min;
  if (isAddition) {
   let sum = num1 + num2;
   if ((num1 % 10 + num2 % 10) > 10 && sum < 10000) { text = `${num1}+${num2}`; correctValue = sum; break; }
  } else {
   if (num1 > num2 && num1 % 10 !== 0 && num2 % 10 !== 0) { text = `${num1}-${num2}`; correctValue = num1 - num2; break; }
  }
 }
 state.usedExamples.push(text);
 state.addExample({ exampleText: text, correctValue: correctValue, currentInput: '', userCarries: Array(5).fill(0) });
 isAddition = !isAddition;
 renderHundredsWorkspace();
}

export function pressHundredsNum(n) {
 if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
 const item = state.examplesHistory[state.activeIndex];

 if (n === 'C' || n === 'D') {
  if (n === 'C') item.currentInput = '';
  else item.currentInput = item.currentInput.slice(0, -1);
  resetAllFeedbacks();
 } else if (n !== '=') {
  item.currentInput += n;
 }

 const validationStr = `${item.exampleText}=${item.currentInput}`;
 const report = state.validateCurrentInput(validationStr);
 if (report.isFullySolved && !soundFlags.finWinSoundPlayed) {
  triggerTensWinSound();
  soundFlags.finWinSoundPlayed = true;
 }
 renderHundredsWorkspace();
}

function renderHundredsWorkspace() {
 const historyContainer = document.querySelector('.game-history');
 if (!historyContainer || state.activeIndex === -1) return;
 historyContainer.innerHTML = '';

 state.examplesHistory.forEach((item, index) => {
  const row = document.createElement('div');
  row.className = `history-item ${index === state.activeIndex ? 'active' : ''}`;
  
  if (index !== state.activeIndex) {
   const isCorrect = (parseInt(item.currentInput, 10) === item.correctValue);
   row.innerHTML = `${item.exampleText} = <span class="${item.currentInput ? (isCorrect ? 'block-correct' : 'block-incorrect') : 'block'}">${item.currentInput || '_'}</span>`;
  } else {
   row.innerHTML = buildColumnHTML(item);
  }
  historyContainer.appendChild(row);
  if (index === state.activeIndex) row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
 });
}

function buildColumnHTML(item) {
 const op = item.exampleText.includes('+') ? '+' : '-';
 const nums = item.exampleText.split(op);
 const maxDigits = Math.max(nums[0].length, nums[1].length, String(item.correctValue).length);
 const totalCols = maxDigits + 1;

 const padNum1 = nums[0].padStart(totalCols, ' ').split('');
 const padNum2 = nums[1].padStart(totalCols, ' ').split('');
 let ansCells = Array(totalCols).fill(' ');
 item.currentInput.split('').forEach((digit, i) => { if (totalCols - 1 - i >= 0) ansCells[totalCols - 1 - i] = digit; });

 const isCorrect = (parseInt(item.currentInput, 10) === item.correctValue);
 const ansClass = item.currentInput.length >= String(item.correctValue).length ? (isCorrect ? 'block-correct' : 'block-incorrect') : 'block';

 let html = `<div style="display: flex; align-items: center; gap: 15px; font-family: monospace; font-size: 3.5vh; font-weight: bold; user-select: none; width: 100%;"><div style="white-space: nowrap;">${item.exampleText} =</div><div style="display: flex;">`;
 for (let i = 0; i < totalCols; i++) {
  const val = item.userCarries[i] || 0;
  html += `<div style="display: flex; flex-direction: column; align-items: center; width: 4.5vh; text-align: center; line-height: 1.1;">`;
  if (i === totalCols - 1) html += `<div style="height: 5.5vh;">&nbsp;</div>`;
  else html += `<div style="font-size: 1.4vh; color: #a855f7; display: flex; flex-direction: column; align-items: center; height: 5.5vh; justify-content: center;"><div style="cursor: pointer; color: #3b82f6;" onclick="window.changeHundredsCarry(${i}, 1)">▲</div><div style="font-size: 2vh; min-height: 2vh;">${val === 0 ? '&nbsp;' : val}</div><div style="cursor: pointer; color: #ef4444;" onclick="window.changeHundredsCarry(${i}, -1)">▼</div></div>`;
  html += `<div style="height: 4vh; display: flex; align-items: center;">${padNum1[i] === ' ' ? '&nbsp;' : padNum1[i]}</div>`;
  html += `<div style="height: 4vh; display: flex; align-items: center; ${i === 0 ? '' : 'border-bottom: 4px solid #333;'} width: 100%; justify-content: center;">${i === 0 ? op : (padNum2[i] === ' ' ? '&nbsp;' : padNum2[i])}</div>`;
  html += `<div class="${ansCells[i] === ' ' ? '' : ansClass}" style="height: 5vh; display: flex; align-items: center; justify-content: center; color: ${ansCells[i] === ' ' ? '#ccc' : 'inherit'}; width: 100%; border-top: ${i === 0 ? '4px solid #333' : 'none'};">${ansCells[i] === ' ' ? '_' : ansCells[i]}</div></div>`;
 }
 return html + `</div></div>`;
}
