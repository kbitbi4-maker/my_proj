import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';

export function renderAdditionVisual() {
    const item = state.examplesHistory[state.activeIndex];
    if (!item) return;

    // Получаем чистые математические данные
    const nums = item.exampleText.split('+');
    const num1 = parseInt(nums[0], 10), num2 = parseInt(nums[1], 10);
    const tens1 = Math.floor(num1 / 10), ones1 = num1 % 10;
    const tens2 = Math.floor(num2 / 10), ones2 = num2 % 10;

    // Получаем готовый отчет валидации из стейта
    const report = state.validateCurrentInput();
    const cacheKey = `${item.exampleText}_phase${report.phase}_${report.isFullySolved}`;

    let html = '';

    if (report.phase === 1) { // ФАЗА 1: СТАРТ
        const cols1 = generateCrystalColumnsHTML(tens1, false, 0) + generateOnesHTML(ones1, false);
        const cols2 = generateCrystalColumnsHTML(tens2, true, 0) + generateOnesHTML(ones2, true);
        
        html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;"><div class="crystal-truck"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:#0284c7;font-size:13px;margin-top:1px;">${num1}</b></div><div class="crystal-deck" style="margin-left:10px;">${cols1}</div></div><div style="font-size:28px;font-weight:bold;color:#94a3b8;">+</div><div class="crystal-truck"><div class="crystal-deck orange-theme" style="margin-left:10px;">${cols2}</div><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:#ea580c;font-size:13px;margin-top:1px;">${num2}</b></div></div></div>`;
    } 
    else if (report.phase === 2) { // ФАЗА 2: УПРОЩЕНИЕ
        let leftTens = 0, leftOnes = 0, rightTens = 0, rightOnes = 0, leftLabel = '0', rightLabel = '0';
        if (report.simText.includes('+')) {
            const userParts = report.simText.split('+');
            let leftNum = parseInt(userParts.at(0), 10), rightNum = parseInt(userParts.at(1), 10);
            if (!isNaN(leftNum)) { leftTens = Math.floor(leftNum / 10); leftOnes = leftNum % 10; leftLabel = String(leftNum); }
            if (!isNaN(rightNum)) { rightTens = Math.floor(rightNum / 10); rightOnes = rightNum % 10; rightLabel = String(rightNum); }
        } else if (report.simText.length > 0) {
            let singleNum = parseInt(report.simText, 10);
            if (!isNaN(singleNum)) { leftTens = Math.floor(singleNum / 10); leftOnes = singleNum % 10; leftLabel = String(singleNum); }
        }
        
        let leftBorrowCount = (leftTens > tens1 && leftOnes === 0 && ones1 > 0) ? 10 - ones1 : 0;
        let rightBorrowCount = (rightTens > tens2 && rightOnes === 0 && ones2 > 0) ? 10 - ones2 : 0;
        
        const cols1 = generateCrystalColumnsHTML(leftTens, false, leftBorrowCount) + generateOnesHTML(leftOnes, false);
        const cols2 = generateCrystalColumnsHTML(rightTens, true, rightBorrowCount) + generateOnesHTML(rightOnes, true);
        const borderGlow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);border-color:#22c55e;' : '';

        html = `<div style="display:flex;justify-content:space-between;width:100%;align-items:center;padding:0 15px;box-sizing:border-box;height:100%;animation:fadeIn 0.3s;"><div class="crystal-truck"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:#22c55e;font-size:13px;margin-top:1px;">${leftLabel}</b></div><div class="crystal-deck" style="margin-left:10px;${borderGlow}">${cols1}</div></div><div style="font-size:24px;font-weight:bold;color:#22c55e;">+</div><div class="crystal-truck"><div class="crystal-deck orange-theme" style="margin-right:10px;${report.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : ''}">${cols2}</div><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:#ea580c;font-size:13px;margin-top:1px;">${rightLabel}</b></div></div></div>`;
    } 
    else { // ФАЗА 3: ОТВЕТ
        let totalOnes = ones1 + ones2, leftBorrowCount = 0, rightBorrowCount = 0;
        if (totalOnes >= 10) {
            if (report.simText.includes('+')) {
                const userParts = report.simText.split('+');
                let leftNum = parseInt(userParts.at(0), 10), rightNum = parseInt(userParts.at(1), 10);
                if (!isNaN(leftNum) && Math.floor(leftNum / 10) > tens1) leftBorrowCount = 10 - ones1;
                else if (!isNaN(rightNum) && Math.floor(rightNum / 10) > tens2) rightBorrowCount = 10 - ones2;
            } else { leftBorrowCount = 10 - ones1; }
            totalOnes -= 10;
        }
        
        let deckContentHTML = '';
        if (rightBorrowCount > 0) {
            deckContentHTML += generateOnesHTML(totalOnes, false) + generateCrystalColumnsHTML(tens1, false, 0) + generateCrystalColumnsHTML(tens2, true, 0) + generateCrystalColumnsHTML(1, true, rightBorrowCount);
        } else if (leftBorrowCount > 0) {
            deckContentHTML += generateCrystalColumnsHTML(tens1, false, 0) + generateCrystalColumnsHTML(1, false, leftBorrowCount) + generateCrystalColumnsHTML(tens2, true, 0) + generateOnesHTML(totalOnes, true);
        } else {
            deckContentHTML += generateCrystalColumnsHTML(tens1, false, 0) + generateOnesHTML(ones1, false) + generateCrystalColumnsHTML(tens2, true, 0) + generateOnesHTML(ones2, true);
        }
        
        const lAnim = report.isFullySolved ? 'add-robot-left-drive' : '';
        const rAnim = report.isFullySolved ? 'add-robot-right-drive' : '';
        const jumpL = report.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate;' : '';
        const jumpR = report.isFullySolved ? 'animation:monsterJump 0.5s infinite alternate-reverse;' : '';

        html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;"><div class="win-layout" style="display:flex;align-items:center;justify-content:center;position:relative;"><div class="${lAnim}"><div style="${jumpL}"><span style="font-size:36px;line-height:1;">🤖</span></div></div><div class="crystal-deck" style="background:#f0fdf4;border-color:#4ade80;margin:0 10px;">${deckContentHTML}</div><div class="${rAnim}"><div style="${jumpR}"><span style="font-size:36px;line-height:1;">🤖</span></div></div></div><b style="color:#22c55e;font-size:14px;margin-top:8px;">${report.isFullySolved ? 'Ура! Ответ верный! Ты гений! 🎉' : 'Проверяем ответ... 👀'}</b></div>`;
    }

    GameCanvas.renderZoneScene(html, cacheKey);
}

function generateCrystalColumnsHTML(count, isOrange, borrowCount) {
    let html = '';
    for (let i = 0; i < count; i++) {
        let isLast = (i === count - 1) && (borrowCount > 0);
        html += GameCanvas.createColumnHTML({ totalCount: 10, filledCount: 10, blueCount: isLast ? 10 - borrowCount : (isOrange ? 0 : 10) });
    }
    return html;
}

function generateOnesHTML(count, isOrange) {
    if (count === 0) return '';
    return GameCanvas.createColumnHTML({ totalCount: count, filledCount: count, blueCount: isOrange ? 0 : count, dashedBorder: true });
}
