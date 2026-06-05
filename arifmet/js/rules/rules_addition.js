// version: v1.9
import { genCols, genOnes } from './rules_utils.js';

export const ADDITION_RULES = [
    {
        id: "add_p1",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 1,
        config: (ctx) => ({
            layout: "split-trucks", sound: null,
            leftTruck: { label: String(ctx.math.num1), color: "#0284c7", isOrange: false, hundreds: ctx.mode === 'hundreds' ? Math.floor(ctx.math.num1 / 100) : 0, tens: ctx.math.tens1, ones: ctx.math.ones1, borrow: 0 },
            rightTruck: { label: String(ctx.math.num2), color: "#ea580c", isOrange: true, hundreds: ctx.mode === 'hundreds' ? Math.floor(ctx.math.num2 / 100) : 0, tens: ctx.math.tens2, ones: ctx.math.ones2, borrow: 0 },
            operatorHTML: `<div style="font-size:28px;font-weight:bold;color:#94a3b8;">+</div>`
        })
    },
    {
        id: "add_p2",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 2,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            const glow = ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : '';
            let lH = isH ? Math.floor(d.num1 / 100) : 0, rH = isH ? Math.floor(d.num2 / 100) : 0, lM = 0, rM = 0;
            const simPart = ctx.currentInput.split('=').at(0) || '';
            
            const p = simPart.split('+');
            let uL = parseInt(p[0], 10) || d.num1, uR = parseInt(p[1], 10) || d.num2;
            
            // Определяем, в какую сторону пошёл обмен кубиками
            let isLeftOкругление = (uL > d.num1);
            
            return {
                layout: "split-trucks", style: glow, sound: ctx.isWrongAnswer ? "fail" : (ctx.simCorrect ? "win" : null),
                leftTruck: { 
                    label: ctx.simCorrect ? String(uL) : d.leftLabel, color: "#22c55e", isOrange: false, style: glow, hundreds: lH, mixedHundreds: lM, 
                    tens: Math.floor(uL / 10) % 10, ones: uL % 10, 
                    borrow: (ctx.simCorrect && isLeftOкругление) ? d.leftBorrowCount : (ctx.simCorrect ? -d.rightBorrowCount : 0) 
                },
                rightTruck: { 
                    label: ctx.simCorrect ? String(uR) : d.rightLabel, color: "#ea580c", isOrange: true, style: ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : '', hundreds: rH, mixedHundreds: rM, 
                    tens: Math.floor(uR / 10) % 10, ones: uR % 10, 
                    borrow: (ctx.simCorrect && !isLeftOкругление) ? d.rightBorrowCount : (ctx.simCorrect ? -d.leftBorrowCount : 0) 
                },
                operatorHTML: `<div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div>`
            };
        }
    },
    {
        id: "add_p3",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 3,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            let deckHTML = '', finalMixedH = 0, tailSum = (d.tens1 * 10 + d.ones1) + (d.tens2 * 10 + d.ones2);
            let totalCubes = (d.tens1 + d.tens2) * 10 + d.ones1 + d.ones2;
            deckHTML = genCols(Math.floor(totalCubes / 10), false, 0) + genOnes(totalCubes % 10, false);
            
            return {
                layout: "merged-deck", isFullySolved: ctx.isFullySolved, deckHTML: deckHTML, sound: ctx.isWrongAnswer ? "fail" : (ctx.isFullySolved ? "win" : null),
                bottomText: ctx.isFullySolved ? (isH ? 'Ура! Сотни покорены! 🎉' : 'Ура! Ответ верный! Ты гений! 🎉') : 'Проверяем ответ... 👀',
                hundredsConfig: isH ? { purple: Math.floor(d.num1 / 100), crimson: Math.floor(d.num2 / 100), mixed: tailSum >= 100 ? 1 : 0 } : null
            };
        }
    }
];
