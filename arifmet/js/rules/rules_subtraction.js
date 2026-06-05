// version: v1.5
import { genSubCargo, genSubEmpty, genSubFinal } from './rules_sub_utils.js';

export const SUBTRACTION_RULES = [
    {
        id: "sub_p1",
        match: (ctx) => ctx.operation === '-' && ctx.phase === 1,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            return {
                layout: "sub-scene", phase: 1, text: "Проверяем пример... 👀", sound: null,
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
            let curH1 = isH ? Math.floor(d.num1 / 100) : 0, curH2 = isH ? Math.floor(d.currentSubtrahend / 100) : 0, userSubH = 0;
            const simPart = ctx.currentInput.split('=').at(0) || '';
            if (isH && simPart.includes('-')) {
                const parts = simPart.split('-');
                const leftNum = parseInt(parts[0], 10), rightNum = parseInt(parts[1], 10);
                if (!isNaN(leftNum)) curH1 = Math.floor(leftNum / 100);
                if (!isNaN(rightNum)) { userSubH = Math.floor(d.num2 / 100) - Math.floor(rightNum / 100); curH2 = 0; }
            }
            return {
                layout: "sub-scene", phase: 2, text: "Проверяем пример... 👀", sound: ctx.isWrongAnswer ? "fail" : (ctx.simCorrect ? "win" : null),
                leftDeckHTML: genSubCargo(d.tens1, d.ones1, d.addedAmount, d.subtractedAmount), leftH: curH1, leftLabel: "Л", leftColor: "#0284c7", leftEmptyH: 0, leftCrimsonH: userSubH,
                rightDeckHTML: genSubEmpty((isH ? d.num2 % 100 : d.num2) - d.subtractedAmount, d.addedAmount), rightH: 0, rightLabel: "П", rightColor: "#ef4444", rightEmptyH: curH2, rightCrimsonH: 0,
                deckStyle: `border-color:${ctx.simCorrect ? '#22c55e' : '#0284c7'}; ${ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : ''}`, rightDeckStyle: "border:2px solid #000;"
            };
        }
    },
    {
        id: "sub_p3",
        match: (ctx) => ctx.operation === '-' && ctx.phase === 3,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            // ЖЕСТКОЕ ИСПРАВЛЕНИЕ: Вычисляем математически точный остаток кубиков для финала
            let finalLeftCubes = d.num1 - d.num2; 
            let finalRightCubes = d.num2;
            
            let cleanLeft = isH ? finalLeftCubes % 100 : finalLeftCubes;
            let cleanRight = isH ? finalRightCubes % 100 : finalRightCubes;
            let finalH1 = isH ? Math.floor(finalLeftCubes / 100) : 0;
            
            return {
                layout: "sub-scene", phase: 3, isFullySolved: ctx.isFullySolved, text: ctx.isFullySolved ? "Ура! Робот П уехал с правильным грузом! 🎉" : "Проверяем ответ... 👀", sound: ctx.isWrongAnswer ? "fail" : (ctx.isFullySolved ? "win" : null),
                leftDeckHTML: genSubCargo(Math.floor(cleanLeft / 10), cleanLeft % 10, 0, 0), leftH: finalH1, leftLabel: "Л", leftColor: "#0284c7", leftEmptyH: 0, leftCrimsonH: 0,
                rightDeckHTML: genSubFinal(cleanRight - d.finalAddedAmount, d.finalAddedAmount), rightH: isH ? Math.floor(d.num2 / 100) : 0, rightLabel: "П", rightColor: "#ef4444", rightEmptyH: 0, rightCrimsonH: 0,
                deckStyle: "border-color:#22c55e;", rightDeckStyle: "background:#e0f2fe;border-color:#ef4444;"
            };
        }
    }
];
