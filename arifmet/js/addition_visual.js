function renderAdditionVisual(num1, num2, currentInput) {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;

    const partsArr = currentInput.split('=');
    const hasPressedEqual = currentInput.includes('=');
    const simText = partsArr.length > 0 ? partsArr[0].trim() : '';
    const finText = partsArr.length > 1 ? partsArr[1].trim() : '';

    const targetLength = String(num1 + num2).length;
    const hasFinalAnswer = partsArr.length > 1 && finText.length >= targetLength;

    let isFullyCorrect = false;
    if (hasFinalAnswer) {
        let finVal = evaluateExpr(finText);
        if (finVal === (num1 + num2)) isFullyCorrect = true;
    }

    const tens1 = Math.floor(num1 / 10), ones1 = num1 % 10;
    const tens2 = Math.floor(num2 / 10), ones2 = num2 % 10;

    let html = '';

    if (!hasPressedEqual) {
        // ФАЗА 1: Исходный пример. Роботы держат руками свои стартовые грузы.
        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 10px; box-sizing:border-box; height:100%;">
                <div style="display:flex; align-items:center;">
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#0284c7; font-size:14px; margin-top:2px;">${num1}</b>
                    </div>
                    <span class="robot-hand-left">🦾</span>
                    <div class="crystal-deck">${generateCrystalColumnsHTML(tens1)}${generateOnesHTML(ones1)}</div>
                </div>
                <div style="font-size:28px; font-weight:bold; color:#94a3b8;">+</div>
                <div style="display:flex; align-items:center;" class="orange-theme">
                    <div class="crystal-deck">${generateCrystalColumnsHTML(tens2)}${generateOnesHTML(ones2)}</div>
                    <span class="robot-hand-right">🦾</span>
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#ea580c; font-size:14px; margin-top:2px;">${num2}</b>
                    </div>
                </div>
            </div>`;
    } else if (hasPressedEqual && !hasFinalAnswer) {
        // ФАЗА 2: ЭТАП УПРОЩЕНИЯ. Отрисовка ГРУЗА СТРОГО в зависимости от того, что НАПИСАЛ РЕБЁНОК!
        let userTens = 0;
        let userOnes = 0;

        // Если в строке есть плюс, бьём её на левую и правую части ввода ребёнка
        if (simText.includes('+')) {
            const userParts = simText.split('+');
            let leftNum = parseInt(userParts[0], 10);
            let rightNum = parseInt(userParts[1], 10);

            if (!isNaN(leftNum)) userTens = Math.floor(leftNum / 10);
            if (!isNaN(rightNum)) userOnes = rightNum;
        } else if (simText.length > 0) {
            // Ребёнок набрал число, но ещё не нажал плюс — выводим десятки в левый отсек
            let singleNum = parseInt(simText, 10);
            if (!isNaN(singleNum)) userTens = Math.floor(singleNum / 10);
        }

        // Проверяем промежуточную правильность для включения сияния (светится, только если введено верно 60 и 12)
        let simVal = evaluateExpr(simText);
        let simCorrect = (simVal === (num1 + num2)) && (userTens === (tens1 + tens2)) && (userOnes === (ones1 + ones2));

        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 10px; box-sizing:border-box; height:100%; animation:fadeIn 0.3s;">
                <div style="display:flex; align-items:center;">
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#22c55e; font-size:14px; margin-top:2px;">${userTens * 10}</b>
                    </div>
                    <span class="robot-hand-left">🦾</span>
                    <div class="crystal-deck ${simCorrect ? 'glow-tens' : ''}">${generateCrystalColumnsHTML(userTens)}</div>
                </div>
                <div style="font-size:24px; font-weight:bold; color:#22c55e;">+</div>
                <div style="display:flex; align-items:center;" class="orange-theme">
                    <div class="crystal-deck ${simCorrect ? 'glow-ones' : ''}">${generateOnesHTML(userOnes, true)}</div>
                    <span class="robot-hand-right">🦾</span>
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#eab308; font-size:14px; margin-top:2px;">${userOnes}</b>
                    </div>
                </div>
            </div>`;
    } else {
        // ФАЗА 3: ФИНАЛЬНЫЙ ОТВЕТ. Роботы обняли общую платформу руками с двух сторон.
        let totalTens = tens1 + tens2;
        let totalOnes = ones1 + ones2;

        if (totalOnes >= 10) {
            totalTens += 1;
            totalOnes -= 10;
        }

        html = `
            <div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; animation:fadeIn 0.4s;">
                <div style="display:flex; flex-direction:column; align-items:center; z-index:3;">
                    <span style="font-size:36px; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''}">🤖</span>
                </div>
                <span class="robot-hand-left" style="transform: scaleX(-1); margin-right: -4px;">🦾</span>
                <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                    <div class="crystal-deck" style="min-width:160px; background:#f0fdf4; border-color:#4ade80;">
                        ${generateCrystalColumnsHTML(totalTens)}
                        ${generateOnesHTML(totalOnes)}
                    </div>
                    <b style="color:#22c55e; font-size:14px;">
                        ${isFullyCorrect ? 'Ура! Ответ верный! 🎉' : 'Проверяем ответ... 👀'}
                    </b>
                </div>
                <span class="robot-hand-right" style="margin-left: -4px;">🦾</span>
                <div style="display:flex; flex-direction:column; align-items:center; z-index:3;">
                    <span style="font-size:36px; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate-reverse;' : ''}">🤖</span>
                </div>
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

function generateOnesHTML(count, isSimplificationStage = false) {
    if (count === 0) return '';
    let html = '';
    if (isSimplificationStage) {
        let remaining = count;
        while (remaining > 0) {
            let currentColumnHeight = Math.min(remaining, 5);
            html += `<div class="crystal-column" style="margin-left:4px; padding-left:2px;">`;
            for (let i = 0; i < currentColumnHeight; i++) {
                html += `<div class="crystal-item" style="background:#facc15; border-color:#ca8a04;"></div>`;
            }
            html += `</div>`;
            remaining -= currentColumnHeight;
        }
    } else {
        html += `<div class="crystal-column" style="margin-left:6px; border-left:1px dashed #cbd5e1; padding-left:4px;">`;
        for (let i = 0; i < count; i++) {
            html += `<div class="crystal-item" style="background:#facc15; border-color:#ca8a04;"></div>`;
        }
        html += `</div>`;
    }
    return html;
}
