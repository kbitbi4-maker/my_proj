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
        if (type === 0) { // X + B = C
            correctValue = Math.floor(Math.random() * 6) + 1; // Загаданный X
            num2 = Math.floor(Math.random() * (12 - correctValue)) + 1; 
            num1 = correctValue + num2; 
            display_text = 'X + ' + num2 + ' = ' + num1;
        } else if (type === 1) { // A + X = C
            num1 = Math.floor(Math.random() * 6) + 1; 
            correctValue = Math.floor(Math.random() * (12 - num1)) + 1; // Загаданный X
            num2 = num1 + correctValue; 
            display_text = num1 + ' + X = ' + num2;
        } else if (type === 2) { // X - B = C
            num2 = Math.floor(Math.random() * 5) + 1; 
            correctValue = Math.floor(Math.random() * (12 - num2)) + 1; // Загаданный X
            num1 = correctValue - num2; 
            display_text = 'X - ' + num2 + ' = ' + num1;
        } else { // A - X = C
            num1 = Math.floor(Math.random() * 7) + 5; 
            correctValue = Math.floor(Math.random() * (num1 - 1)) + 1; // Загаданный X
            num2 = num1 - correctValue; 
            display_text = num1 + ' - X = ' + num2;
        }
        if (!window.usedExamples.includes(display_text)) break;
    }
    window.usedExamples.push(display_text);
    currentScalesTask = { type: type, val1: num1, val2: num2, answer: correctValue };
    window.examplesHistory.push({ exampleText: display_text, correctValue: correctValue, currentInput: '' });
    window.activeIndex = window.examplesHistory.length - 1;
    const gameZone = document.getElementById('game-zone');
    if (gameZone) gameZone.removeAttribute('data-current-example');
    renderAllLines();
}
function renderScalesVisual(correctVal, unused, currentInput) {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone || !currentScalesTask) return;
    
    // Очищаем ввод от знаков "=" для безопасного извлечения числа X
    let cleanedInput = currentInput.replace(/=/g, '').trim();
    let userValue = parseInt(cleanedInput, 10);
    if (isNaN(userValue)) userValue = 0;
    
    let isFullyCorrect = (userValue === currentScalesTask.answer);
    
    // Вычисляем реальный физический вес левой и правой чаши
    let leftWeight = 0, rightWeight = 0;
    let t = currentScalesTask.type;
    
    if (t === 0) { // X + B = C (Сумма)
        leftWeight = userValue + currentScalesTask.val2; 
        rightWeight = currentScalesTask.val1; 
    } else if (t === 1) { // A + X = C (Сумма)
        leftWeight = currentScalesTask.val1 + userValue; 
        rightWeight = currentScalesTask.val2; 
    } else if (t === 2) { // X - B = C -> Балансируем разность: X vs C + B
        leftWeight = userValue; 
        rightWeight = currentScalesTask.val1 + currentScalesTask.val2; 
    } else { // A - X = C -> Балансируем остаток: A vs C + X
        leftWeight = currentScalesTask.val1; 
        rightWeight = currentScalesTask.val2 + userValue; 
    }
    
    // Угол наклона коромысла весов
    let angle = (leftWeight - rightWeight) * 3;
    if (angle > 14) angle = 14; if (angle < -14) angle = -14;
    if (isFullyCorrect || userValue === 0) angle = 0; // Изначально или при успехе — весы ровные!
    if (userValue > 0 && !isFullyCorrect && angle === 0) angle = -8; // Если ответ неверный — кривые

    // Генерация кубиков чаш
    let leftCubesHTML = '', rightCubesHTML = '';
    if (t === 0) {
        leftCubesHTML = (userValue === 0) ? '<div class="scales-box-secret">X</div>' : generateScalesCubesHTML(userValue, true);
        leftCubesHTML += generateScalesCubesHTML(currentScalesTask.val2, false);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.val1, false);
    } else if (t === 1) {
        leftCubesHTML = generateScalesCubesHTML(currentScalesTask.val1, false);
        leftCubesHTML += (userValue === 0) ? '<div class="scales-box-secret">X</div>' : generateScalesCubesHTML(userValue, true);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.val2, false);
    } else if (t === 2) {
        leftCubesHTML = (userValue === 0) ? '<div class="scales-box-secret">X</div>' : generateScalesCubesHTML(userValue, true);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.val1 + currentScalesTask.val2, false);
    } else {
        leftCubesHTML = generateScalesCubesHTML(currentScalesTask.val1, false);
        rightCubesHTML = generateScalesCubesHTML(currentScalesTask.val2, false);
        rightCubesHTML += (userValue === 0) ? '<div class="scales-box-secret">X</div>' : generateScalesCubesHTML(userValue, true);
    }
    gameZone.innerHTML = `
        <div class="scales-board">
            <div class="scales-beam" style="transform: rotate(${angle}deg);">
                <div class="scales-pan" style="transform: rotate(${-angle}deg);">
                    <div style="display:flex; gap:3px; align-items:flex-end; min-height:35px;">
                        <div style="${isFullyCorrect ? 'animation: monsterJump 0.5s infinite alternate;' : ''} font-size:24px; line-height:1;">🤖</div>
                        ${leftCubesHTML}
                    </div>
                    <div class="scales-plate"></div>
                </div>
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
const originalConfirmAndNext = confirmAndNext;
confirmAndNext = function() {
    if (typeof originalConfirmAndNext === 'function') originalConfirmAndNext();
    if (window.currentMode === 'scales') generateScalesExample();
};
