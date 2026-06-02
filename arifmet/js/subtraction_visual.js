import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';

export function renderSubtractionVisual() {
    const item = state.examplesHistory[state.activeIndex];
    if (!item) return;

    const nums = item.exampleText.split('-');
    const num1 = parseInt(nums[0], 10), num2 = parseInt(nums[1], 10);
    const tens1 = Math.floor(num1 / 10), ones1 = num1 % 10;

    const report = state.validateCurrentInput();
    const cacheKey = `${item.exampleText}_phase${report.phase}_${report.isFullySolved}`;

    let html = '';

    if (report.phase === 1) { // ФАЗА 1: СТАРТ
        html = `<div class="sub-scene-container"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л (${num1})</b></div><div class="crystal-deck" style="border-color:#0284c7;">${generateSubCargoHTML(tens1, ones1, 0, 0)}</div><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П (${num2})</b></div><div class="crystal-deck" style="border:2px solid #000;background:rgba(0,0,0,0.03);">${generateSubEmptyCubesHTML(num2, 0)}</div></div>`;
    } 
    else if (report.phase === 2) { // ФАЗА 2: УПРОЩЕНИЕ
        let currentSubtrahend = num2, addedAmount = 0, subtractedAmount = 0;
        if (report.simText.includes('-')) {
            let userSub = parseInt(report.simText.split('-').at(1), 10);
            if (!isNaN(userSub)) {
                currentSubtrahend = userSub;
                if (currentSubtrahend > num2) addedAmount = currentSubtrahend - num2;
                else if (currentSubtrahend < num2) subtractedAmount = num2 - currentSubtrahend;
            }
        }
        
        const borderColor = report.simCorrect ? '#22c55e' : '#0284c7';
        const shadow = report.simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : '';

        html = `<div class="sub-scene-container" style="animation:fadeIn 0.3s;"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л</b></div><div class="crystal-deck" style="border-color:${borderColor};${shadow}">${generateSubCargoHTML(tens1, ones1, addedAmount, subtractedAmount)}</div><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П</b></div><div class="crystal-deck" style="border:2px solid #000;">${generateSubEmptyCubesHTML(num2 - subtractedAmount, addedAmount)}</div></div>`;
    } 
    else { // ФАЗА 3: ОТВЕТ
        let currentSubtrahend = num2, addedAmount = 0;
        if (report.simText.includes('-')) {
            let userSub = parseInt(report.simText.split('-').at(1), 10);
            if (!isNaN(userSub) && userSub > num2) addedAmount = userSub - num2;
        }
        
        const driveAwayClass = report.isFullySolved ? 'sub-drive-away' : '';
        const labelText = report.isFullySolved ? 'Ура! Робот П уехал с правильным грузом! 🎉' : 'Проверяем ответ... 👀';

        html = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;animation:fadeIn 0.4s;overflow:hidden;position:relative;"><div style="display:flex;align-items:center;justify-content:center;gap:20px;width:100%;"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л</b></div><div class="crystal-deck" style="border-color:#22c55e;">${generateSubCargoHTML(tens1, ones1, 0, currentSubtrahend)}</div><div class="${driveAwayClass}" style="display:flex;align-items:center;gap:20px;"><div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П</b></div><div class="crystal-deck" style="background:#e0f2fe;border-color:#ef4444;">${generateSubFinalCubesHTML(currentSubtrahend - addedAmount, addedAmount)}</div></div></div><b class="sub-win-text">${labelText}</b></div>`;
    }

    GameCanvas.renderZoneScene(html, cacheKey);
}

function generateSubCargoHTML(tens, ones, added, subtracted) {
    let baseCubes = (tens * 10) + ones, totalCubes = baseCubes + added, activeCubes = totalCubes - subtracted;
    let fullCols = Math.floor(totalCubes / 10), remOnes = totalCubes % 10;
    
    let html = '';
    for (let i = 0; i < fullCols; i++) {
        html += GameCanvas.createColumnHTML({ totalCount: 10, filledCount: activeCubes - (i * 10), blueCount: baseCubes - (i * 10) });
    }
    if (remOnes > 0) {
        html += GameCanvas.createColumnHTML({ totalCount: remOnes, filledCount: activeCubes - (fullCols * 10), blueCount: baseCubes - (fullCols * 10), dashedBorder: true });
    }
    return html;
}

function generateSubEmptyCubesHTML(emptyCount, addedOrange) {
    let total = emptyCount + addedOrange, fullCols = Math.floor(total / 10), remOnes = total % 10;
    let html = '';
    for (let i = 0; i < fullCols; i++) {
        html += GameCanvas.createColumnHTML({ totalCount: 10, filledCount: 10, blueCount: -addedOrange });
    }
    if (remOnes > 0) {
        html += GameCanvas.createColumnHTML({ totalCount: remOnes, filledCount: remOnes, blueCount: -addedOrange, dashedBorder: true });
    }
    return html;
}

function generateSubFinalCubesHTML(blueCount, orangeCount) {
    let total = blueCount + orangeCount, fullCols = Math.floor(total / 10), remOnes = total % 10;
    let html = '';
    for (let i = 0; i < fullCols; i++) {
        html += GameCanvas.createColumnHTML({ totalCount: 10, filledCount: 10, blueCount: blueCount - (i * 10) });
    }
    if (remOnes > 0) {
        html += GameCanvas.createColumnHTML({ totalCount: remOnes, filledCount: remOnes, blueCount: blueCount - (fullCols * 10), dashedBorder: true });
    }
    return html;
}
