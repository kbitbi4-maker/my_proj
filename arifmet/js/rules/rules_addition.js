// version: v1.6
import { genCols, genOnes } from './rules_utils.js';

export const ADDITION_RULES = [
    {
        id: "add_p1",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 1,
        config: (ctx) => ({
            layout: "split-trucks",
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
            const simPart = ctx.currentInput.split('=')[0] || '';
            if (isH && simPart.includes('+')) {
                const parts = simPart.split('+');
                const n1 = parseInt(parts[0], 10), n2 = parseInt(parts[1], 10);
                if (!isNaN(n1) && !isNaN(n2)) { if (Math.floor(n1 / 100) > lH) lM = Math.floor(n1 / 100) - lH; if (Math.floor(n2 / 100) > rH) rM = Math.floor(n2 / 100) - rH; }
            }
            const p = simPart.split('+');
            let uL = parseInt(p[0], 10) || d.num1, uR = parseInt(p[1], 10) || d.num2;
            return {
                layout: "split-trucks", style: glow,
                leftTruck: { label: ctx.simCorrect ? String(uL) : d.leftLabel, color: "#22c55e", isOrange: false, style: glow, hundreds: lH, mixedHundreds: lM, tens: Math.floor(uL / 10) % 10, ones: uL % 10, borrow: ctx.simCorrect ? d.leftBorrowCount : 0 },
                // ЖЕСТКОЕ ИСПРАВЛЕНИЕ: Правый грузовик в Фазе 2 отображает СТРОГО остаток кубиков, borrow равен 0
                rightTruck: { label: ctx.simCorrect ? String(uR) : d.rightLabel, color: "#ea580c", isOrange: true, style: ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : '', hundreds: rH, mixedHundreds: rM, tens: Math.floor(uR / 10) % 10, ones: uR % 10, borrow: 0 },
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
            if (isH && tailSum >= 100) {
                finalMixedH = 1; const rem = tailSum - 100; const pTens = Math.min(d.tens1, Math.floor(rem / 10));
                deckHTML = genCols(pTens, false, 0) + genCols(Math.max(0, Math.floor(rem / 10) - pTens), true, 0) + genOnes(rem % 10, false);
            } else {
                if (d.rightBorrowCount > 0) deckHTML += genOnes(d.totalOnes, false) + genCols(d.tens1, false, 0) + genCols(d.tens2, true, 0) + genCols(1, true, d.rightBorrowCount);
                else if (d.leftBorrowCount > 0) deckHTML += genCols(d.tens1, false, 0) + genCols(1, false, d.leftBorrowCount) + genCols(d.tens2, true, 0) + genOnes(d.totalOnes, true);
                else deckHTML += genCols(d.tens1, false, 0) + genOnes(d.ones1, false) + genCols(d.tens2, true, 0) + genOnes(d.ones2, true);
            }
            return {
                layout: "merged-deck", isFullySolved: ctx.isFullySolved, deckHTML: deckHTML,
                bottomText: ctx.isFullySolved ? (isH ? 'Ура! Сотни покорены! 🎉' : 'Ура! Ответ верный! Ты гений! 🎉') : 'Проверяем ответ... 👀',
                hundredsConfig: isH ? { purple: Math.floor(d.num1 / 100), crimson: Math.floor(d.num2 / 100), mixed: finalMixedH } : null
            };
        }
    }
];
