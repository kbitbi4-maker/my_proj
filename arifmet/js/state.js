// version: v2.9 (Полная изоляция текстовых полей сотен до знака "=")
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

        // 1. ОСОБАЯ ПРОВЕРКА ДЛЯ ПРЯМОГО ВВОДА (БЕЗ ЗНАКА "=")
        if ((isMulti || isDiv || isHundreds) && !item.currentInput.includes('=')) {
            const val = parseInt(item.currentInput, 10);
            const isCorrect = (val === item.correctValue);

            // Если введён ТОЧНЫЙ итоговый правильный ответ — мгновенный триумф
            if (isCorrect) {
                return { isFullySolved: true, isWrongAnswer: false, phase: 3, simText: '', finText: item.currentInput, simCorrect: true, finCorrect: true };
            }
            
            // ХИРУРГИЧЕСКОЕ ИСПРАВЛЕНИЕ: Если это сотни, мы возвращаем ТОТАЛЬНОЕ ОБНУЛЕНИЕ полей.
            // Никаких промежуточных текстов! Тележки будут думать, что поле ввода абсолютно пустое.
            if (isHundreds) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: '', simCorrect: false, finCorrect: false };
            }

            // Для умножения и деления оставляем стандартный строгий числовой контроль длины
            const currentLen = item.currentInput.length;
            if (currentLen < targetLength) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
            }
            return { isFullySolved: false, isWrongAnswer: true, phase: 3, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
        }

        // 2. ДВУХЭТАПНАЯ ЛОГИКА ДЛЯ СОТЕН (ПРИ НАЛИЧИИ ЗНАКОВ "=")
        if (isHundreds) {
            const totalEquals = (item.currentInput.match(/=/g) || []).length;
            const parts = item.currentInput.split('=');
            
            if (totalEquals === 1) {
                // Пока введён один знак "=", мы передаём чистый текст упрощения для динамического изменения цифр на тележках,
                // но строго удерживаем статус ошибки в положении false.
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: parts[1] || '', finText: '', simCorrect: false, finCorrect: false };
            }

            // Нажато два или более знаков "=" (этап финальной проверки упрощения)
            const exprText = parts[1] || ''; // Вторая часть (упрощение)
            const ansText = parts[2] || '';  // Третья часть (финальное число)

            let simCorrect = false;
            if (exprText.trim().length > 0) {
                let simVal = evaluateExpr(exprText);
                simCorrect = (simVal === item.correctValue);
            }

            let finCorrect = false;
            const hasFinalAnswer = parts.length > 2 && ansText.trim().length >= targetLength;
            if (hasFinalAnswer) {
                let finVal = evaluateExpr(ansText);
                finCorrect = (finVal === item.correctValue);
            }

            const isFullySolved = simCorrect && finCorrect;
            
            let isWrongAnswer = false;
            if (totalEquals >= 2 && !simCorrect) {
                isWrongAnswer = true;
            }
            if (hasFinalAnswer && !finCorrect) {
                isWrongAnswer = true;
            }

            let phase = 2;
            if (hasFinalAnswer) phase = 3;

            return { isFullySolved, isWrongAnswer, phase, simText: exprText, finText: ansText, simCorrect, finCorrect };
        }

        // 3. СТАНДАРТНАЯ ЛОГИКА ДЛЯ ОСТАЛЬНЫХ РЕЖИМОВ (ДЕСЯТКИ, УМНОЖЕНИЕ С "=")
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
