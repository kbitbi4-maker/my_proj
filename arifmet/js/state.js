// version: v2.6 (Проверка сотен строго после второго знака "=")
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

            if (isCorrect) {
                return { isFullySolved: true, isWrongAnswer: false, phase: 3, simText: '', finText: item.currentInput, simCorrect: true, finCorrect: true };
            }
            
            if (isHundreds) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
            }

            const currentLen = item.currentInput.length;
            if (currentLen < targetLength) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
            }
            return { isFullySolved: false, isWrongAnswer: true, phase: 3, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
        }

        // 2. ДВУХЭТАПНАЯ ЛОГИКА ДЛЯ СОТЕН (ПРИ НАЛИЧИИ ЗНАКОВ "=")
        if (isHundreds) {
            const totalEquals = (item.currentInput.match(/=/g) || []).length;
            
            // Если введён только один знак "=", мы ПРИНУДИТЕЛЬНО замораживаем проверку 
            // и даём ребёнку дописать стадию вроде "579+154=580+153"
            if (totalEquals === 1) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: item.currentInput, finText: '', simCorrect: false, finCorrect: false };
            }

            // Нажато два или более знаков "=" (строка вида "579+154=580+153=груз")
            const parts = item.currentInput.split('=');
            const simText = parts[1] || ''; // Вторая часть выражения (то, к чему упростили, например "580+153")
            const finText = parts[2] || ''; // Третья часть (итоговый ответ)

            let simCorrect = false;
            if (simText.trim().length > 0) {
                let simVal = evaluateExpr(simText);
                simCorrect = (simVal === item.correctValue);
            }

            let finCorrect = false;
            const hasFinalAnswer = parts.length > 2 && finText.trim().length >= targetLength;
            if (hasFinalAnswer) {
                let finVal = evaluateExpr(finText);
                finCorrect = (finVal === item.correctValue);
            }

            const isFullySolved = simCorrect && finCorrect;
            
            let isWrongAnswer = false;
            // Ошибка упрощения загорается только если введён второй знак "=" и математика неверна
            if (totalEquals >= 2 && !simCorrect) {
                isWrongAnswer = true;
            }
            // Либо если введён неверный финальный ответ
            if (hasFinalAnswer && !finCorrect) {
                isWrongAnswer = true;
            }

            let phase = 2; // Переходим в фазу 2 (отображение результатов упрощения)
            if (hasFinalAnswer) phase = 3;

            return { isFullySolved, isWrongAnswer, phase, simText, finText, simCorrect, finCorrect };
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
