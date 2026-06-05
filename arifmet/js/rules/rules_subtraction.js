// version: v1.2
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
            // ИСПРАВЛЕНО: расчет сотен идет от текущего измененного состояния примера
            let cH1 = isH ? Math.floor(d.num1 / 100) : 0;
            let userSubH = isH ? Math.floor(d.currentSubtrahend / 100) : 0;
            let remainingEmptyH = isH ? (Math.floor(d.num2 / 100) - userSubH) : 0;
            if (remainingEmptyH < 0) remainingEmptyH = 0;

            return {
                layout: "sub-scene", phase: 2, text: "Проверяем пример... 👀",
                leftDeckHTML: genSubCargo(d.tens1, d.ones1, d.addedAmount, d.subtractedAmount), leftH: cH1, leftLabel: "Л", leftColor: "#0284c7", leftEmptyH: 0, leftCrimsonH: userSubH,
                rightDeckHTML: genSubEmpty((isH ? d.num2 % 100 : d.num2) - d.subtractedAmount, d.addedAmount), rightH: 0, rightLabel: "П", rightColor: "#ef4444", rightEmptyH: remainingEmptyH, rightCrimsonH: 0,
                deckStyle: `border-color:${ctx.simCorrect ? '#22c55e' : '#0284c7'}; ${ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : ''}`, rightDeckStyle: "border:2px solid #000;"
            };
        }
    },
    {
        id: "sub_p3",
        match: (ctx) => ctx.operation === '-' && ctx.phase === 3,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            let cleanSub = isH ? d.currentSubtrahend % 100 : d.currentSubtrahend;
            // ИСПРАВЛЕНО: робот П уезжает строго с правильным финальным остатком сотен!
            let finalH1 = isH ? Math.floor((d.num1 - d.num2) / 100) : 0;
            return {
                layout: "sub-scene", phase: 3, isFullySolved: ctx.isFullySolved, text: ctx.isFullySolved ? "Ура! Робот П уехал с правильным грузом! 🎉" : "Проверяем ответ... 👀",
                leftDeckHTML: genSubCargo(d.tens1, d.ones1, 0, cleanSub), leftH: finalH1, leftLabel: "Л", leftColor: "#0284c7", leftEmptyH: 0, leftCrimsonH: 0,
                rightDeckHTML: genSubFinal(cleanSub - d.finalAddedAmount, d.finalAddedAmount), rightH: finalH1, rightLabel: "П", rightColor: "#ef4444", rightEmptyH: 0, rightCrimsonH: 0,
                deckStyle: "border-color:#22c55e;", rightDeckStyle: "background:#e0f2fe;border-color:#ef4444;"
            };
        }
    }
];
