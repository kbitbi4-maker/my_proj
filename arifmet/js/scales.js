let currentScalesTask = null;
function initScalesMode() {
    document.querySelector('.header-title').innerText = 'Режим: Весы ⚖️ ▼';
    generateScalesExample();
}
function generateScalesExample() {
    if (typeof resetAllFeedbacks === 'function') resetAllFeedbacks();
    if (!window.usedExamples) window.usedExamples = [];
    let num1, num2, correctValue, display_text, type = Math.floor(Math.random() * 4);
    while (true) {
        if (type === 0) { // ? + B = C
            correctValue = Math.floor(Math.random() * 6) + 1;
            num2 = Math.floor(Math.random() * (12 - correctValue)) + 1;
            num1 = correctValue + num2;
            display_text = '?+' + num2;
        } else if (type === 1) { // A + ? = C
            num1 = Math.floor(Math.random() * 6) + 1;
            correctValue = Math.floor(Math.random() * (12 - num1)) + 1;
            num2 = num1 + correctValue;
            display_text = num1 + '+?';
        } else if (type === 2) { // ? - B = C
            num2 = Math.floor(Math.random() * 5) + 1;
            correctValue = Math.floor(Math.random() * (12 - num2)) + 1;
            num1 = correctValue + num2;
            display_text = '?-' + num2;
            correctValue = num1; // Ищем уменьшаемое
        } else { // A - ? = C
            num1 = Math.floor(Math.random() * 7) + 5;
            correctValue = Math.floor(Math.random() * (num1 - 1)) + 1;
            num2 = num1 - correctValue;
            display_text = num1 + '-?';
        }
        if (!window.usedExamples.includes(display_text)) break;
    }
    window.usedExamples.push(display_text);
    // Математическая структура: базовый вес левой части, правой части и правильный ответ
    currentScalesTask = { type: type, a: num1, b: num2, answer: correctValue };
    window.examplesHistory.push({ exampleText: display_text, correctValue: correctValue, currentInput: '' });
    window.activeIndex = window.examplesHistory.length - 1;
    const gameZone = document.getElementById('game-zone');
    if (gameZone) gameZone.removeAttribute('data-current-example');
    renderAllLines();
}
function renderScalesVisual(num1, num2, currentInput) { // Главный движок весов
    const gameZone = document.getElementById('game-zone');
    if (!gameZone || !currentScalesTask) return;
    const partsArr = currentInput.split('=');
    const hasPressedEqual = currentInput.includes('=');
    const simText = partsArr.length > 0 ? partsArr.at(0) : '';
    const finText = partsArr.length > 1 ? partsArr.at(1) : '';
    let userValue = parseInt(simText, 10);
    if (isNaN(userValue)) userValue = 0; // Что ввёл ребёнок до нажатия "="
    const targetLength = String(currentScalesTask.answer).length;
    const hasFinalAnswer = partsArr.length > 1 && finText.trim().length >= targetLength;
    let isFullyCorrect = hasFinalAnswer && evaluateExpr(finText) === currentScalesTask.answer;
    
    // Рассчитываем физический вес левой и правой чаши в зависимости от типа уравнения
    let leftWeight = 0, rightWeight = 0;
    let t = currentScalesTask.type;
    if (!hasPressedEqual) { // До знака "=" показываем вес только известных чисел
        if (t === 0) { leftWeight = currentScalesTask.b; rightWeight = currentScalesTask.a; } // ? + B = C
        if (t === 1) { leftWeight = currentScalesTask.a; rightWeight = currentScalesTask.b; } // A + ? = C
        if (t === 2) { leftWeight = currentScalesTask.b; rightWeight = currentScalesTask.b; } // ? - B = C (упростим временно)
        if (t === 3) { leftWeight = currentScalesTask.a; rightWeight = currentScalesTask.b; } // A - ? = C
    } else { // После "=" добавляем на весы число, которое ввёл ребёнок!
        if (t === 0) { leftWeight = userValue + currentScalesTask.b; rightWeight = currentScalesTask.a; }
        if (t === 1) { leftWeight = currentScalesTask.a + userValue; rightWeight = currentScalesTask.b; }
        if (t === 2) { leftWeight = userValue - currentScalesTask.b; rightWeight = currentScalesTask.b; }
        if (t === 3) { leftWeight = currentScalesTask.a - userValue; rightWeight = currentScalesTask.b; }
    }
    // Вычисляем угол наклона коромысла весов (макс 12 градусов)
    let angle = (leftWeight - rightWeight) * 2;
    if (angle > 12) angle = 12; if (angle < -12) angle = -12;
    if (isFullyCorrect) angle = 0; // Идеальный баланс при успехе!

    // Генерируем наполнение чаш кубиками
    let leftCubesHTML = '', rightCubesHTML = '';
    if (t === 0) { // ? + B = C
        leftCubesHTML = (!hasPressedEqual) ? '<div class="scales-box-secret">?</div>' : generateScalesCubesHTML(userValue, true);
        leftCubesHTML += generateScalesCubesHTML(currentScalesTask.b, false);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.a, false);
    } else if (t === 1) { // A + ? = C
        leftCubesHTML = generateScalesCubesHTML(currentScalesTask.a, false);
        leftCubesHTML += (!hasPressedEqual) ? '<div class="scales-box-secret">?</div>' : generateScalesCubesHTML(userValue, true);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.b, false);
    } else if (t === 2) { // ? - B = C
        leftCubesHTML = (!hasPressedEqual) ? '<div class="scales-box-secret">?</div>' : generateScalesCubesHTML(userValue, false);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.b, false); // Показываем вычитаемое справа для баланса разности
    } else { // A - ? = C
        leftCubesHTML = generateScalesCubesHTML(currentScalesTask.a, false);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.b, false);
        if (hasPressedEqual) rightCubesHTML += generateScalesCubesHTML(userValue, true);
    }

    gameZone.innerHTML = `
        <div class="scales-board">
            <div class="scales-beam" style="transform: rotate(${angle}deg);">
                <!-- Левая чаша весов -->
                <div class="scales-pan" style="transform: rotate(${-angle}deg);">
                    <div style="display:flex; gap:4px; align-items:flex-end; min-height:40px;">
                        <div style="${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''} font-size:30px; line-height:1;">🤖</div>
                        ${leftCubesHTML}
                    </div>
                    <div class="scales-plate"></div>
                </div>
                <!-- Правая чаша весов -->
                <div class="scales-pan" style="transform: rotate(${-angle}deg);">
                    <div style="display:flex; gap:4px; align-items:flex-end; min-height:40px;">
                        ${rightCubesHTML}
                        <div style="${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate-reverse;' : ''} font-size:30px; line-height:1;">🤖</div>
                    </div>
                    <div class="scales-plate"></div>
                </div>
            </div>
            <div class="scales-base"></div>
            <b style="color:#22c55e; font-size:13px; position:absolute; top:2px;">${isFullyCorrect ? 'Ура! Весы в идеальном балансе! 🎉' : 'Уравновесь весы! ⚖️'}</b>
        </div>`;
}
function generateScalesCubesHTML(count, isUserAdded) { // Отрисовка кубиков на чашах по законам column-reverse
    if (count <= 0) return '';
    let html = `<div class="crystal-column">`;
    for (let i = 1; i <= count; i++) {
        let cls = isUserAdded ? 'borrow-orange' : 'crystal-item'; // Введенные кубики подсветим оранжевым
        html += `<div class="${cls}"></div>`;
    }
    return html + `</div>`;
}
// Перехватываем подтверждение "Следующий пример"
const originalConfirmAndNext = confirmAndNext;
confirmAndNext = function() {
    if (typeof originalConfirmAndNext === 'function') originalConfirmAndNext();
    if (window.currentMode === 'scales') generateScalesExample();
};

