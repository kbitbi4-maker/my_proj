// version: v4.2
export const ADDITION_RULES = [
    {
        id: "add_p1",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 1,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            return {
                layout: "split-trucks", sound: null, phase: 1,
                leftTruck: { label: String(d.num1), color: "#0284c7", isOrange: false, hundreds: isH ? Math.floor(d.num1 / 100) : 0, tens: d.tens1, ones: d.ones1, borrow: 0 },
                rightTruck: { label: String(d.num2), color: "#ea580c", isOrange: true, hundreds: isH ? Math.floor(d.num2 / 100) : 0, tens: d.tens2, ones: d.ones2, borrow: 0 },
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
            let lH = isH ? Math.floor(d.num1 / 100) : 0, rH = isH ? Math.floor(d.num2 / 100) : 0, lM = 0, rM = 0;
            if (isH && ctx.simCorrect) { if (d.uL > d.num1) lM = Math.floor(d.addedL / 100); if (d.uR > d.num2) rM = Math.floor(d.addedR / 100); }
            
            // На основе дельт калькулятора передаем borrow: положительное — дорисовать чужие, отрицательное — убрать свои
            return {
                layout: "split-trucks", style: glow, sound: ctx.isWrongAnswer ? "fail" : (ctx.simCorrect ? "win" : null), phase: 2,
                leftTruck: { label: String(d.uL), color: "#22c55e", isOrange: false, style: glow, hundreds: lH, mixedHundreds: lM, tens: d.tens1, ones: d.ones1, borrow: d.addedL > 0 ? d.addedL : -d.subL },
                rightTruck: { label: String(d.uR), color: "#ea580c", isOrange: true, style: ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : '', hundreds: rH, mixedHundreds: rM, tens: d.tens2, ones: d.ones2, borrow: d.addedR > 0 ? d.addedR : -d.subR },
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
