// version: v5.1
import { buildTruckHTML, generateCrystalColumnsHTML, generateOnesHTML, genHundreds } from './rules_utils.js';

export const ADDITION_RULES = [
    {
        id: "add_p1",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 1,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            const hL = isH ? genHundreds(Math.floor(d.num1 / 100), 0, 0, 0) : '';
            const hR = isH ? genHundreds(Math.floor(d.num2 / 100), 0, 0, 0) : '';
            return {
                layout: "custom", sound: null,
                html: buildTruckHTML(d.num1, '#0284c7', hL + generateCrystalColumnsHTML(d.tens1, false, 0) + generateOnesHTML(d.ones1, false), 'margin-left:10px;') + 
                      `<div style="font-size:28px;font-weight:bold;color:#94a3b8;">+</div>` + 
                      buildTruckHTML(d.num2, '#ea580c', hR + generateCrystalColumnsHTML(d.tens2, true, 0) + generateOnesHTML(d.ones2, true), 'margin-left:10px;', true)
            };
        }
    },
    {
        id: "add_p2",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 2,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            const borderGlow = ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : '';
            const hL = isH ? genHundreds(Math.floor(d.num1 / 100), 0, 0, 0) : '';
            const hR = isH ? genHundreds(Math.floor(d.num2 / 100), 0, 0, 0) : '';
            return {
                layout: "custom", sound: ctx.isWrongAnswer ? "fail" : (ctx.simCorrect ? "win" : null),
                html: buildTruckHTML(d.leftLabel, '#22c55e', hL + generateCrystalColumnsHTML(d.leftTens, false, d.leftBorrowCount) + generateOnesHTML(d.leftOnes, false), `margin-left:10px;${borderGlow}`) + 
                      `<div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div>` + 
                      buildTruckHTML(d.rightLabel, '#ea580c', hR + generateCrystalColumnsHTML(d.rightTens, true, d.rightBorrowCount) + generateOnesHTML(d.rightOnes, true), `margin-right:10px;${ctx.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : ''}`, true)
            };
        }
    },
    {
        id: "add_p3",
        match: (ctx) => ctx.operation === '+' && ctx.phase === 3,
        config: (ctx) => {
            const d = ctx.math; const isH = ctx.mode === 'hundreds';
            let deckContentHTML = '';
            if (d.rightBorrowCount > 0) {
                deckContentHTML += generateOnesHTML(d.totalOnes, false) + generateCrystalColumnsHTML(d.tens1, false, 0) + generateCrystalColumnsHTML(d.tens2, true, 0) + generateCrystalColumnsHTML(1, true, d.rightBorrowCount);
            } else if (d.leftBorrowCount > 0) {
                deckContentHTML += generateCrystalColumnsHTML(d.tens1, false, 0) + generateCrystalColumnsHTML(1, false, d.leftBorrowCount) + generateCrystalColumnsHTML(d.tens2, true, 0) + generateOnesHTML(d.totalOnes, true);
            } else {
                deckContentHTML += generateCrystalColumnsHTML(d.tens1, false, 0) + generateOnesHTML(d.ones1, false) + generateCrystalColumnsHTML(d.tens2, true, 0) + generateOnesHTML(d.ones2, true);
            }        
            const lAnim = ctx.isFullySolved ? 'add-robot-left-drive' : '', rAnim = ctx.isFullySolved ? 'add-robot-right-drive' : '';
            const jumpL = ctx.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate;' : '', jumpR = ctx.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate-reverse;' : '';
            const hCryst = isH ? genHundreds(Math.floor(d.num1 / 100), Math.floor(d.num2 / 100), (d.tens1 * 10 + d.ones1) + (d.tens2 * 10 + d.ones2) >= 100 ? 1 : 0, 0) : '';
            return {
                layout: "custom", sound: ctx.isWrongAnswer ? "fail" : (ctx.isFullySolved ? "win" : null),
                html: `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;"><div class="win-layout" style="display:flex;align-items:center;justify-content:center;position:relative;"><div class="${lAnim}"><div style="${jumpL}"><span style="font-size:36px;line-height:1;">🤖</span></div></div><div class="crystal-deck" style="background:#f0fdf4;border-color:#4ade80;margin:0 10px;display:flex;flex-direction:column;gap:5px;align-items:flex-start;padding:4px;">${hCryst}<div style="display:flex;gap:3px;align-items:flex-end;">${deckContentHTML}</div></div><div class="${rAnim}"><div style="${jumpR}"><span style="font-size:36px;line-height:1;">🤖</span></div></div></div><b style="color:#22c55e;font-size:14px;margin-top:8px;">${ctx.isFullySolved ? 'Ура! Ответ верный! Ты гений! 🎉' : 'Проверяем ответ... 👀'}</b></div>`
            };
        }
    }
];
