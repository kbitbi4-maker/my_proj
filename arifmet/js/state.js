// version: v3.0 (Финальная стабильная проверка сотен без багов split)
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

        // 1. ПРЯМОЙ ВВОД ОТВЕТА (БЕЗ ЗНАКОВ "=")
        if ((isMulti || isDiv || isHundreds) && !item.currentInput.includes('=')) {
            const val = parseInt(item.currentInput, 10);
            const isCorrect = (val === item.correctValue);

            if (isCorrect) {
                return { isFullySolved: true, isWrongAnswer: false, phase: 3, simText: '', finText: item.currentInput, simCorrect: true, finCorrect: true };
            }
            if (isHundreds) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: '', simCorrect: false, finCorrect: false };
            }

            const currentLen = item.currentInput.length;
            if (currentLen < targetLength) {
                return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
            }
            return { isFullySolved: false, isWrongAnswer: true, phase: 3, simText: '', finText: item.currentInput, simCorrect: false, finCorrect: false };
        }

        // 2. СТАБИЛЬНАЯ ЛОГИКА ДЛЯ СОТЕН С РАВЕНСТВАМИ
        if (isHundreds) {
            const totalEquals = (item.currentInput.match(/=/g) || []).length;
            
            // Разрезаем строку строго по первому знаку "="
            const firstEqualIndex = item.currentInput.indexOf('=');
            const userContent = item.currentInput.substring(firstEqualIndex + 1); // Всё, что после первого "="
            
            // Выделяем промежуточное упрощение (убираем всё, что после второго знака "=" если он есть)
            let exprText = userContent;
            let ansText = '';
            if (totalEquals >= 2) {
                const secondEqualIndex = userContent.indexOf('=');
                exprText = userContent.substring(0, secondEqualIndex);
                ansText = userContent.substring(secondEqualIndex + 1);
            }

            let simCorrect = false;
            if (exprText.trim().length > 0) {
                let simVal = evaluateExpr(exprText);
                simCorrect = (simVal === item.correctValue);
            }

            let finCorrect = false;
            if (totalEquals >= 2 && ansText.trim().length >= targetLength) {
                let finVal = evaluateExpr(ansText);
                finCorrect = (finVal === item.correctValue);
            }

            const isFullySolved = simCorrect && finCorrect;
            
            let isWrongAnswer = false;
            // Ошибка упрощения загорается ТОЛЬКО если введено 2 или более знаков "=" и математика неверна
            if (totalEquals >= 2 && !simCorrect) {
                isWrongAnswer = true;
            }
            if (totalEquals >= 2 && ansText.trim().length >= targetLength && !finCorrect) {
                isWrongAnswer = true;
            }

            let phase = 1;
            if (totalEquals === 1) phase = 1;
            else if (totalEquals >= 2 && !finCorrect) phase = 2;
            else if (totalEquals >= 2 && finCorrect) phase = 3;

            return { isFullySolved, isWrongAnswer, phase, simText: exprText, finText: ansText, simCorrect, finCorrect };
        }

        // 3. СТАНДАРТНАЯ ЛОГИКА (ДЕСЯТКИ, УМНОЖЕНИЕ)
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
                const f1 = parseInt(factors, 10);
                const f2 = parseInt(factors, 10);
                
                const isVariantA = (checkParts.length === f2 && parseInt(checkParts, 10) === f1);
                const isVariantB = (checkParts.length === f1 && parseInt(checkParts, 10) === f2);
                
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
