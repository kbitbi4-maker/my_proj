// version: v2.1 (Исправлено исчезновение текста упрощения сотен) 
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { renderAdditionVisual } from './addition_visual.js';
import { renderSubtractionVisual } from './subtraction_visual.js';
import { renderAdditionHundredsVisual } from './addition_hundreds_visual.js';
import { renderSubtractionHundredsVisual } from './subtraction_hundreds_visual.js';
import { renderColumnVisual } from './column_visual.js';

let isAddition = true;

export function initTensMode() {
    if (state.currentMode === 'column') {
        document.querySelector('.header-menu-btn').innerText = 'Режим: В столбик 📝 ▼';
    } else {
        document.querySelector('.header-menu-btn').innerText = state.currentMode === 'hundreds' ? 'Режим: Сотни 🛠️ ▼' : 'Режим: Десятки ▼';
    }
    generateExample();
}

export function generateExample() {
    if (state.currentMode !== 'tens' && state.currentMode !== 'mix' && state.currentMode !== 'hundreds' && state.currentMode !== 'column') return;
    if (!state.usedExamples) state.usedExamples = [];
    let num1, num2, correctValue, text;

    const isHundreds = state.currentMode === 'hundreds' || state.currentMode === 'column';
    const min = isHundreds ? 100 : 10;
    const max = isHundreds ? 900 : 90;

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
            let ones1 = num1 % 10, ones2 = num2 % 10;
            if (num1 > num2 && ones2 !== 0) { 
                text = `${num1}-${num2}`; if (!state.usedExamples.includes(text)) { correctValue = num1 - num2; break; } 
            }
        }
    }

    state.usedExamples.push(text);
    state.addExample({ exampleText: text, correctValue: correctValue, currentInput: '' });
    isAddition = !isAddition;

    GameCanvas.clearZone();
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getTensHistoryHTML);
    renderTensVisual();
}

export function renderTensVisual() {
    if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return GameCanvas.clearZone();
    
    if (state.currentMode === 'column') {
        return renderColumnVisual();
    }

    const isAdd = state.examplesHistory[state.activeIndex].exampleText.includes('+');
    if (state.currentMode === 'hundreds') {
        if (isAdd) return renderAdditionHundredsVisual();
        else return renderSubtractionHundredsVisual();
    }
    
    if (isAdd) renderAdditionVisual();
    else renderSubtractionVisual();
}

export function getTensHistoryHTML(item, index, mode) {
    const report = state.validateCurrentInput(index);
    const targetLen = String(item.correctValue).length;

    if (mode === 'column') {
        let simHTML = '';
        let finHTML = '';
        if (item.currentInput.length >= targetLen) {
            finHTML = ` = <span class="block ${report.isFullySolved ? 'block-correct' : 'block-incorrect'}">${item.currentInput}</span>`;
        } else {
            finHTML = ` = <span class="block">${item.currentInput || '_'}</span>`;
        }
        return { simHTML, finHTML };
    }

    const firstNumber = parseInt(item.exampleText, 10);
    const isHundreds = !isNaN(firstNumber) && firstNumber >= 100;
    
    if (isHundreds) {
        const totalEquals = (item.currentInput.match(/=/g) || []).length;
        
        if (totalEquals === 0) {
            if (item.currentInput.length >= targetLen) {
                const cls = report.isFullySolved ? 'block-correct' : 'block-incorrect';
                return { simHTML: '', finHTML: ` = <span class="block ${cls}">${item.currentInput}</span>` };
            }
            return { simHTML: '', finHTML: ` = <span class="block">${item.currentInput || '_'}</span>` };
        }

        // ЖЕЛЕЗОБЕТОННЫЙ ВЫВОД ИСТОРИИ: Просто выводим всё, что набрано после первого знака "="
        const firstEqualIndex = item.currentInput.indexOf('=');
        const userContent = item.currentInput.substring(firstEqualIndex + 1);

        if (totalEquals === 1) {
            return {
                simHTML: ` = <span class="block">${userContent || '_'}</span>`,
                finHTML: ''
            };
        }

        // Введено два или более знаков равенства
        const secondEqualIndex = userContent.indexOf('=');
        const exprText = userContent.substring(0, secondEqualIndex);
        const ansText = userContent.substring(secondEqualIndex + 1);
        
        // Цвет блока упрощения красится строго на основе реального ответа
        const simCls = report.simCorrect ? 'block-correct' : 'block-incorrect';
        
        let finHTML = ` = <span class="block">${ansText || '_'}</span>`;
        if (ansText.trim().length >= targetLen) {
            const finCls = report.finCorrect ? 'block-correct' : 'block-incorrect';
            finHTML = ` = <span class="block ${finCls}">${ansText}</span>`;
        }

        return {
            simHTML: ` = <span class="block ${simCls}">${exprText}</span>`,
            finHTML: finHTML
        };
    }

    const parts = item.currentInput.split('='), simText = parts.at(0) || '', finText = parts.at(1) || '';
    let simHTML = ` = <span class="block">${simText || '_'}</span>`;
    if (item.currentInput.includes('=')) simHTML = ` = <span class="block ${report.simCorrect ? 'block-correct' : 'block-incorrect'}">${simText || '?'}</span>`;
    let finHTML = '';
    if (parts.length > 1) {
        if (finText.trim().length >= targetLen) finHTML = ` = <span class="block ${report.finCorrect ? 'block-correct' : 'block-incorrect'}">${finText}</span>`;
        else finHTML = ` = <span class="block">${finText || '_'}</span>`;
    }
    return { simHTML, finHTML };
}
