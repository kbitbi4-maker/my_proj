// version: v3.3
export const ADDITION_RULES = [
    {
        id: "add_p1",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 1,
        config: (ctx) => ({
            layout: "split-trucks", sound: null, phase: 1,
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
            const simPart = ctx.currentInput.split('=').at(0) || '';
            const p = simPart.split('+');
            let uL = parseInt(p, 10) || d.num1;
            let uR = parseInt(p, 10) || d.num2;
            
            let isLeftRound = ctx.simCorrect && (uL > d.num1);
            let isRightRound = ctx.simCorrect && (uR > d.num2);

            return {
                layout: "split-trucks", style: glow, sound: ctx.isWrongAnswer ? "fail" : (ctx.simCorrect ? "win" : null), phase: 2,
                // ИСПРАВЛЕНО: Правый робот теперь считает сетку от uR, а borrow передает количество прилетевших синих кубиков
                leftTruck: { label: String(uL), color: "#22c55e", isOrange: false, style: glow, hundreds: isH ? Math.floor(d.num1 / 100) : 0, tens: Math.floor(uL / 10) % 10, ones: uL % 10, borrow: isLeftRound ? d.leftBorrowCount : 0 },
                rightTruck: { label: String(uR), color: "#ea580c", isOrange: true, style: ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : '', hundreds: isH ? Math.floor(d.num2 / 100) : 0, tens: Math.floor(uR / 10) % 10, ones: uR % 10, borrow: isRightRound ? d.rightBorrowCount : 0 },
                operatorHTML: `<div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div>`
            };
        }
    },
    {
        id: "add_p3",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 3,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            return {
                layout: "merged-deck", isFullySolved: ctx.isFullySolved, sound: ctx.isWrongAnswer ? "fail" : (ctx.isFullySolved ? "win" : null), phase: 3,
                mathPayload: d,
                bottomText: ctx.isFullySolved ? (isH ? 'Ура! Сотни покорены! 🎉' : 'Ура! Ответ верный! Ты гений! 🎉') : 'Проверяем ответ... 👀',
                hundredsConfig: isH ? { purple: Math.floor(d.num1 / 100), crimson: Math.floor(d.num2 / 100), mixed: (d.tens1 * 10 + d.ones1) + (d.tens2 * 10 + d.ones2) >= 100 ? 1 : 0 } : null
            };
        }
    }
];
