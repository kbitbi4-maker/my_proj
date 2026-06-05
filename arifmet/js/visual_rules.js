// version: v1.1

export const VISUAL_RULES = {
    // === ОБЪЕДИНЕННЫЕ ПРАВИЛА СЛОЖЕНИЯ (ДЕСЯТКИ И СОТНИ) ===
    addition: [
        {
            id: "add_phase_1",
            match: (ctx) => ctx.operation === '+' && ctx.phase === 1,
            config: (ctx) => {
                const data = ctx.math;
                const isH = ctx.mode === 'hundreds';
                return {
                    layout: "split-trucks",
                    leftTruck: {
                        label: String(data.num1),
                        color: "#0284c7",
                        isOrange: false,
                        hundreds: isH ? Math.floor(data.num1 / 100) : 0,
                        tens: data.tens1,
                        ones: data.ones1,
                        borrow: 0
                    },
                    rightTruck: {
                        label: String(data.num2),
                        color: "#ea580c",
                        isOrange: true,
                        hundreds: isH ? Math.floor(data.num2 / 100) : 0,
                        tens: data.tens2,
                        ones: data.ones2,
                        borrow: 0
                    },
                    operatorHTML: `<div style="font-size:28px;font-weight:bold;color:#94a3b8;">+</div>`
                };
            }
        },
        {
            id: "add_phase_2",
            match: (ctx) => ctx.operation === '+' && ctx.phase === 2,
            config: (ctx) => {
                const data = ctx.math;
                const isH = ctx.mode === 'hundreds';
                const borderGlow = ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : '';
                const rightGlow = ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : '';
                
                let leftH = isH ? Math.floor(data.num1 / 100) : 0;
                let rightH = isH ? Math.floor(data.num2 / 100) : 0;
                let leftMixedH = 0;
                let rightMixedH = 0;

                if (isH && ctx.currentInput.includes('+')) {
                    const simPart = ctx.currentInput.split('=')[0] || '';
                    const parts = simPart.split('+');
                    const leftNum = parseInt(parts[0], 10);
                    const rightNum = parseInt(parts[1], 10);
                    if (!isNaN(leftNum) && !isNaN(rightNum)) {
                        const newH1 = Math.floor(leftNum / 100);
                        const newH2 = Math.floor(rightNum / 100);
                        if (newH1 > leftH) { leftMixedH = newH1 - leftH; }
                        if (newH2 > rightH) { rightMixedH = newH2 - rightH; }
                    }
                }

                return {
                    layout: "split-trucks",
                    style: borderGlow,
                    leftTruck: {
                        label: data.leftLabel,
                        color: "#22c55e",
                        isOrange: false,
                        style: borderGlow,
                        hundreds: leftH,
                        mixedHundreds: leftMixedH,
                        tens: data.leftTens,
                        ones: data.leftOnes,
                        borrow: data.leftBorrowCount
                    },
                    rightTruck: {
                        label: data.rightLabel,
                        color: "#ea580c",
                        isOrange: true,
                        style: rightGlow,
                        hundreds: rightH,
                        mixedHundreds: rightMixedH,
                        tens: data.rightTens,
                        ones: data.rightOnes,
                        borrow: data.rightBorrowCount
                    },
                    operatorHTML: `<div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div>`
                };
            }
        },
        {
            id: "add_phase_3",
            match: (ctx) => ctx.operation === '+' && ctx.phase === 3,
            config: (ctx) => {
                const data = ctx.math;
                const isH = ctx.mode === 'hundreds';
                const h1 = isH ? Math.floor(data.num1 / 100) : 0;
                const h2 = isH ? Math.floor(data.num2 / 100) : 0;
                
                let deckHTML = '';
                let finalMixedH = 0;
                const tailSum = (data.tens1 * 10 + data.ones1) + (data.tens2 * 10 + data.ones2);
                
                if (isH && tailSum >= 100) {
                    finalMixedH = 1;
                    const remSum = tailSum - 100;
                    const remTensPurple = Math.min(data.tens1, Math.floor(remSum / 10));
                    const remTensOrange = Math.max(0, Math.floor(remSum / 10) - remTensPurple);
                    deckHTML = genColsHTML(remTensPurple, false, 0) + genColsHTML(remTensOrange, true, 0) + genOnesHTML(remSum % 10, false);
                } else {
                    if (data.rightBorrowCount > 0) {
                        deckHTML += genOnesHTML(data.totalOnes, false) + genColsHTML(data.tens1, false, 0) + genColsHTML(data.tens2, true, 0) + genColsHTML(1, true, data.rightBorrowCount);
                    } else if (data.leftBorrowCount > 0) {
                        deckHTML += genColsHTML(data.tens1, false, 0) + genColsHTML(1, false, data.leftBorrowCount) + genColsHTML(data.tens2, true, 0) + genOnesHTML(data.totalOnes, true);
                    } else {
                        deckHTML += genColsHTML(data.tens1, false, 0) + genOnesHTML(data.ones1, false) + genColsHTML(data.tens2, true, 0) + genOnesHTML(data.ones2, true);
                    }
                }

                return {
                    layout: "merged-deck",
                    isFullySolved: ctx.isFullySolved,
                    bottomText: ctx.isFullySolved ? (isH ? 'Ура! Сотни покорены! 🎉' : 'Ура! Ответ верный! Ты гений! 🎉') : 'Проверяем ответ... 👀',
                    hundredsConfig: isH ? { purple: h1, crimson: h2, mixed: finalMixedH } : null,
                    deckHTML: deckHTML
                };
            }
        }
    ]
};

function genColsHTML(count, isOrange, borrow) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-column">`;
        let isLast = (i === count - 1) && (borrow > 0);
        for (let j = 1; j <= 10; j++) {
            html += `<div class="crystal-item ${(isLast && j > (10 - borrow)) ? (isOrange ? 'borrow-blue' : 'borrow-orange') : (isOrange ? 'borrow-orange' : 'borrow-blue')}"></div>`;
        }
        html += `</div>`;
    }
    return html;
}

function genOnesHTML(count, isOrange) {
    if (count === 0) return '';
    let html = `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
    for (let j = 1; j <= 10; j++) {
        html += (j <= count) ? `<div class="crystal-item ${isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
    }
    return html + `</div>`;
}
