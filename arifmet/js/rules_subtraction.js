// version: v1.0
import { genSubCargo, genSubEmpty, genSubFinal } from './rules_sub_utils.js';

export const SUBTRACTION_RULES = [
    {
        id: "sub_p1",
        match: (ctx) => ctx.operation === '-' && ctx.phase === 1,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            return {
                layout: "sub-scene", phase: 1, text: "Проверяем пример... 👀",
                leftDeckHTML: genSubCargo(d.tens1, d.ones1, 0, 0), leftH: isH ? Math.floor(d.num1 / 100) : 0, leftLabel: `Л (${d.num1})`, leftColor: "#0284c7", leftEmptyH: 0, leftCrimsonH: 0,
                rightDeckHTML: genSubEmpty(isH ? d.num2 % 100 : d.num2, 0), rightH: 0, rightLabel: `П (${d.num2})`, rightColor: "#ef4444", rightEmptyH: isH ? Math.floor(d.num2 / 100) : 0, rightCrimsonH: 0,
                deckStyle: "border-color:#0284c7;", rightDeckStyle: "border:2px solid #000;background:rgba(0,0,0,0.03);"
            };
        }
    },
    {
        id: "sub_p2",
        match: (ctx) => ctx.operation === '-' && ctx.phase === 2,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            let cH1 = isH ? Math.floor(d.num1 / 100) : 0, cH2 = isH ? Math.floor(d.currentSubtrahend / 100) : 0, userSubH = 0;
            if (isH && ctx.currentInput.includes('-')) {
                const parts = ctx.currentInput.split('=').at(0).split('-');
                if (parts && !isNaN(parseInt(parts, 10))) cH1 = Math.floor(parseInt(parts, 10) / 100);
                if (parts && !isNaN(parseInt(parts, 10))) { userSubH = Math.floor(d.num2 / 100) - Math.floor(parseInt(parts, 10) / 100); cH2 = 0; }
            }
            return {
                layout: "sub-scene", phase: 2, text: "Проверяем пример... 👀",
                leftDeckHTML: genSubCargo(d.tens1, d.ones1, d.addedAmount, d.subtractedAmount), leftH: cH1, leftLabel: "Л", leftColor: "#0284c7", leftEmptyH: 0, leftCrimsonH: userSubH,
                rightDeckHTML: genSubEmpty((isH ? d.num2 % 100 : d.num2) - d.subtractedAmount, d.addedAmount), rightH: 0, rightLabel: "П", rightColor: "#ef4444", rightEmptyH: cH2, rightCrimsonH: 0,
                deckStyle: `border-color:${ctx.simCorrect ? '#22c55e' : '#0284c7'}; ${ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : ''}`, rightDeckStyle: "border:2px solid #000;"
            };
        }
    },
    {
        id: "sub_p3",
        match: (ctx) => ctx.operation === '-' && ctx.phase === 3,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            let cleanSub = isH ? d.currentSubtrahend % 100 : d.currentSubtrahend, finalH1 = isH ? Math.floor((d.num1 - d.num2) / 100) : 0;
            return {
                layout: "sub-scene", phase: 3, isFullySolved: ctx.isFullySolved, text: ctx.isFullySolved ? "Ура! Робот П уехал с правильным грузом! 🎉" : "Проверяем ответ... 👀",
                leftDeckHTML: genSubCargo(d.tens1, d.ones1, 0, cleanSub), leftH: finalH1, leftLabel: "Л", leftColor: "#0284c7", leftEmptyH: 0, leftCrimsonH: 0,
                rightDeckHTML: genSubFinal(cleanSub - (ctx.currentInput.includes('=') ? parseInt(ctx.currentInput.split('=').at(1), 10) - d.num2 : 0 < 0 ? 0 : 0), 0), rightH: finalH1, rightLabel: "П", rightColor: "#ef4444", rightEmptyH: 0, rightCrimsonH: 0,
                deckStyle: "border-color:#22c55e;", rightDeckStyle: "background:#e0f2fe;border-color:#ef4444;"
            };
        }
    }
];

