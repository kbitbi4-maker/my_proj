function renderAdditionVisual(num1, num2, currentInput) {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;

    const partsArr = currentInput.split('=');
    const hasPressedEqual = currentInput.includes('=');
    const finText = (partsArr.length > 1) ? partsArr[1].trim() : '';

    const targetLength = String(num1 + num2).length;
    // Проверяем, введён ли полноценный финальный ответ нужной длины
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
        // ФАЗА 1: Исходное состояние примера (например, 45 и 27)
        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 10px; box-sizing:border-box; height:100%;">
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#0284c7; font-size:14px; margin-top:2px;">${num1}</b>
                    </div>
                    <div class="crystal-deck">${generateCrystalColumnsHTML(tens1)}${generateOnesHTML(ones1)}</div>
                </div>
                <div style="font-size:28px; font-weight:bold; color:#94a3b8;">+</div>
                <div style="display:flex; align-items:center; gap:8px;" class="orange-theme">
                    <div class="crystal-deck">${generateCrystalColumnsHTML(tens2)}${generateOnesHTML(ones2)}</div>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#ea580c; font-size:14px; margin-top:2px;">${num2}</b>
                    </div>
                </div>
            </div>`;
    } else if (hasPressedEqual && !hasFinalAnswer) {
        // ФАЗА 2 (ЭТАП УПРОЩЕНИЯ): Роботы стоят раздельно, но их груз ИЗМЕНИЛСЯ на десятки и единицы (60 и 12)!
        const simText = partsArr[0] || '';
        let simVal = evaluateExpr(simText);
        let simCorrect = (simVal === (num1 + num2));

        // Педагогический расчёт новых грузовых отсеков
        let displayTens = tens1 + tens2;
        let displayOnes = ones1 + ones2;

        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 10px; box-sizing:border-box; height:100%; animation:fadeIn 0.3s;">
                
                <!-- ЛЕВЫЙ РОБОТ: Забрал себе все Десятки (например, 60) -->
                <div style="display:flex; align-items:center; gap:8px;">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#22c55e; font-size:14px; margin-top:2px;">${displayTens * 10}</b>
                    </div>
                    <div class="crystal-deck ${simCorrect ? 'glow-tens' : ''}">${generateCrystalColumnsHTML(displayTens)}</div>
                </div>

                <div style="font-size:24px; font-weight:bold; color:#22c55e;">+</div>

                <!-- ПРАВЫЙ РОБОТ: Забрал себе все Единицы (например, 12) -->
                <div style="display:flex; align-items:center; gap:8px;" class="orange-theme">
                    <div class="crystal-deck ${simCorrect ? 'glow-ones' : ''}">${generateOnesHTML(displayOnes, true)}</div>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px;">🤖</span>
                        <b style="color:#eab308; font-size:14px; margin-top:2px;">${displayOnes}</b>
                    </div>
                </div>

            </div>`;
    } else {
        // ФАЗА 3 (ФИНАЛЬНЫЙ ОТВЕТ): Роботы съехались в центр, груз объединился в итоговое число!
        let totalTens = tens1 + tens2;
        let totalOnes = ones1 + ones2;

        if (totalOnes >= 10) {
            totalTens += 1;
            totalOnes -= 10;
        }

        html = `
            <div style="display:flex; align-items:center; justify-content:center; gap:15px; width:100%; height:100%; animation:fadeIn 0.4s;">
                <span style="font-size:36px; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''}">🤖</span>
                <div style="display:flex; flex-direction:column; align-items:center; gap:4px;">
                    <div class="crystal-deck" style="min-width:160px; background:#f0fdf4; border-color:#4ade80;">
                        ${generateCrystalColumnsHTML(totalTens)}
                        ${generateOnesHTML(totalOnes)}
                    </div>
                    <b style="color:#22c55e; font-size:14px;">
                        ${isFullyCorrect ? 'Ура! Ответ верный! 🎉' : 'Проверяем ответ... 👀'}
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

function generateOnesHTML(count, isSimplificationStage = false) {
    if (count === 0) return '';
    let html = '';
    
    if (isSimplificationStage) {
        // На этапе упрощения единицы (например, 12) могут превышать 10, поэтому строим их в столбики по 5 для удобства счета
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
        // На остальных этапах строим обычный столбик-остаток до 9 кубиков
        html += `<div class="crystal-column" style="margin-left:6px; border-left:1px dashed #cbd5e1; padding-left:4px;">`;
        for (let i = 0; i < count; i++) {
            html += `<div class="crystal-item" style="background:#facc15; border-color:#ca8a04;"></div>`;
        }
        html += `</div>`;
    }
    return html;
}
