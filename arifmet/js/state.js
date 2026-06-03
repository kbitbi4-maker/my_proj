// version: v1.1
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
        
        // Жёсткое исправление: ошибка засчитывается только если промежуточный неверный ИЛИ финальный ответ ДОСТИГ нужной длины и он неверный
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
