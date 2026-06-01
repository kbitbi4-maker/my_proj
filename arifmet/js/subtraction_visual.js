function renderSubtractionVisual(num1, num2, currentInput) {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;
    const partsArr = currentInput.split('=');
    const hasPressedEqual = currentInput.includes('=');
    const simText = partsArr.length > 0 ? partsArr.at(0) : '';
    const finText = partsArr.length > 1 ? partsArr.at(1) : '';
    const targetLength = String(num1 - num2).length;
    const hasFinalAnswer = partsArr.length > 1 && finText.trim().length >= targetLength;
    let isFullyCorrect = false;
    if (hasFinalAnswer && evaluateExpr(finText) === (num1 - num2)) isFullyCorrect = true;
    const tens1 = Math.floor(num1 / 10), ones1 = num1 % 10;
    let html = '';
    if (!hasPressedEqual) { // ФАЗА 1: СТАРТ. Роботы у общего груза, пустые кубики за спиной П
        html = `<div class="sub-scene-container">
            <div class="crystal-deck" style="border-color:#ea580c;">${generateSubCargoHTML(tens1, ones1, 0, 0)}</div>
            <div style="display:flex; flex-direction:column; align-items:center;"><span style="font-size:36px; line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л (${num1})</b></div>
            <div style="display:flex; flex-direction:column; align-items:center;"><span style="font-size:36px; line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П (${num2})</b></div>
            <div class="crystal-deck sub-empty-deck">${generateSubEmptyCubesHTML(num2, 0)}</div>
        </div>`;
    } else if (hasPressedEqual && !hasFinalAnswer) { // ФАЗА 2: УПРОЩЕНИЕ. Пересчет дельты кубиков
        let currentSubtrahend = num2, addedAmount = 0, subtractedAmount = 0;
        if (simText.includes('-')) {
            let userSub = parseInt(simText.split('-').at(1), 10);
            if (!isNaN(userSub)) {
                currentSubtrahend = userSub;
                if (currentSubtrahend > num2) addedAmount = currentSubtrahend - num2;
                else if (currentSubtrahend < num2) subtractedAmount = num2 - currentSubtrahend;
            }
        }
        let simCorrect = (evaluateExpr(simText) === (num1 - num2));
        html = `<div class="sub-scene-container" style="animation:fadeIn 0.3s;">
            <div class="crystal-deck" style="border-color:${simCorrect ? '#22c55e' : '#ea580c'}; ${simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80);' : ''}">${generateSubCargoHTML(tens1, ones1, addedAmount, subtractedAmount)}</div>
            <div style="display:flex; flex-direction:column; align-items:center;"><span style="font-size:36px; line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л</b></div>
            <div style="display:flex; flex-direction:column; align-items:center;"><span style="font-size:36px; line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П</b></div>
            <div class="crystal-deck" style="border: 2px dashed #ef4444; background: rgba(254,226,226,0.1);">${generateSubEmptyCubesHTML(num2 - subtractedAmount, addedAmount)}</div>
        </div>`;
    } else { // ФАЗА 3: ОТВЕТ. Правый робот забирает кубики и уезжает
        let currentSubtrahend = num2, addedAmount = 0;
        if (simText.includes('-')) {
            let userSub = parseInt(simText.split('-').at(1), 10);
            if (!isNaN(userSub) && userSub > num2) addedAmount = userSub - num2;
        }
        html = `<div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; animation:fadeIn 0.4s; overflow:hidden; position:relative;">
            <div style="display:flex; align-items:center; justify-content:center; gap:20px; width:100%;">
                <div class="crystal-deck" style="border-color:#22c55e;">${generateSubCargoHTML(tens1, ones1, 0, currentSubtrahend)}</div>
                <div style="display:flex; flex-direction:column; align-items:center; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''}"><span style="font-size:36px; line-height:1;">🤖</span><b class="sub-robot-label" style="color:#0284c7;">Л</b></div>
                <div class="${isFullyCorrect ? 'sub-drive-away' : ''}" style="display:flex; align-items:center; gap:20px;">
                    <div style="display:flex; flex-direction:column; align-items:center;"><span style="font-size:36px; line-height:1;">🤖</span><b class="sub-robot-label" style="color:#ef4444;">П</b></div>
                    <div class="crystal-deck" style="background:#e0f2fe; border-color:#3b82f6;">${generateSubFinalCubesHTML(currentSubtrahend - addedAmount, addedAmount)}</div>
                </div>
            </div>
            <b class="sub-win-text">${isFullyCorrect ? 'Ура! Робот П уехал с правильным грузом! 🎉' : 'Проверяем ответ... 👀'}</b>
        </div>`;
    }
    gameZone.innerHTML = html;
}
function generateSubCargoHTML(tens, ones, added, subtracted) {
    let html = '', totalCubes = (tens * 10) + ones + added, activeCubes = totalCubes - subtracted;
    let fullColumns = Math.floor(totalCubes / 10), remOnes = totalCubes % 10, globalCounter = 0;
    for (let i = 0; i < fullColumns; i++) { // Строим полные столбики десятков
        html += `<div class="crystal-column">`;
        for (let j = 0; j < 10; j++) {
            globalCounter++; // Потерявшие цвет кубики становятся пустыми пунктирными контурами
            let styleAttr = (globalCounter > activeCubes) ? 'style="border:2px dashed #ef4444; background:transparent; box-shadow:none;"' : '';
            html += `<div class="${(globalCounter <= activeCubes) ? 'borrow-orange' : 'crystal-item'}" ${styleAttr}></div>`;
        }
        html += `</div>`;
    }
    if (remOnes > 0) { // ИСПРАВЛЕНО: Выводим только существующие кубики без заглушек для сохранения column-reverse
        html += `<div class="crystal-column" style="margin-left:6px; border-left:1px dashed #cbd5e1; padding-left:4px;">`;
        for (let i = 0; i < remOnes; i++) {
            globalCounter++;
            let styleAttr = (globalCounter > activeCubes) ? 'style="border:2px dashed #ef4444; background:transparent; box-shadow:none;"' : '';
            html += `<div class="${(globalCounter <= activeCubes) ? 'borrow-orange' : 'crystal-item'}" ${styleAttr}></div>`;
        }
        html += `</div>`;
    }
    return html;
}
function generateSubEmptyCubesHTML(emptyCount, addedOrangeCount) {
    let html = '<div class="crystal-column">'; // Пустые кубики за спиной П
    for (let i = 0; i < emptyCount; i++) html += `<div class="crystal-item" style="border: 2px dashed #ef4444; background: transparent; box-shadow: none;"></div>`;
    for (let i = 0; i < addedOrangeCount; i++) html += `<div class="crystal-item borrow-orange"></div>`;
    return html + '</div>';
}
function generateSubFinalCubesHTML(blueCount, orangeCount) {
    let html = '<div class="crystal-column">'; // Набор кубиков, с которым уезжает П
    for (let i = 0; i < blueCount; i++) html += `<div class="crystal-item borrow-blue"></div>`;
    for (let i = 0; i < orangeCount; i++) html += `<div class="crystal-item borrow-orange"></div>`;
    return html + '</div>';
}
