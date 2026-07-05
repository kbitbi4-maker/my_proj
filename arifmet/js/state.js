// version: v2.4 (Защита от подсказок в сотнях при неверном прямом вводе)
import { evaluateExpr } from './calculator.js';

export const state = {
    currentMode: '',
    examplesHistory: [],
    usedExamples: [],
    activeIndex: -1,
    mixStep: 0,

    reset(mode) {
        this.currentMode = mode;
        this.examplesHistory = [];
        this.usedExamples = [];
        this.activeIndex = -1;
        this.mixStep = (mode === 'mix') ? 0 : this.mixStep;
    },

    addExample(exampleObj) {
        this.examplesHistory.push(exampleObj);
        this.activeIndex = this.examplesHistory.length - 1;
    },

    validateCurrentInput(targetIndex = null) {
        const idx = (targetIndex !== null) ? targetIndex : this.activeIndex;
        if (idx === -1 || !this.examplesHistory[idx]) {
            return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: '', simCorrect: false, finCorrect: false };
        }
        
        const item = this.examplesHistory[idx];
        const targetLength = String(item.correctValue).length;

        if (this.currentMode === 'column') {
            const currentLen = item.currentInput.length;
            if (currentLen < targetLength) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: item.currentInput, finText: '', simCorrect: false, finCorrect: false };
            }
            const val = parseInt(item.currentInput, 10);
            const isCorrect = (val === item.correctValue);
            return { isFullySolved: isCorrect, isWrongAnswer: !isCorrect, phase: 3, simText: item.currentInput, finText: item.currentInput, simCorrect: isCorrect, finCorrect: isCorrect };
        }

        const isMulti = item.exampleText.includes('×');
        const isDiv = item.exampleText.includes('÷');
        const firstNumber = parseInt(item.exampleText, 10);
        const isHundreds = !isNaN(firstNumber) && firstNumber >= 100 && (item.exampleText.includes('+') || item.exampleText.includes('-'));

        // ОСОБАЯ ПРОВЕРКА ДЛЯ ПРЯМОГО ВВОДА (БЕЗ ЗНАКА "=")
        if ((isMulti || isDiv || isHundreds) && !item.currentInput.includes('=')) {
            const val = parseInt(item.currentInput, 10);
            const isCorrect = (val === item.correctValue);

            // Если введён ТОЧНЫЙ правильный ответ — мгновенный триумф
            if (isCorrect) {
                return { isFullySolved: true, isWrongAnswer: false, phase: 3, simText: '', finText: item.currentInput, simCorrect: true, finCorrect: true };
            }
            
            // ХИРУРГИЧЕСКОЕ ИСПРАВЛЕНИЕ ДЛЯ СОТЕН: Если ответ неверный, мы НЕ переходим в фазу 3 и НЕ ставим ошибку до нажатия "="
            if (isHundreds) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
            }

            // Для умножения и деления оставляем стандартный строгий числовой контроль длины
            const currentLen = item.currentInput.length;
            if (currentLen < targetLength) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
            }
            return { isFullySolved: false, isWrongAnswer: true, phase: 3, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
        }

        // СТАНДАРТНАЯ ДВУХЭТАПНАЯ ЛОГИКА (ВКЛЮЧАЕТСЯ ПОСЛЕ НАЖАТИЯ "=")
        const parts = item.currentInput.split('=');
        const simText = parts.at(0) || '', finText = parts.at(1) || '';
        
        const hasPressedEqual = item.currentInput.includes('=');
        const hasFinalAnswer = parts.length > 1 && finText.trim().length >= targetLength;

        let simCorrect = false;
        if (hasPressedEqual) {
            let simVal = evaluateExpr(simText);
            simCorrect = (simVal === item.correctValue);
            
            if (item.exampleText.includes('×') && simCorrect && simText) {
                const checkParts = simText.split('+');
                const cleanText = item.exampleText.replace(/×/g, '*');
                const factors = cleanText.split('*');
                const f1 = parseInt(factors[0], 10);
                const f2 = parseInt(factors[1], 10);
                
                const isVariantA = (checkParts.length === f2 && parseInt(checkParts[0], 10) === f1);
                const isVariantB = (checkParts.length === f1 && parseInt(checkParts[0], 10) === f2);
                
                if (!isVariantA && !isVariantB) simCorrect = false;
            }
        }

        let finCorrect = false;
        if (hasFinalAnswer) {
            let finVal = evaluateExpr(finText);
            finCorrect = (finVal === item.correctValue);
        }

        const isFullySolved = hasPressedEqual && simCorrect && finCorrect;
        
        let isWrongAnswer = false;
        if (hasPressedEqual && !simCorrect) {
            isWrongAnswer = true;
        }
        if (parts.length > 1 && finText.trim().length > 0) {
            if (finText.trim().length >= targetLength && !finCorrect) {
                isWrongAnswer = true;
            }
        }

        let phase = 1;
        if (hasPressedEqual && !hasFinalAnswer) phase = 2;
        else if (hasFinalAnswer) phase = 3;

        return { isFullySolved, isWrongAnswer, phase, simText, finText, simCorrect, finCorrect };
    }
};
