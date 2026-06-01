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

    // Шаблон длинной сегментной руки Бендера
    const leftBenderArm = `
        <div class="bender-arm-container left-arm-pos">
            <div class="bender-arm-arc"></div>
            <div class="bender-claw-top"></div>
            <div class="bender-claw-bottom"></div>
        </div>`;
        
    const rightBenderArm = `
        <div class="bender-arm-container right-arm-pos">
            <div class="bender-arm-arc"></div>
            <div class="bender-claw-top"></div>
            <div class="bender-claw-bottom"></div>
        </div>`;

    if (!hasPressedEqual) {
        // ФАЗА 1: Стартовое состояние. Руки Бендера тянутся из-за голов и зажимают груз сверху/снизу
        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 10px; box-sizing:border-box; height:100%;">
                
                <!-- ЛЕВЫЙ РОБОТ -->
                <div class="crystal-truck">
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3; position:relative;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#0284c7; font-size:14px; margin-top:2px;">${num1}</b>
                    </div>
                    ${leftBenderArm}
                    <div class="crystal-deck" style="margin-left:35px;">${generateCrystalColumnsHTML(tens1)}${generateOnesHTML(ones1)}</div>
                </div>

                <div style="font-size:28px; font-weight:bold; color:#94a3b8;">+</div>

                <!-- ПРАВЫЙ РОБОТ -->
                <div class="crystal-truck orange-theme">
                    <div class="crystal-deck" style="margin-right:35px;">${generateCrystalColumnsHTML(tens2)}${generateOnesHTML(ones2)}</div>
                    ${rightBenderArm}
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3; position:relative;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#ea580c; font-size:14px; margin-top:2px;">${num2}</b>
                    </div>
                </div>

            </div>`;
    } else if (hasPressedEqual && !hasFinalAnswer) {
        // ФАЗА 2: ЭТАП УПРОЩЕНИЯ. Груз меняется по логике ввода ребенка
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
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 10px; box-sizing:border-box; height:100%; animation:fadeIn 0.3s;">
                
                <!-- ЛЕВЫЙ РОБОТ (Упрощение десятков) -->
                <div class="crystal-truck">
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3; position:relative;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#22c55e; font-size:14px; margin-top:2px;">${leftLabel}</b>
                    </div>
                    ${leftBenderArm}
                    <div class="crystal-deck ${simCorrect ? 'glow-tens' : ''}" style="margin-left:35px;">
                        ${generateCrystalColumnsHTML(leftTens)}
                        ${generateOnesHTML(leftOnes)}
                    </div>
                </div>

                <div style="font-size:24px; font-weight:bold; color:#22c55e;">+</div>

                <!-- ПРАВЫЙ РОБОТ (Упрощение единиц) -->
                <div class="crystal-truck orange-theme">
                    <div class="crystal-deck ${simCorrect ? 'glow-ones' : ''}" style="margin-right:35px;">
                        ${generateCrystalColumnsHTML(rightTens)}
                        ${generateOnesHTML(rightOnes)}
                    </div>
                    ${rightBenderArm}
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3; position:relative;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#ea580c; font-size:14px; margin-top:2px;">${rightLabel}</b>
                    </div>
                </div>

            </div>`;
    } else {
        // ФАЗА 3: ФИНАЛЬНЫЙ ОТВЕТ. Сближение в центре
        let totalTens = tens1 + tens2;
        let totalOnes = ones1 + ones2;

        if (totalOnes >= 10) {
            totalTens += 1;
            totalOnes -= 10;
        }

        html = `
            <div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; animation:fadeIn 0.4s;" class="${isFullyCorrect ? 'monster-happy' : ''}">
                
                <!-- Два робота стоят плечом к плечу слева, обняв общую палету руками -->
                <div style="display:flex; gap:6px; position:relative;">
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3; position:relative;">
                        <span style="font-size:36px;">🤖</span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:3; position:relative;" class="orange-theme">
                        <span style="font-size:36px;">🤖</span>
                    </div>
                    ${leftBenderArm}
                </div>

                <div style="display:flex; flex-direction:column; align-items:center; gap:4px; margin-left:35px;">
                    <div class="crystal-deck" style="min-width:160px; background:#f0fdf4; border-color:#4ade80;">
                        ${generateCrystalColumnsHTML(totalTens)}
                        ${generateOnesHTML(totalOnes)}
                    </div>
                    <b style="color:#22c55e; font-size:14px;">
                        ${isFullyCorrect ? 'Ура! Ответ верный! 🎉' : 'Проверяем ответ... 👀'}
                    </b>
                </div>

            </div>`;
    }
    gameZone.innerHTML = html;
}

// Изменено направление генерации: теперь кубики собираются сверху вниз,
// что при выравнивании к полу дает идеальный упор 5 штук СНИЗУ столбика.
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
