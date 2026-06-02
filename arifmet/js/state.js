import { evaluateExpr } from './calculator.js';

export const state = {
    currentMode: '',
    examplesHistory: [],
    usedExamples: [],
    activeIndex: -1,
    mixStep: 0,

    // Полный сброс состояния при смене игрового режима
    reset(mode) {
        this.currentMode = mode;
        this.examplesHistory = [];
        this.usedExamples = [];
        this.activeIndex = -1;
        this.mixStep = (mode === 'mix') ? 0 : this.mixStep;
    },

    // Добавление нового примера в историю сессии
    addExample(exampleObj) {
        this.examplesHistory.push(exampleObj);
        this.activeIndex = this.examplesHistory.length - 1;
    },

    // Универсальный валидатор ввода пользователя (возвращает чистые флаги для движка и звуков)
    validateCurrentInput() {
        if (this.activeIndex === -1 || !this.examplesHistory[this.activeIndex]) {
            return { isFullySolved: false, isWrongAnswer: false, phase: 1, simText: '', finText: '' };
        }
        
        const item = this.examplesHistory[this.activeIndex];
        const parts = item.currentInput.split('=');
        const simText = parts[0] || '';
        const finText = parts[1] || '';
        
        const hasPressedEqual = item.currentInput.includes('=');
        const targetLength = String(item.correctValue).length;
        const hasFinalAnswer = parts.length > 1 && finText.trim().length >= targetLength;

        // 1. Валидация фазы упрощения (до знака равенства)
        let simCorrect = false;
        if (hasPressedEqual) {
            let simVal = evaluateExpr(simText);
            simCorrect = (simVal === item.correctValue);
            
            // Специфический хак для умножения: проверяем корректность количества слагаемых
            if (item.exampleText.includes('×') && simCorrect && simText) {
                const checkParts = simText.split('+');
                const expectedCount = parseInt(item.exampleText.split('×')[1], 10);
                if (checkParts.length !== expectedCount) simCorrect = false;
            }
        }

        // 2. Валидация финального ответа
        let finCorrect = false;
        if (hasFinalAnswer) {
            let finVal = evaluateExpr(finText);
            finCorrect = (finVal === item.correctValue);
        }

        // Вычисляем статус и текущую фазу для визуальных движков
        const isFullySolved = hasPressedEqual && simCorrect && finCorrect;
        let isWrongAnswer = false;
        if (hasPressedEqual && !simCorrect) isWrongAnswer = true;
        if (parts.length > 1 && finText.trim().length >= targetLength && !finCorrect) isWrongAnswer = true;

        let phase = 1;
        if (hasPressedEqual && !hasFinalAnswer) phase = 2;
        else if (hasFinalAnswer) phase = 3;

        return { isFullySolved, isWrongAnswer, phase, simText, finText, simCorrect, finCorrect };
    }
};

// Временный проброс для совместимости со старыми компонентами, пока идет рефакторинг
window.state = state;

