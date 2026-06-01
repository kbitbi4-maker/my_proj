function renderAdditionVisual(num1, num2, currentInput) {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;

    const partsArr = currentInput.split('=');
    const hasPressedEqual = currentInput.includes('=');
    const simText = partsArr.length > 0 ? partsArr[0] : '';
    const finText = partsArr.length > 1 ? partsArr[1] : '';

    const targetLength = String(num1 + num2).length;
    const hasFinalAnswer = partsArr.length > 1 && finText.trim().length >= targetLength;

    let isFullyCorrect = false;
    if (hasFinalAnswer) {
        let finVal = evaluateExpr(finText);
        if (finVal === (num1 + num2)) isFullyCorrect = true;
    }

    const tens1 = Math.floor(num1 / 10), ones1 = num1 % 10;
    const tens2 = Math.floor(num2 / 10), ones2 = num2 % 10;

    let html = '';

    if (!hasPressedEqual) {
        // ФАЗА 1: Старт примера. Роботы стоят в углах со своими грузами
        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 15px; box-sizing:border-box; height:100%;">
                <div class="crystal-truck">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                        <b style="color:#0284c7; font-size:13px; margin-top:1px;">${num1}</b>
                    </div>
                    <div class="crystal-deck" style="margin-left:10px;">${generateCrystalColumnsHTML(tens1)}${generateOnesHTML(ones1)}</div>
                </div>
                <div style="font-size:28px; font-weight:bold; color:#94a3b8;">+</div>
                <div class="crystal-truck">
                    <div class="crystal-deck orange-theme" style="margin-right:10px;">${generateCrystalColumnsHTML(tens2)}${generateOnesHTML(ones2)}</div>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                        <b style="color:#ea580c; font-size:13px; margin-top:1px;">${num2}</b>
                    </div>
                </div>
            </div>`;
    } else if (hasPressedEqual && !hasFinalAnswer) {
        // ФАЗА 2: УПРОЩЕНИЕ. Груз меняется интерактивно под управлением нумпада
        let leftTens = 0, leftOnes = 0;
        let rightTens = 0, rightOnes = 0;
        let leftLabel = '0', rightLabel = '0';

        if (simText.includes('+')) {
            const userParts = simText.split('+');
            let leftNum = parseInt(userParts[0], 10);
            let rightNum = parseInt(userParts[1], 10);

            if (!isNaN(leftNum)) { leftTens = Math.floor(leftNum / 10); leftOnes = leftNum % 10; leftLabel = String(leftNum); }
            if (!isNaN(rightNum)) { rightTens = Math.floor(rightNum / 10); rightOnes = rightNum % 10; rightLabel = String(rightNum); }
        } else if (simText.length > 0) {
            let singleNum = parseInt(simText, 10);
            if (!isNaN(singleNum)) { leftTens = Math.floor(singleNum / 10); leftOnes = singleNum % 10; leftLabel = String(singleNum); }
        }

        let simVal = evaluateExpr(simText);
        let simCorrect = (simVal === (num1 + num2));

        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 15px; box-sizing:border-box; height:100%; animation:fadeIn 0.3s;">
                <div class="crystal-truck">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                        <b style="color:#22c55e; font-size:13px; margin-top:1px;">${leftLabel}</b>
                    </div>
                    <div class="crystal-deck" style="margin-left:10px; ${simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : ''}">${generateCrystalColumnsHTML(leftTens)}${generateOnesHTML(leftOnes)}</div>
                </div>
                <div style="font-size:24px; font-weight:bold; color:#22c55e;">+</div>
                <div class="crystal-truck">
                    <div class="crystal-deck orange-theme" style="margin-right:10px; ${simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : ''}">${generateCrystalColumnsHTML(rightTens)}${generateOnesHTML(rightOnes)}</div>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                        <b style="color:#ea580c; font-size:13px; margin-top:1px;">${rightLabel}</b>
                    </div>
                </div>
            </div>`;
    } else {
        // ФАЗА 3: ОТВЕТ. Платформы соединяются вместе стык в стык по центру
        let totalTens = tens1 + tens2;
        let totalOnes = ones1 + ones2;

        if (totalOnes >= 10) {
            totalTens += 1;
            totalOnes -= 10;
        }

        let leftDisplayTens = Math.min(totalTens, 4);
        let rightDisplayTens = totalTens - leftDisplayTens;

        html = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; animation:fadeIn 0.4s;">
                <div class="win-layout" style="display:flex; align-items:center; justify-content:center; position:relative;">
                    
                    <!-- Голова левого робота прыгает при победе -->
                    <div style="display:flex; flex-direction:column; align-items:center; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''}">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                    </div>

                    <div class="crystal-deck">${generateCrystalColumnsHTML(leftDisplayTens)}</div>
                    <div class="crystal-deck orange-theme">${generateCrystalColumnsHTML(rightDisplayTens)}${generateOnesHTML(totalOnes)}</div>

                    <!-- Голова правого робота прыгает втихаря -->
                    <div style="display:flex; flex-direction:column; align-items:center; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate-reverse;' : ''}">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                    </div>

                </div>
                <b style="color:#22c55e; font-size:14px; margin-top:8px;">
                    ${isFullyCorrect ? 'Ура! Ответ верный! Платформы соединены! 🎉' : 'Проверяем ответ... 👀'}
                </b>
            </div>`;
    }
    gameZone.innerHTML = html;
}

function generateCrystalColumnsHTML(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 0; j < 10; j++) { html += `<div class="crystal-item"></div>`; }
        html += `</div>`;
    }
    return html;
}

function generateOnesHTML(count) {
    if (count === 0) return '';
    let html = `<div class="crystal-column" style="margin-left:6px; border-left:1px dashed #cbd5e1; padding-left:4px;">`;
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-item" style="background:#facc15; border-color:#ca8a04;"></div>`;
    }
    html += `</div>`;
    return html;
}
