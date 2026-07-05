// version: v1.3 (Хирургическое добавление динамических размеров)  
import { state } from './state.js';  
import { GameCanvas } from './game\_canvas.js';  
import { parseMultiplicationData } from './calculator.js'; 

export function initMultiplicationMode() {  
document.querySelector('.header-menu-btn').innerText = 'Режим: Умножение 🍕 ▼';  
generateMultiExample();  
} 

export function generateMultiExample() {  
if (!state.usedExamples) state.usedExamples = \[\];  
let num1, num2, text;  
while (true) {  
num1 = Math.floor(Math.random() \* 9) + 2;  
num2 = Math.floor(Math.random() \* 9) + 2;  
text = `${num1}×${num2}`; 

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
const cacheKey = `${activeItem.exampleText}_${status}`; 

// ХИРУРГИЧЕСКАЯ ПРАВКА: Расчет динамических размеров для адаптивности 10х10  
const monsterSize = task.monsters > 6 ? '32px' : (task.monsters > 4 ? '40px' : '46px');  
const pizzaSize = task.items > 7 ? '14px' : (task.items > 5 ? '18px' : '22px');  
const labelSize = task.monsters > 7 ? '11px' : '14px'; 

let actorsHTML = '';  
for (let i = 0; i < task.monsters; i++) {  
let contentHTML = '', bg = '#fff7ed', border = '1px dashed #fed7aa', mClass = '';  
if (status === 'win') {  
// Подставляем labelSize для текста победы  
contentHTML = `<span style="font-size:${labelSize};color:#22c55e;font-weight:bold;animation:fadeIn 0.3s;">Ням-ням! 😋</span>`;  
bg = '#dcfce7'; border = '1px dashed #22c55e'; mClass = 'monster-happy';  
} else if (status === 'sad') {  
// Подставляем pizzaSize для капелек слёз  
contentHTML = `<span class="tears-animation" style="font-size:${pizzaSize};">💦</span>`;  
bg = '#eff6ff'; border = '1px dashed #60a5fa'; mClass = 'monster-sad';  
} else {  
// Подставляем pizzaSize для кусочков пиццы  
contentHTML = `<span style="font-size:${pizzaSize};filter:drop-shadow(0 1px 1px rgba(0,0,0,0.1));">🍕</span>`.repeat(task.items);  
}  
const subtitleHTML = `<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;max-width:80px;background:${bg};padding:4px 6px;border-radius:6px;border:${border};min-height:32px;align-items:center;">${contentHTML}</div>`; 

// Передаем monsterSize в инлайн-стиль контейнера актера через обертку, чтобы уменьшить сам эмодзи монстра  
actorsHTML += `<div style="font-size:${monsterSize};">` + GameCanvas.createActorHTML({ emoji: '👾', animationClass: mClass, subtitle: subtitleHTML }) + `</div>`;  
}  
GameCanvas.renderZoneScene(actorsHTML, cacheKey);  
} 

export function getMultiplicationHistoryHTML(item, index, mode) {  
const parts = item.currentInput.split('='), simText = parts.at(0) || '', finText = parts.at(1) || '';  
const report = state.validateCurrentInput(index), targetLen = String(item.correctValue).length;  
let simHTML = `= <span class="block">${simText || '_'}</span>`;  
if (item.currentInput.includes('=')) simHTML = `= <span class="block ${report.simCorrect ? 'block-correct' : 'block-incorrect'}">${simText || '?'}</span>`;  
let finHTML = '';  
if (parts.length > 1) {  
if (finText.trim().length >= targetLen) finHTML = `= <span class="block ${report.finCorrect ? 'block-correct' : 'block-incorrect'}">${finText}</span>`;  
else finHTML = `= <span class="block">${finText || '_'}</span>`;  
}  
return { simHTML, finHTML };  
}
