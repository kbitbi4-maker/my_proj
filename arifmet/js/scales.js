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
        if (type === 0) { // Тип 0: X + B = C (Сложение, ищем первое число)
            correctValue = Math.floor(Math.random() * 6) + 1; // Загаданный X
            num2 = Math.floor(Math.random() * (12 - correctValue)) + 1; // Известное второе число
            num1 = correctValue + num2; // Итоговая сумма
            display_text = 'X + ' + num2 + ' = ' + num1;
        } else if (type === 1) { // Тип 1: A + X = C (Сложение, ищем второе число)
            num1 = Math.floor(Math.random() * 6) + 1; // Известное первое число
            correctValue = Math.floor(Math.random() * (12 - num1)) + 1; // Загаданный X
            num2 = num1 + correctValue; // Итоговая сумма
            display_text = num1 + ' + X = ' + num2;
        } else if (type === 2) { // Тип 2: X - B = C (Вычитание, ищем уменьшаемое)
            num2 = Math.floor(Math.random() * 5) + 1; // Известное вычитаемое
            correctValue = Math.floor(Math.random() * (12 - num2)) + 1; // Загаданный X (уменьшаемое)
            num1 = correctValue - num2; // Результат разности
            display_text = 'X - ' + num2 + ' = ' + num1;
        } else { // Тип 3: A - X = C (Вычитание, ищем вычитаемое)
            num1 = Math.floor(Math.random() * 7) + 5; // Известное уменьшаемое (от 5 до 12)
            correctValue = Math.floor(Math.random() * (num1 - 1)) + 1; // Загаданный X
            num2 = num1 - correctValue; // Результат разности
            display_text = num1 + ' - X = ' + num2;
        }
        if (!window.usedExamples.includes(display_text)) break;
    }
    window.usedExamples.push(display_text);
    // Структура: математический тип, известное число 1, известное число 2, правильный ответ X
    currentScalesTask = { type: type, val1: num1, val2: num2, answer: correctValue };
    window.examplesHistory.push({
        exampleText: display_text, // На экране пишется полноценное уравнение, например: "X + 4 = 9"
        correctValue: correctValue, // Ответ сверяется с числом X
        currentInput: ''
    });
    window.activeIndex = window.examplesHistory.length - 1;
    const gameZone = document.getElementById('game-zone');
    if (gameZone) gameZone.removeAttribute('data-current-example');
    renderAllLines();
}
function renderScalesVisual(num1, num2, currentInput) {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone || !currentScalesTask) return;
    let userValue = parseInt(currentInput.trim(), 10); // Ребенок просто набирает число на нумпад
    if (isNaN(userValue)) userValue = 0;
    let isFullyCorrect = (userValue === currentScalesTask.answer);
    
    // Вычисляем физический вес левой и правой чаши
    let leftWeight = 0, rightWeight = 0;
    let t = currentScalesTask.type;
    // Вес чаш зависит от того, что ввёл ребенок вместо X прямо сейчас
    if (t === 0) { leftWeight = userValue + currentScalesTask.val2; rightWeight = currentScalesTask.val1; } // X + B vs C
    if (t === 1) { leftWeight = currentScalesTask.val1 + userValue; rightWeight = currentScalesTask.val2; } // A + X vs C
    if (t === 2) { leftWeight = userValue - currentScalesTask.val2; rightWeight = currentScalesTask.val1; } // X - B vs C
    if (t === 3) { leftWeight = currentScalesTask.val1 - userValue; rightWeight = currentScalesTask.val2; } // A - X vs C

    // Задаем наклон весов (макс 12 градусов), при правильном ответе — идеальный баланс 0 градусов
    let angle = (leftWeight - rightWeight) * 2;
    if (angle > 12) angle = 12; if (angle < -12) angle = -12;
    if (isFullyCorrect) angle = 0;

    // Генерируем кубики на весах
    let leftCubesHTML = '', rightCubesHTML = '';
    if (t === 0) { // X + B = C
        leftCubesHTML = (userValue === 0) ? '<div class="scales-box-secret">X</div>' : generateScalesCubesHTML(userValue, true);
        leftCubesHTML += generateScalesCubesHTML(currentScalesTask.val2, false);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.val1, false);
    } else if (t === 1) { // A + X = C
        leftCubesHTML = generateScalesCubesHTML(currentScalesTask.val1, false);
        leftCubesHTML += (userValue === 0) ? '<div class="scales-box-secret">X</div>' : generateScalesCubesHTML(userValue, true);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.val2, false);
    } else if (t === 2) { // X - B = C -> визуализируем баланс разности: X vs C + B
        leftCubesHTML = (userValue === 0) ? '<div class="scales-box-secret">X</div>' : generateScalesCubesHTML(userValue, true);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.val1, false) + generateScalesCubesHTML(currentScalesTask.val2, false);
    } else { // A - X = C -> визуализируем баланс: A vs C + X
        leftCubesHTML = generateScalesCubesHTML(currentScalesTask.val1, false);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.val2, false);
        rightCubesHTML += (userValue === 0) ? '<div class="scales-box-secret">X</div>' : generateScalesCubesHTML(userValue, true);
    }

    gameZone.innerHTML = `
        <div class="scales-board">
            <div class="scales-beam" style="transform: rotate(${angle}deg);">
                <!-- Левая чаша -->
                <div class="scales-pan" style="transform: rotate(${-angle}deg);">
                    <div style="display:flex; gap:3px; align-items:flex-end; min-height:35px;">
                        <div style="${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''} font-size:24px; line-height:1;">🤖</div>
                        ${leftCubesHTML}
                    </div>
                    <div class="scales-plate"></div>
                </div>
                <!-- Правая чаша -->
                <div class="scales-pan" style="transform: rotate(${-angle}deg);">
                    <div style="display:flex; gap:3px; align-items:flex-end; min-height:35px;">
                        ${rightCubesHTML}
                        <div style="${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate-reverse;' : ''} font-size:24px; line-height:1;">🤖</div>
                    </div>
                    <div class="scales-plate"></div>
                </div>
            </div>
            <div class="scales-base"></div>
            <b style="color:#22c55e; font-size:13px; position:absolute; top:2px;">${isFullyCorrect ? 'Ура! Ответ верный! Весы уравновешены! 🎉' : 'Чему равен X? Найди баланс! ⚖️'}</b>
        </div>`;
}
function generateScalesCubesHTML(count, isUserAdded) {
    if (count <= 0) return '';
    let html = `<div class="crystal-column">`;
    for (let i = 1; i <= count; i++) {
        html += `<div class="${isUserAdded ? 'borrow-orange' : 'crystal-item'}"></div>`;
    }
    return html + `</div>`;
}
