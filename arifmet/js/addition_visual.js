function renderAdditionVisual(num1, num2, currentInput) {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;

    const partsArr = currentInput.split('=');
    const hasPressedEqual = currentInput.includes('=');
    const hasFinalAnswer = partsArr.length > 1 && partsArr[1].trim().length > 0;

    let isFullyCorrect = false;
    if (hasFinalAnswer) {
        let finVal = evaluateExpr(partsArr[1]);
        if (finVal === (num1 + num2)) isFullyCorrect = true;
    }

    const tens1 = Math.floor(num1 / 10), ones1 = num1 % 10;
    const tens2 = Math.floor(num2 / 10), ones2 = num2 % 10;

    let html = '';

    if (!hasPressedEqual) {
        // ФАЗА 1: Роботы разделены и стоят СБОКУ от своего груза
        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 10px; box-sizing:border-box; height:100%;">
                
                <!-- ЛЕВЫЙ РОБОТ И ЕГО ГРУЗ -->
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#0284c7; font-size:14px; margin-top:2px;">${num1}</b>
                    </div>
                    <div class="crystal-deck">${generateCrystalColumnsHTML(tens1)}${generateOnesHTML(ones1)}</div>
                </div>

                <div style="font-size:28px; font-weight:bold; color:#94a3b8;">+</div>

                <!-- ПРАВЫЙ РОБОТ И ЕГО ГРУЗ -->
                <div style="display:flex; align-items:center; gap:8px;" class="orange-theme">
                    <div class="crystal-deck">${generateCrystalColumnsHTML(tens2)}${generateOnesHTML(ones2)}</div>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#ea580c; font-size:14px; margin-top:2px;">${num2}</b>
                    </div>
                </div>

            </div>`;
    } else {
        // ФАЗА 2 и 3: Объединение груза в центре
        let totalTens = tens1 + tens2;
        let totalOnes = ones1 + ones2;

        if (totalOnes >= 10) {
            totalTens += 1;
            totalOnes -= 10;
        }

        html = `
            <div style="display:flex; align-items:center; justify-content:center; gap:15px; width:100%; height:100%; animation:fadeIn 0.4s;">
                <!-- Роботы стоят по бокам от общей кучи -->
                <span style="font-size:36px; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''}">🤖</span>
                
                <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                    <div class="crystal-deck ${isFullyCorrect ? '' : 'glow-tens glow-ones'}" style="min-width:160px; background:#f0fdf4; border-color:#4ade80;">
                        ${generateCrystalColumnsHTML(totalTens)}
                        ${generateOnesHTML(totalOnes)}
                    </div>
                    <b style="color:#22c55e; font-size:14px;">
                        ${isFullyCorrect ? 'Ура! ' + (num1 + num2) : 'Объединяем груз... 📦'}
                    </b>
                </div>

                <span style="font-size:36px; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate-reverse;' : ''}">🤖</span>
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
