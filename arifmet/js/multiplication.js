// version: v1.1.2 (Хирургически безопасный пул до 10)  
import { state } from './state.js';  
import { GameCanvas } from './game\_canvas.js';  
import { parseMultiplicationData } from './calculator.js';

export function initMultiplicationMode() {  
document.querySelector('.header-menu-btn').innerText = 'Режим: Умножение 🍕 ▼';  
generateMultiExample();  
}

export function generateMultiExample() {  
if (!state.usedMultiPairs) state.usedMultiPairs = \[\];  
let num1, num2, checkKey;// version: v1.1
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { parseMultiplicationData } from './calculator.js';

export function initMultiplicationMode() {
    document.querySelector('.header-menu-btn').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

export function generateMultiExample() {
    if (!state.usedExamples) state.usedExamples = [];
    let num1, num2, text;
    while (true) {
        num1 = Math.floor(Math.random() * 3) + 2; 
        num2 = Math.floor(Math.random() * 3) + 2; 
        text = `${num1}×${num2}`;
        if (!state.usedExamples.includes(text)) break;
    }
    state.usedExamples.push(text);
    state.addExample({ exampleText: text, correctValue: num1 * num2, currentInput: '' });

    GameCanvas.clearZone();
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getMultiplicationHistoryHTML);
    renderMonsterGame(); 
}

export function syncMonsterGame() {
    GameCanvas.clearZone();
    renderMonsterGame();
}

export function renderMonsterGame() {
    const activeItem = state.examplesHistory[state.activeIndex];
    if (!activeItem) return GameCanvas.clearZone();
    
    // Запрашиваем чистую математику структуры задачи у калькулятора
    const task = parseMultiplicationData(activeItem.exampleText);
    const report = state.validateCurrentInput();
    const status = report.isFullySolved ? 'win' : (report.isWrongAnswer ? 'sad' : 'play');
    const cacheKey = `${activeItem.exampleText}_${status}`;

    let actorsHTML = '';
    for (let i = 0; i < task.monsters; i++) {
        let contentHTML = '', bg = '#fff7ed', border = '1px dashed #fed7aa', mClass = '';
        if (status === 'win') {
            contentHTML = '<span style="font-size:14px;color:#22c55e;font-weight:bold;animation:fadeIn 0.3s;">Ням-ням! 😋</span>';
            bg = '#dcfce7'; border = '1px dashed #22c55e'; mClass = 'monster-happy';
        } else if (status === 'sad') {
            contentHTML = '<span class="tears-animation" style="font-size:22px;">💦</span>';
            bg = '#eff6ff'; border = '1px dashed #60a5fa'; mClass = 'monster-sad';
        } else {
            contentHTML = '<span style="font-size:22px;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.1));">🍕</span>'.repeat(task.items);
        }
        const subtitleHTML = `<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;max-width:80px;background:${bg};padding:4px 6px;border-radius:6px;border:${border};min-height:32px;align-items:center;">${contentHTML}</div>`;
        actorsHTML += GameCanvas.createActorHTML({ emoji: '👾', animationClass: mClass, subtitle: subtitleHTML });
    }
    GameCanvas.renderZoneScene(actorsHTML, cacheKey);
}

export function getMultiplicationHistoryHTML(item, index, mode) {
    const parts = item.currentInput.split('='), simText = parts.at(0) || '', finText = parts.at(1) || '';
    const report = state.validateCurrentInput(index), targetLen = String(item.correctValue).length;
    let simHTML = ` = <span class="block">${simText || '_'}</span>`;
    if (item.currentInput.includes('=')) simHTML = ` = <span class="block ${report.simCorrect ? 'block-correct' : 'block-incorrect'}">${simText || '?'}</span>`;
    let finHTML = '';
    if (parts.length > 1) {
        if (finText.trim().length >= targetLen) finHTML = ` = <span class="block ${report.finCorrect ? 'block-correct' : 'block-incorrect'}">${finText}</span>`;
        else finHTML = ` = <span class="block">${finText || '_'}</span>`;
    }
    return { simHTML, finHTML };
}


while (true) {  
// Изменяем диапазон строго с 4 на 9 (числа от 2 до 10)  
num1 = Math.floor(Math.random() \* 9) + 2;  
num2 = Math.floor(Math.random() \* 9) + 2;

// Используем безопасный системный ключ без спецсимволов для проверки уникальности  
checkKey = num1 + '-' + num2;

if (!state.usedMultiPairs.includes(checkKey)) break;  
}

state.usedMultiPairs.push(checkKey);

// Используем оригинальный шаблон строки, который у вас работал  
let text = `${num1}×${num2}`;

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

// Запрашиваем чистую математику структуры задачи у калькулятора  
const task = parseMultiplicationData(activeItem.exampleText);  
const report = state.validateCurrentInput();  
const status = report.isFullySolved ? 'win' : (report.isWrongAnswer ? 'sad' : 'play');  
const cacheKey = `${activeItem.exampleText}_${status}`;

let actorsHTML = '';  
for (let i = 0; i < task.monsters; i++) {  
let contentHTML = '', bg = '#fff7ed', border = '1px dashed #fed7aa', mClass = '';  
if (status === 'win') {  
contentHTML = 'Ням-ням! 😋';  
bg = '#dcfce7'; border = '1px dashed #22c55e'; mClass = 'monster-happy';  
} else if (status === 'sad') {  
contentHTML = '💦';  
bg = '#eff6ff'; border = '1px dashed #60a5fa'; mClass = 'monster-sad';  
} else {  
contentHTML = '🍕'.repeat(task.items);  
}  
const subtitleHTML = `<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;max-width:80px;background:${bg};padding:4px 6px;border-radius:6px;border:${border};min-height:32px;align-items:center;">${contentHTML}</div>`;  
actorsHTML += GameCanvas.createActorHTML({ emoji: '👾', animationClass: mClass, subtitle: subtitleHTML });  
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
