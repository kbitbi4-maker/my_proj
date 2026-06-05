// version: v1.7
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
        let operation = item.exampleText.includes('-') ? '-' : (item.exampleText.includes('×') ? '×' : '+');

        let mathData = {};
        if (operation === '+') mathData = parseAdditionData(item.exampleText, report);
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
            simCorrect = (evaluateExpr(simText) === item.correctValue);
            if (item.exampleText.includes('×') && simCorrect && simText) {
                if (simText.split('+').length !== parseInt(item.exampleText.split('×')[0], 10)) simCorrect = false;
            }
        }
        let finCorrect = hasFinalAnswer && (evaluateExpr(finText) === item.correctValue);
        const isFullySolved = hasPressedEqual && simCorrect && finCorrect;
        let isWrongAnswer = (hasPressedEqual && !simCorrect) || (parts.length > 1 && finText.trim().length >= targetLength && !finCorrect);
        let phase = hasFinalAnswer ? 3 : (hasPressedEqual ? 2 : 1);

        return { isFullySolved, isWrongAnswer, phase, simText, finText, simCorrect, finCorrect };
    }
};
