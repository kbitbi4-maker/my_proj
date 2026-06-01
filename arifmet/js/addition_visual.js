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

    if (!hasPressedEqual) {
        // ФАЗА 1: СТАРТ. Роботы разделены, груз базовых цветов
        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 15px; box-sizing:border-box; height:100%;">
                <div class="crystal-truck">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                        <b style="color:#0284c7; font-size:13px; margin-top:1px;">${num1}</b>
                    </div>
                    <div class="crystal-deck" style="margin-left:10px;">
                        ${generateCrystalColumnsHTML(tens1, false, 0)}
                        ${generateOnesHTML(ones1, false)}
                    </div>
                </div>
                <div style="font-size:28px; font-weight:bold; color:#94a3b8;">+</div>
                <div class="crystal-truck">
                    <div class="crystal-deck orange-theme" style="margin-right:10px;">
                        ${generateCrystalColumnsHTML(tens2, true, 0)}
                        ${generateOnesHTML(ones2, true)}
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                        <b style="color:#ea580c; font-size:13px; margin-top:1px;">${num2}</b>
                    </div>
                </div>
            </div>`;
    } else if (hasPressedEqual && !hasFinalAnswer) {
        // ФАЗА 2: УПРОЩЕНИЕ. Добавление кубиков соседа на самый верх стопки
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

        let leftBorrowCount = 0;
        if (leftTens > tens1 && leftOnes === 0 && ones1 > 0) { leftBorrowCount = 10 - ones1; }

        let rightBorrowCount = 0;
        if (rightTens > tens2 && rightOnes === 0 && ones2 > 0) { rightBorrowCount = 10 - ones2; }

        html = `
            <div style="display:flex; justify-content:space-between; width:100%; align-items:center; padding:0 15px; box-sizing:border-box; height:100%; animation:fadeIn 0.3s;">
                <div class="crystal-truck">
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                        <b style="color:#22c55e; font-size:13px; margin-top:1px;">${leftLabel}</b>
                    </div>
                    <div class="crystal-deck" style="margin-left:10px; ${simCorrect ? 'filter:drop-shadow(0 0 6px #4ade80); border-color:#22c55e;' : ''}">
                        ${generateCrystalColumnsHTML(leftTens, false, leftBorrowCount)}
                        ${generateOnesHTML(leftOnes, false)}
                    </div>
                </div>
                <div style="font-size:24px; font-weight:bold; color:#22c55e;">+</div>
                <div class="crystal-truck">
                    <div class="crystal-deck orange-theme" style="margin-right:10px; ${simCorrect ? 'filter:drop-shadow(0 0 6px #facc15);' : ''}">${generateCrystalColumnsHTML(rightTens, true, rightBorrowCount)} ${generateOnesHTML(rightOnes, true)}</div>
                    <div style="display:flex; flex-direction:column; align-items:center;">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                        <b style="color:#ea580c; font-size:13px; margin-top:1px;">${rightLabel}</b>
                    </div>
                </div>
            </div>`;
    } else {
        // ФАЗА 3: ОТВЕТ. Умное сохранение цветов истории примера при слиянии
        let totalOnes = ones1 + ones2;
        let leftBorrowCount = 0;
        let rightBorrowCount = 0;

        // Фиксируем, был ли размен. Если да, вычисляем количество кубиков соседа на вершине
        if (totalOnes >= 10) {
            leftBorrowCount = 10 - ones1; 
            totalOnes -= 10;
        }

        html = `
            <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; width:100%; height:100%; animation:fadeIn 0.4s;">
                <div class="win-layout" style="display:flex; align-items:center; justify-content:center; position:relative;">
                    
                    <!-- ГОЛОВА ЛЕВОГО РОБОТА -->
                    <div style="display:flex; flex-direction:column; align-items:center; ${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''}">
                        <span style="font-size:36px; line-height:1;">🤖</span>
                    </div>

                    <!-- ЛЕВАЯ ПЛАТФОРМА: Несет только чистые синие базовые десятки левого робота -->
                    <div class="crystal-deck">
                        ${generateCrystalColumnsHTML(tens1, false, 0)}
                    </div>

                    <!-- ПРАВАЯ ПЛАТФОРМА: Берет на себя гибридный столбик, чистые оранжевые десятки и остаток единиц -->
                    <div class="crystal-deck orange-theme">
                        <!-- 1. Тот самый гибридный столбик (передаем левый заем, чтобы он раскрасился снизу синим, сверху оранжевым) -->
                        ${leftBorrowCount > 0 ? generateCrystalColumnsHTML(1, false, leftBorrowCount) : ''}
                        
                        <!-- 2. Чистые оранжевые десятки правого робота -->
                        ${generateCrystalColumnsHTML(tens2, true, 0)}
                        
                        <!-- 3. Оставшиеся неполные оранжевые единицы -->
                        ${generateOnesHTML(totalOnes, true)}
                    </div>

                    <!-- ГОЛОВА ПРАВОГО РОБОТА -->
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

function generateCrystalColumnsHTML(count, isOrangeTheme, borrowCount) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-column">`;
        let isLastColumn = (i === count - 1) && (borrowCount > 0);
        
        for (let j = 1; j <= 10; j++) {
            let extraClass = '';
            if (isLastColumn && j > (10 - borrowCount)) {
                extraClass = isOrangeTheme ? 'borrow-blue' : 'borrow-orange';
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
    for (let i = 0; i < count; i++) {
        let styleFix = isOrangeTheme ? 'background:#fb923c; border-color:#ea580c;' : 'background:#38bdf8; border-color:#0284c7;';
        html += `<div class="crystal-item" style="${styleFix}"></div>`;
    }
    html += `</div>`;
    return html;
}
