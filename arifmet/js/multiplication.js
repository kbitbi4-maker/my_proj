// version: v1.3.1 (Хирургическая чистка синтаксиса размеров)  
import { state } from './state.js';  
import { GameCanvas } from './game\_canvas.js';  
import { parseMultiplicationData } from './calculator.js';

export function initMultiplicationMode() {  
document.querySelector('.header-menu-btn').innerText = '\\u0420\\u0435\\u0436\\u0438\\u043C: \\u0423\\u043C\\u043D\\u043E\\u0436\\u0435\\u043D\\u0438\\u0435 \\uD83C\\uDF55 \\u25BC';  
generateMultiExample();  
}

export function generateMultiExample() {  
if (!state.usedExamples) state.usedExamples = \[\];  
let num1, num2, text;  
while (true) {  
num1 = Math.floor(Math.random() \* 9) + 2;  
num2 = Math.floor(Math.random() \* 9) + 2;  
text = num1 + '\\u00D7' + num2;

if (!state.usedExamples.includes(text)) {  
if (num1 \* num2 <= 25 && Math.random() > 0.33) {  
continue;  
}  
break;  
}  
}  
state.usedExamples.push(text);  
state.addExample({ exampleText: text, correctValue: num1 \* num2, currentInput: '' });

GameCanvas.clearZone();  
GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getMultiplicationHistoryHTML);  
renderMonsterGame();  
}

export function syncMonsterGame() {  
GameCanvas.clearZone();  
renderMonsterGame();  
}

export function renderMonsterGame() {  
const activeItem = state.examplesHistory\[state.activeIndex\];  
if (!activeItem) return GameCanvas.clearZone();

const task = parseMultiplicationData(activeItem.exampleText);  
const report = state.validateCurrentInput();  
const status = report.isFullySolved ? 'win' : (report.isWrongAnswer ? 'sad' : 'play');  
const cacheKey = activeItem.exampleText + '\_' + status;

const monsterSize = task.monsters > 6 ? '32px' : (task.monsters > 4 ? '40px' : '46px');  
const pizzaSize = task.items > 7 ? '14px' : (task.items > 5 ? '18px' : '22px');  
const labelSize = task.monsters > 7 ? '11px' : '14px';

let actorsHTML = '';  
for (let i = 0; i < task.monsters; i++) {  
let contentHTML = '', bg = '#fff7ed', border = '1px dashed #fed7aa', mClass = '';  
if (status === 'win') {  
contentHTML = '\\u041D\\u044F\\u043C-\\u041D\\u044F\\u043C! \\uD83D\\uDE0B';  
bg = '#dcfce7'; border = '1px dashed #22c55e'; mClass = 'monster-happy';  
} else if (status === 'sad') {  
contentHTML = '\\uD83D\\uDCA6';  
bg = '#eff6ff'; border = '1px dashed #60a5fa'; mClass = 'monster-sad';  
} else {  
contentHTML = '' + '\\uD83C\\uDF55'.repeat(task.items) + '';  
}  
const subtitleHTML = '' + contentHTML + '';  
actorsHTML += '' + GameCanvas.createActorHTML({ emoji: '\\uD83D\\uDC7E', animationClass: mClass, subtitle: subtitleHTML }) + '';  
}  
GameCanvas.renderZoneScene(actorsHTML, cacheKey);  
}

export function getMultiplicationHistoryHTML(item, index, mode) {  
const parts = item.currentInput.split('='), simText = parts.at(0) || '', finText = parts.at(1) || '';  
const report = state.validateCurrentInput(index), targetLen = String(item.correctValue).length;  
let simHTML = ' = ' + (simText || '*') + '';  
if (item.currentInput.includes('=')) simHTML = ' = ' + (simText || '?') + '';  
let finHTML = '';  
if (parts.length > 1) {  
if (finText.trim().length >= targetLen) finHTML = ' = ' + finText + '';  
else finHTML = ' = ' + (finText || '*') + '';  
}  
return { simHTML, finHTML };  
}
