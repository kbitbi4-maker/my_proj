// version: v1.3
import { evaluateExpr, parseAdditionData, parseSubtractionData, parseMultiplicationData } from './calculator.js';

export const state = {
    currentMode: '', examplesHistory: [], usedExamples: [], activeIndex: -1, mixStep: 0,

    reset(mode) {
        this.currentMode = mode; this.examplesHistory = []; this.usedExamples = []; this.activeIndex = -1;
        this.mixStep = (mode === 'mix') ? 0 : this.mixStep;
    },
    addExample(exampleObj) {
        this.examplesHistory.push(exampleObj); this.activeIndex = this.examplesHistory.length - 1;
    },
    getContext() {
        if (this.activeIndex === -1 || !this.examplesHistory[this.activeIndex]) return null;
        const item = this.examplesHistory[this.activeIndex];
        const report = this.validateCurrentInput();
        
        let operation = '+';
        if (item.exampleText.includes('-')) operation = '-';
        if (item.exampleText.includes('×')) operation = '×';

        let mathData = {};
        if (operation === '+') mathData = parseAdditionData(item.exampleText);
        // Передаем отчет валидации в парсер вычитания
        else if (operation === '-') mathData = parseSubtractionData(item.exampleText, report);
        else if (operation === '×') mathData = parseMultiplicationData(item.exampleText);

        return {
            mode: this.currentMode, operation, phase: report.phase,
            simCorrect: report.simCorrect, finCorrect: report.finCorrect,
            isWrongAnswer: report.isWrongAnswer, isFullySolved: report.isFullySolved,
            exampleText: item.exampleText, currentInput: item.currentInput, math: mathData
        };
    },
    validateCurrentInput(targetIndex = null) {
        const idx = (targetIndex !== null) ? targetIndex : this.activeIndex;
        if (idx === -1 || !this.examplesHistory[idx]) return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: '', simCorrect: false, finCorrect: false };
        
        const item = this.examplesHistory[idx]; const parts = item.currentInput.split('=');
        const simText = parts[0] || '', finText = parts[1] || '';
        const hasPressedEqual = item.currentInput.includes('=');
        const targetLength = String(item.correctValue).length;
        const hasFinalAnswer = parts.length > 1 && finText.trim().length >= targetLength;

        let simCorrect = false;
        if (hasPressedEqual) {
            let simVal = evaluateExpr(simText); simCorrect = (simVal === item.correctValue);
            if (item.exampleText.includes('×') && simCorrect && simText) {
                const checkParts = simText.split('+');
                if (checkParts.length !== parseInt(item.exampleText.split('×')[1], 10)) simCorrect = false;
            }
        }
        let finCorrect = false;
        if (hasFinalAnswer) finCorrect = (evaluateExpr(finText) === item.correctValue);

        const isFullySolved = hasPressedEqual && simCorrect && finCorrect;
        let isWrongAnswer = (hasPressedEqual && !simCorrect) || (parts.length > 1 && finText.trim().length >= targetLength && !finCorrect);
        let phase = 1; if (hasPressedEqual && !hasFinalAnswer) phase = 2; else if (hasFinalAnswer) phase = 3;

        return { isFullySolved, isWrongAnswer, phase, simText, finText, simCorrect, finCorrect };
    }
};
