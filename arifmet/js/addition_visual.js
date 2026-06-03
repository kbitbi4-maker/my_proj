import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';

export function renderAdditionVisual() {
    const item = state.examplesHistory[state.activeIndex];
    if (!item) return;

    const nums = item.exampleText.split('+');
    const num1 = parseInt(nums[0], 10), num2 = parseInt(nums[1], 10);
    const tens1 = Math.floor(num1 / 10), ones1 = num1 % 10;
    const tens2 = Math.floor(num2 / 10), ones2 = num2 % 10;

    const report = state.validateCurrentInput();
    const cacheKey = `${item.exampleText}_phase${report.phase}_${report.isFullySolved}`;

    let html = '';

    if (report.phase === 1) { // ФАЗА 1: СТАРТ (Чистые раздельные грузы)
        html = `<div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 15px; box-sizing:border-box; height:100%;">
                <div class="crystal-truck">
                    <div style="display:flex; flex-direction:column; align-items:center;"><span style="font-size:36px; line-height:1;">🤖</span><b style="color:#0284c7; font-size:13px; margin-top:1px;">${num1}</b></div>
                    <div class="crystal-deck" style="margin-left:10px;">${generateCrystalColumnsHTML(tens1, false, 0)}${generateOnesHTML(ones1, false)}</div>
                </div>
                <div style="font-size:28px; font-weight:bold; color:#94a3b8;">+</div>
                <div class="crystal-truck">
                    <div class="crystal-deck orange-theme" style="margin-left:10px;">${generateCrystalColumnsHTML(tens2, true, 0)}${generateOnesHTML(ones2, true)}</div>
                    <div style="display:flex; flex-direction:column; align-items:center;"><span style="font-size:36px; line-height:1;">🤖</span><b style="color:#ea580c; font-size:13px; margin-top:1px;">${num2}</b></div>
                </div>
            </div>`;
    } 
    else if (report.phase === 2) { // ФАЗА 2: УПРОЩЕНИЕ (Один взял у другого, кубики меняют цвет)
        let leftTens = 0, leftOnes = 0, rightTens = 0, rightOnes = 0, leftLabel = '0', rightLabel = '0';
        if (report.simText.includes('+')) {
            const userParts = report.simText.split('+');
            let leftNum = parseInt(userParts[0], 10), rightNum = parseInt(userParts[1], 10);
            if (!isNaN(leftNum)) { leftTens = Math.floor(leftNum / 10); leftOnes = leftNum % 10; leftLabel = String(leftNum); }
            if (!isNaN(rightNum)) { rightTens = Math.floor(rightNum / 10); rightOnes = rightNum % 10; rightLabel = String(rightNum); }
        } else if (report.simText.length > 0) {
            let singleNum = parseInt(report.simText, 10);
            if (!isNaN(singleNum)) { leftTens = Math.floor(singleNum / 10); leftOnes = singleNum % 10; leftLabel = String(singleNum); }
        }
        
        let leftBorrowCount = (leftTens > tens1 && leftOnes === 0 && ones1 > 0) ? 10 - ones1 : 0;
        let rightBorrowCount = (rightTens > tens2 && rightOnes === 0 && ones2 > 0) ? 10 - ones2 : 0;
        
        const borderGlow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : '';

        html = `<div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 15px; box-sizing:border-box; height:100%; animation:fadeIn 0.3s;">
                <div class="crystal-truck">
                    <div style="display:flex; flex-direction:column; align-items:center;"><span style="font-size:36px; line-height:1;">🤖</span><b style="color:#22c55e; font-size:13px; margin-top:1px;">${leftLabel}</b></div>
                    <div class="crystal-deck" style="margin-left:10px; ${borderGlow}">${generateCrystalColumnsHTML(leftTens, false, leftBorrowCount)}${generateOnesHTML(leftOnes, false)}</div>
                </div>
                <div style="font-size:24px; font-weight:bold; color:#22c55e;">+</div>
                <div class="crystal-truck">
                    <div class="crystal-deck orange-theme" style="margin-right:10px; ${report.simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : ''}">${generateCrystalColumnsHTML(rightTens, true, rightBorrowCount)}${generateOnesHTML(rightOnes, true)}</div>
                    <div style="display:flex; flex-direction:column; align-items:center;"><span style="font-size:36px; line-height:1;">🤖</span><b style="color:#ea580c; font-size:13px; margin-top:1px;">${rightLabel}</b></div>
                </div>
            </div>`;
    } 
    else { // ФАЗА 3: ОТВЕТ (Общий груз, идеальное сохранение оригинального цвета каждого кубика)
        let totalOnes = ones1 + ones2, leftBorrowCount = 0, rightBorrowCount = 0;
        if (totalOnes >= 10) {
            if (report.simText.includes('+')) {
                const userParts = report.simText.split('+');
                let leftNum = parseInt(userParts[0], 10), rightNum = parseInt(userParts[1], 10);
                if (!isNaN(leftNum) && Math.floor(leftNum / 10) > tens1) leftBorrowCount = 10 - ones1;
                else if (!isNaN(rightNum) && Math.floor(rightNum / 10) > tens2) rightBorrowCount = 10 - ones2;
            } else { leftBorrowCount = 10 - ones1; }
            totalOnes -= 10;
        }
        
        let deckContentHTML = '';
        if (rightBorrowCount > 0) { // Правый забрал у левого (например, 23+19 -> 22+20)
            deckContentHTML += generateOnesHTML(totalOnes, false); // 2 синих единицы слева
            deckContentHTML += generateCrystalColumnsHTML(tens1, false, 0); // 2 синих полных десятка
            deckContentHTML += generateCrystalColumnsHTML(tens2, true, 0); // 1 оранжевый полный десяток
            deckContentHTML += generateCrystalColumnsHTML(1, true, rightBorrowCount); // Смешанный десяток: 9 оранжевых снизу + 1 синий сверху
        } else if (leftBorrowCount > 0) { // Левый забрал у правого
            deckContentHTML += generateCrystalColumnsHTML(tens1, false, 0);
            deckContentHTML += generateCrystalColumnsHTML(1, false, leftBorrowCount); // Смешанный десяток: синие + оранжевые сверху
            deckContentHTML += generateCrystalColumnsHTML(tens2, true, 0);
            deckContentHTML += generateOnesHTML(totalOnes, true); // Неполный десяток у правого ложится в самый правый край
        } else { // Без заимствования (если такое будет)
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

function generateCrystalColumnsHTML(count, isOrangeTheme, borrowCount) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-column">`;
        let isLastColumn = (i === count - 1) && (borrowCount > 0);
        for (let j = 1; j <= 10; j++) {
            let extraClass = '';
            if (isLastColumn && j > (10 - borrowCount)) {
                // Кубики на верхушке смешанного десятка меняют цвет на противоположный
                extraClass = isOrangeTheme ? 'borrow-blue' : 'borrow-orange';
            } else {
                extraClass = isOrangeTheme ? 'borrow-orange' : 'borrow-blue';
            }
            html += `<div class="crystal-item ${extraClass}"></div>`;
        }
        html += `</div>`;
    }
    return html;
}

function generateOnesHTML(count, isOrangeTheme) {
    if (count === 0) return '';
    let html = `<div class="crystal-column" style="margin-left:6px; border-left:1px dashed #cbd5e1; padding-left:4px;">`;
    for (let j = 1; j <= 10; j++) {
        if (j <= count) {
            html += `<div class="crystal-item ${isOrangeTheme ? 'borrow-orange' : 'borrow-blue'}"></div>`;
        } else {
            html += `<div class="crystal-item" style="background:transparent; border-color:transparent; box-shadow:none;"></div>`;
        }
    }
    return html + `</div>`;
}
