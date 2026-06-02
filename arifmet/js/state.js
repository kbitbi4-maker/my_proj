import { evaluateExpr } from './calculator.js';

export const state = {
    currentMode: '',
    examplesHistory: [],
    usedExamples: [],
    activeIndex: -1,
    mixStep: 0,

    // Сброс данных сессии при переключении игры
    reset(mode) {
        this.currentMode = mode;
        this.examplesHistory = [];
        this.usedExamples = [];
        this.activeIndex = -1;
        this.mixStep = (mode === 'mix') ? 0 : this.mixStep;
    },

    // Добавление новой задачи в историю
    addExample(exampleObj) {
        this.examplesHistory.push(exampleObj);
        this.activeIndex = this.examplesHistory.length - 1;
    },

    // Валидатор ввода пользователя (возвращает чистые логические флаги для движка)
    validateCurrentInput() {
        if (this.activeIndex === -1 || !this.examplesHistory[this.activeIndex]) {
            return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: '' };
        }
        
        const item = this.examplesHistory[this.activeIndex];
        const parts = item.currentInput.split('=');
        const simText = parts.at(0) || '', finText = parts.at(1) || '';
        
        const hasPressedEqual = item.currentInput.includes('=');
        const targetLength = String(item.correctValue).length;
        const hasFinalAnswer = parts.length > 1 && finText.trim().length >= targetLength;

        let simCorrect = false;
        if (hasPressedEqual) {
            let simVal = evaluateExpr(simText);
            simCorrect = (simVal === item.correctValue);
            
            // Валидация количества слагаемых для режима умножения
            if (item.exampleText.includes('×') && simCorrect && simText) {
                const checkParts = simText.split('+');
                const expectedCount = parseInt(item.exampleText.split('×').at(1), 10);
                if (checkParts.length !== expectedCount) simCorrect = false;
            }
        }

        let finCorrect = false;
        if (hasFinalAnswer) {
            let finVal = evaluateExpr(finText);
            finCorrect = (finVal === item.correctValue);
        }

        const isFullySolved = hasPressedEqual && simCorrect && finCorrect;
        let isWrongAnswer = (hasPressedEqual && !simCorrect) || (parts.length > 1 && finText.trim().length >= targetLength && !finCorrect);

        let phase = 1;
        if (hasPressedEqual && !hasFinalAnswer) phase = 2;
        else if (hasFinalAnswer) phase = 3;

        return { isFullySolved, isWrongAnswer, phase, simText, finText, simCorrect, finCorrect };
    }
};
