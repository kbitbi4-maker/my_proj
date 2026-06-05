// version: v4.0
export const ADDITION_RULES = [
    {
        id: "add_p1",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 1,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            return {
                layout: "split-trucks", sound: null, phase: 1,
                leftTruck: { label: String(d.num1), textColor: "#0284c7", isLeftRobot: true, vector: { baseColor: "borrow-blue", borrowColor: "borrow-orange", mega: isH ? Math.floor(d.num1 / 100) : 0, tens: d.tens1, ones: d.ones1, getOnes: 0, giveOnes: 0 } },
                rightTruck: { label: String(d.num2), textColor: "#ea580c", isLeftRobot: false, themeClass: "orange-theme", vector: { baseColor: "borrow-orange", borrowColor: "borrow-blue", mega: isH ? Math.floor(d.num2 / 100) : 0, tens: d.tens2, ones: d.ones2, getOnes: 0, giveOnes: 0 } },
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
            
            // Железная универсальная логика: определяем направление обмена по числам ввода
            let isLeftRound = ctx.simCorrect && (uL > d.num1);
            let isRightRound = ctx.simCorrect && (uR > d.num2);
            let exchangeCount = isLeftRound ? d.leftBorrowCount : (isRightRound ? d.rightBorrowCount : 0);

            return {
                layout: "split-trucks", style: glow, sound: ctx.isWrongAnswer ? "fail" : (ctx.simCorrect ? "win" : null), phase: 2,
                leftTruck: { label: String(uL), textColor: "#22c55e", style: glow, isLeftRobot: true, vector: { baseColor: "borrow-blue", borrowColor: "borrow-orange", mega: isH ? Math.floor(d.num1 / 100) : 0, tens: d.tens1, ones: d.ones1, getOnes: isLeftRound ? exchangeCount : 0, giveOnes: isRightRound ? exchangeCount : 0 } },
                rightTruck: { label: String(uR), textColor: "#ea580c", isLeftRobot: false, themeClass: "orange-theme", vector: { baseColor: "borrow-orange", borrowColor: "borrow-blue", mega: isH ? Math.floor(d.num2 / 100) : 0, tens: d.tens2, ones: d.ones2, getOnes: isRightRound ? exchangeCount : 0, giveOnes: isLeftRound ? exchangeCount : 0 } },
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
            
            // Финальная сборка общего поддона из двух независимых векторов
            let htmlL = drawGenericNumber({ baseColor: "borrow-blue", borrowColor: "borrow-orange", mega: isH ? Math.floor(d.num1 / 100) : 0, tens: d.tens1, ones: d.ones1, getOnes: isLeftRound ? d.leftBorrowCount : 0, giveOnes: !isLeftRound ? d.rightBorrowCount : 0 });
            let htmlR = drawGenericNumber({ baseColor: "borrow-orange", borrowColor: "borrow-blue", mega: isH ? Math.floor(d.num2 / 100) : 0, tens: d.tens2, ones: d.ones2, getOnes: !isLeftRound ? d.rightBorrowCount : 0, giveOnes: isLeftRound ? d.leftBorrowCount : 0 });

            return {
                layout: "merged-deck", isFullySolved: ctx.isFullySolved, sound: ctx.isWrongAnswer ? "fail" : (ctx.isFullySolved ? "win" : null), phase: 3, 
                deckHTML: `<div style="display:flex; gap:10px; align-items:flex-end;">${htmlL}${htmlR}</div>`,
                bottomText: ctx.isFullySolved ? (isH ? 'Ура! Сотни покорены! 🎉' : 'Ура! Ответ верный! Ты гений! 🎉') : 'Проверяем ответ... 👀',
                hundredsConfig: isH ? { purple: Math.floor(d.num1 / 100), crimson: Math.floor(d.num2 / 100), mixed: (d.tens1 * 10 + d.ones1) + (d.tens2 * 10 + d.ones2) >= 100 ? 1 : 0 } : null
            };
        }
    }
];
