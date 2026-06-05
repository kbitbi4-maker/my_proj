// version: v1.2
import { evaluateExpr, parseAdditionData, parseSubtractionData, parseMultiplicationData } from './calculator.js';

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

    /**
     * Генерирует единый пакет фактов о текущем состоянии для системы правил
     */
    getContext() {
        if (this.activeIndex === -1 || !this.examplesHistory[this.activeIndex]) {
            return null;
        }

        const item = this.examplesHistory[this.activeIndex];
        const report = this.validateCurrentInput();
        
        // Определяем операцию математического действия
        let operation = '+';
        if (item.exampleText.includes('-')) operation = '-';
        if (item.exampleText.includes('×')) operation = '×';

        // Собираем сухую математику в зависимости от операции
        let mathData = {};
        if (operation === '+') {
            mathData = parseAdditionData(item.exampleText, report);
        } else if (operation === '-') {
            mathData = parseSubtractionData(item.exampleText, report);
        } else if (operation === '×') {
            mathData = parseMultiplicationData(item.exampleText);
        }

        // Возвращаем изолированный Context (пакет фактов)
        return {
            mode: this.currentMode,
            operation: operation,
            phase: report.phase,
            simCorrect: report.simCorrect,
            finCorrect: report.finCorrect,
            isWrongAnswer: report.isWrongAnswer,
            isFullySolved: report.isFullySolved,
            exampleText: item.exampleText,
            currentInput: item.currentInput,
            math: mathData
        };
    },

    validateCurrentInput(targetIndex = null) {
        const idx = (targetIndex !== null) ? targetIndex : this.activeIndex;
        if (idx === -1 || !this.examplesHistory[idx]) {
            return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: '', simCorrect: false, finCorrect: false };
        }
        
        const item = this.examplesHistory[idx];
        const parts = item.currentInput.split('=');
        const simText = parts.at(0) || '', finText = parts.at(1) || '';
        
        const hasPressedEqual = item.currentInput.includes('=');
        const targetLength = String(item.correctValue).length;
        const hasFinalAnswer = parts.length > 1 && finText.trim().length >= targetLength;

        // 1. Проверка промежуточной стадии (упрощения)
        let simCorrect = false;
        if (hasPressedEqual) {
            let simVal = evaluateExpr(simText);
            simCorrect = (simVal === item.correctValue);
            
            if (item.exampleText.includes('×') && simCorrect && simText) {
                const checkParts = simText.split('+');
                const expectedCount = parseInt(item.exampleText.split('×').at(1), 10);
                if (checkParts.length !== expectedCount) simCorrect = false;
            }
        }

        // 2. Проверка финального ответа
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
