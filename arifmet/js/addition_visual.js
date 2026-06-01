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
        // ФАЗА 1: Роботы разделены.
        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:flex-end; padding:0 40px;">
                <div class="crystal-truck">
                    <span style="font-size:42px; margin-bottom:5px;">🤖</span>
                    <div class="crystal-deck">${generateCrystalColumnsHTML(tens1)}${generateOnesHTML(ones1)}</div>
                    <b style="color:#0284c7; margin-top:5px;">${num1}</b>
                </div>
                <div style="font-size:32px; font-weight:bold; color:#94a3b8; margin-bottom:50px;">+</div>
                <div class="crystal-truck orange-theme">
                    <span style="font-size:42px; margin-bottom:5px;">🤖</span>
                    <div class="crystal-deck">${generateCrystalColumnsHTML(tens2)}${generateOnesHTML(ones2)}</div>
                    <b style="color:#ea580c; margin-top:5px;">${num2}</b>
                </div>
            </div>`;
    } else {
        // ФАЗА 2 и 3: Объединение с обязательным разделением на полные десятки
        let totalTens = tens1 + tens2;
        let totalOnes = ones1 + ones2;

        // Если единиц 10 или больше — превращаем их в полноценный ровный десяток
        if (totalOnes >= 10) {
            totalTens += 1;
            totalOnes -= 10;
        }

        html = `
            <div style="display:flex; flex-direction:column; align-items:center; width:100%; animation:fadeIn 0.4s;">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <span style="font-size:42px; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''}">🤖</span>
                    <span style="font-size:42px; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate-reverse;' : ''}">🤖</span>
                </div>
                <div class="crystal-deck ${isFullyCorrect ? '' : 'glow-tens glow-ones'}" style="min-width:220px; background:#f0fdf4; border-color:#4ade80;">
                    ${generateCrystalColumnsHTML(totalTens)}
                    ${generateOnesHTML(totalOnes)}
                </div>
                <b style="color:#22c55e; margin-top:5px; font-size:20px;">
                    ${isFullyCorrect ? 'Ура! ' + (num1 + num2) : 'Объединяем груз... 📦'}
                </b>
            </div>`;
    }
    gameZone.innerHTML = html;
}

// Генерирует столбики десятков: СТРОГО 10 кубиков. Пробел добавится автоматически через CSS
function generateCrystalColumnsHTML(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 0; j < 10; j++) { html += `<div class="crystal-item"></div>`; }
        html += `</div>`;
    }
    return html;
}

// Генерирует единицы: никогда не превышает 9 кубиков в высоту
function generateOnesHTML(count) {
    if (count === 0) return '';
    let html = `<div class="crystal-column" style="margin-left:10px; border-left:1px dashed #cbd5e1; padding-left:6px;">`;
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-item" style="background:#facc15; border-color:#ca8a04;"></div>`;
    }
    html += `</div>`;
    return html;
}
