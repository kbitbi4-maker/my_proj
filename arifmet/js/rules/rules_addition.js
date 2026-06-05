// version: v3.0
import { drawVectorDeck } from './rules_utils.js';

export const ADDITION_RULES = [
    {
        id: "add_p1",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 1,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            let tL = Math.ceil((d.tens1 * 10 + d.ones1) / 10) * 10, tR = Math.ceil((d.tens2 * 10 + d.ones2) / 10) * 10;
            return {
                layout: "split-trucks", sound: null, phase: 1,
                leftTruck: { label: String(d.num1), color: "#0284c7", isOrange: false, hundreds: isH ? Math.floor(d.num1 / 100) : 0, base: d.tens1 * 10 + d.ones1, get: 0, give: 0, target: tL },
                rightTruck: { label: String(d.num2), color: "#ea580c", isOrange: true, hundreds: isH ? Math.floor(d.num2 / 100) : 0, base: d.tens2 * 10 + d.ones2, get: 0, give: 0, target: tR },
                operatorHTML: `<div style="font-size:28px;font-weight:bold;color:#94a3b8;">+</div>`
            };
        }
    },
    {
        id: "add_p2",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 2,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            const glow = ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : '';
            const p = ctx.currentInput.split('=').at(0).split('+');
            let uL = parseInt(p, 10) || d.num1, uR = parseInt(p, 10) || d.num2;
            
            let isLeftRound = ctx.simCorrect && (uL > d.num1), isRightRound = ctx.simCorrect && (uR > d.num2);
            let bL = d.tens1 * 10 + d.ones1, bR = d.tens2 * 10 + d.ones2;

            return {
                layout: "split-trucks", style: glow, sound: ctx.isWrongAnswer ? "fail" : (ctx.simCorrect ? "win" : null), phase: 2,
                leftTruck: { label: String(uL), color: "#22c55e", isOrange: false, style: glow, hundreds: isH ? Math.floor(d.num1 / 100) : 0, base: bL, get: isLeftRound ? d.leftBorrowCount : 0, give: isRightRound ? d.rightBorrowCount : 0, target: isLeftRound ? bL + d.leftBorrowCount : bL },
                rightTruck: { label: String(uR), color: "#ea580c", isOrange: true, style: ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : '', hundreds: isH ? Math.floor(d.num2 / 100) : 0, base: bR, get: isRightRound ? d.rightBorrowCount : 0, give: isLeftRound ? d.leftBorrowCount : 0, target: isRightRound ? bR + d.rightBorrowCount : bR },
                operatorHTML: `<div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div>`
            };
        }
    },
    {
        id: "add_p3",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 3,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            const p = ctx.currentInput.split('=').at(0).split('+');
            let isLeftRound = (parseInt(p, 10) || d.num1) > d.num1;
            
            let totalLeft = d.tens1 * 10 + d.ones1, totalRight = d.tens2 * 10 + d.ones2;
            let deckHTML = isLeftRound 
                ? drawVectorDeck(totalLeft, d.leftBorrowCount, 0, totalLeft + d.leftBorrowCount, false) + drawVectorDeck(totalRight, 0, d.leftBorrowCount, totalRight, true)
                : drawVectorDeck(totalLeft, 0, d.rightBorrowCount, totalLeft, false) + drawVectorDeck(totalRight, d.rightBorrowCount, 0, totalRight + d.rightBorrowCount, true);

            return {
                layout: "merged-deck", isFullySolved: ctx.isFullySolved, sound: ctx.isWrongAnswer ? "fail" : (ctx.isFullySolved ? "win" : null), phase: 3, deckHTML,
                bottomText: ctx.isFullySolved ? (isH ? 'Ура! Сотни покорены! 🎉' : 'Ура! Ответ верный! Ты гений! 🎉') : 'Проверяем ответ... 👀',
                hundredsConfig: isH ? { purple: Math.floor(d.num1 / 100), crimson: Math.floor(d.num2 / 100), mixed: (totalLeft + totalRight) >= 100 ? 1 : 0 } : null
            };
        }
    }
];
