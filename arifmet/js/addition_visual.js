function renderAdditionVisual(num1, num2, currentInput) {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;

    const partsArr = currentInput.split('=');
    const hasPressedEqual = currentInput.includes('=');
    const simText = partsArr.length > 0 ? partsArr.at(0) : '';
    const finText = partsArr.length > 1 ? partsArr.at(1) : '';

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

    // Хелпер создания стандартного независимого робота с грузом
    function createRobotCapsuleHTML(label, labelColor, isOrange, tens, ones, isGlowClass = '') {
        return `
            <div class="bender-capsule ${isOrange ? 'orange-theme' : ''}">
                <div style="display:flex; flex-direction:column; align-items:center; z-index:4; position:relative; background:#ffffff; padding:2px; border-radius:5px;" class="robot-label-fix">
                    <span style="font-size:36px; line-height:1;">🤖</span>
                    <b style="color:${labelColor}; font-size:13px; margin-top:1px;">${label}</b>
                </div>
                <div class="bender-arm-top"></div>
                <div class="bender-arm-bottom"></div>
                <div class="crystal-deck" style="margin-left:35px;">
                    ${generateCrystalColumnsHTML(tens)}
                    ${generateOnesHTML(ones)}
                </div>
            </div>`;
    }

    if (!hasPressedEqual) {
        // ФАЗА 1: Старт примера. Роботы в разных углах обнимают свои грузы.
        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 15px; box-sizing:border-box; height:100%;">
                ${createRobotCapsuleHTML(num1, '#0284c7', false, tens1, ones1)}
                <div style="font-size:28px; font-weight:bold; color:#94a3b8; z-index:5;">+</div>
                ${createRobotCapsuleHTML(num2, '#ea580c', true, tens2, ones2)}
            </div>`;
    } else if (hasPressedEqual && !hasFinalAnswer) {
        // ФАЗА 2: УПРОЩЕНИЕ. Груз в отсеках роботов меняется по ходу ввода ребенка
        let leftTens = 0, leftOnes = 0;
        let rightTens = 0, rightOnes = 0;
        let leftLabel = '0', rightLabel = '0';

        if (simText.includes('+')) {
            const userParts = simText.split('+');
            let leftNum = parseInt(userParts.at(0), 10);
            let rightNum = parseInt(userParts.at(1), 10);

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
                ${createRobotCapsuleHTML(leftLabel, '#22c55e', false, leftTens, leftOnes, simCorrect ? 'glow-tens' : '')}
                <div style="font-size:24px; font-weight:bold; color:#22c55e; z-index:5;">+</div>
                ${createRobotCapsuleHTML(rightLabel, '#ea580c', true, rightTens, rightOnes, simCorrect ? 'glow-ones' : '')}
            </div>`;
    } else {
        // ФАЗА 3: ОТВЕТ. Роботы прижались по бокам К ОБЩЕМУ ГРУЗУ, а их руки сцепились в центре!
        let totalTens = tens1 + tens2;
        let totalOnes = ones1 + ones2;

        if (totalOnes >= 10) {
            totalTens += 1;
            totalOnes -= 10;
        }

        html = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; animation:fadeIn 0.4s;">
                
                <!-- Единый макет сцепления рук вокруг общей платформы -->
                <div class="joint-layout ${isFullyCorrect ? 'monster-happy' : ''}" style="display:flex; align-items:center; justify-content:center; position:relative; min-width:320px;">
                    
                    <!-- ЛЕВЫЙ РОБОТ (Голова слева посередине груза, руки уходят вправо) -->
                    <div style="display:flex; flex-direction:column; align-items:center; z-index:4; position:relative; background:#ffffff; padding:4px; border-radius:5px; margin-right:-30px;">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                    </div>
                    <div class="bender-arm-top"></div>
                    <div class="bender-arm-bottom"></div>

                    <!-- ОБЩИЙ ЦЕНТРАЛЬНЫЙ ГРУЗ, КОТОРЫЙ ОНИ ДЕРЖАТ ВМЕСТЕ -->
                    <div class="crystal-deck" style="min-width:160px; background:#f0fdf4; border-color:#4ade80; z-index:2; margin:0 30px;">
                        ${generateCrystalColumnsHTML(totalTens)}
                        ${generateOnesHTML(totalOnes)}
                    </div>

                    <!-- ПРАВЫЙ РОБОТ (Голова справа посередине груза, развернут к замку, руки уходят влево) -->
                    <div style="transform: scaleX(-1); margin-left:-30px; display:flex; align-items:center; position:relative;">
                        <div class="bender-arm-top"></div>
                        <div class="bender-arm-bottom"></div>
                        <div style="display:flex; flex-direction:column; align-items:center; z-index:4; position:relative; background:#ffffff; padding:4px; border-radius:5px;" class="robot-label-fix">
                            <span style="font-size:36px; line-height:1;">🤖</span>
                        </div>
                    </div>

                </div>
                <b style="color:#22c55e; font-size:14px; margin-top:8px; z-index:5;">
                    ${isFullyCorrect ? 'Ура! Роботы крепко держат общий груз! 💎' : 'Проверяем замок... 👀'}
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
