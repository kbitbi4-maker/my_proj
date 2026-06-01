let currentMultiTask = null;
function initMultiplicationMode() {
    document.querySelector('.header-title').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}
function generateMultiExample() {
    if (typeof resetAllFeedbacks === 'function') resetAllFeedbacks();
    const num1 = Math.floor(Math.random() * 4) + 2; 
    const num2 = Math.floor(Math.random() * 4) + 2; 
    currentMultiTask = { items: num1, monsters: num2 };
    window.examplesHistory.push({
        exampleText: num1 + '×' + num2,
        correctValue: num1 * num2,
        currentInput: ''
    });
    window.activeIndex = window.examplesHistory.length - 1;
    const gameZone = document.getElementById('game-zone');
    if (gameZone) gameZone.removeAttribute('data-current-example'); // Очистка кэша перед генерацией
    renderAllLines();
    renderMonsterGame(); 
}
function syncMonsterGame() {
    if (window.activeIndex === -1) return;
    const parts = window.examplesHistory[window.activeIndex].exampleText.split('×');
    currentMultiTask = { items: parseInt(parts.at(0), 10), monsters: parseInt(parts.at(1), 10) };
    const gameZone = document.getElementById('game-zone');
    if (gameZone) gameZone.removeAttribute('data-current-example'); // ИСПРАВЛЕНО: Сбрасываем кэш, чтобы принудительно стереть роботов и нарисовать монстров
    renderMonsterGame();
}
function renderMonsterGame() {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;
    if (!currentMultiTask || window.activeIndex === -1) {
        gameZone.innerHTML = '';
        gameZone.removeAttribute('data-current-example');
        return;
    }
    const activeItem = window.examplesHistory[window.activeIndex];
    if (!activeItem || !activeItem.exampleText) return;
    let isFullySolved = false, isWrongAnswer = false; 
    if (activeItem.currentInput) {
        const partsArr = activeItem.currentInput.split('=');
        const simText = partsArr.at(0) || '', finText = partsArr.at(1) || '';
        let simVal = evaluateExpr(simText);
        let simCorrect = (simVal === activeItem.correctValue);
        let checkParts = simText.split('+');
        let monsterCountFromText = parseInt(activeItem.exampleText.split('×').at(1), 10);
        if (checkParts.length !== monsterCountFromText) simCorrect = false;
        let finVal = evaluateExpr(finText);
        let finCorrect = (finVal === activeItem.correctValue);
        let targetLength = String(activeItem.correctValue).length;
        if (activeItem.currentInput.includes('=') && !simCorrect) isWrongAnswer = true;
        if (partsArr.length > 1 && finText.trim().length >= targetLength && !finCorrect) isWrongAnswer = true;
        if (activeItem.currentInput.includes('=') && simCorrect && finCorrect) isFullySolved = true;
    }
    if (isFullySolved && typeof triggerWinFeedback === 'function') triggerWinFeedback(); 
    let status = "play";
    if (isFullySolved) status = "win";
    if (isWrongAnswer) status = "sad";
    const cacheKey = activeItem.exampleText + "_" + status;
    if (gameZone.getAttribute('data-current-example') === cacheKey) return; 
    gameZone.setAttribute('data-current-example', cacheKey);
    let html = '';
    for (let i = 0; i < currentMultiTask.monsters; i++) {
        let contentHTML = '', bgBox = '#fff7ed', borderBox = '1px dashed #fed7aa', monsterClass = '';
        if (isFullySolved) {
            contentHTML = '<span style="font-size: 14px; color: #22c55e; font-weight: bold; animation: fadeIn 0.3s;">Ням-ням! 😋</span>';
            bgBox = '#dcfce7'; borderBox = '1px dashed #22c55e'; monsterClass = 'monster-happy';
        } else if (isWrongAnswer) {
            contentHTML = '<span class="tears-animation" style="font-size: 22px;">💦</span>';
            bgBox = '#eff6ff'; borderBox = '1px dashed #60a5fa'; monsterClass = 'monster-sad';
        } else {
            contentHTML = '<span style="font-size: 22px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));">🍕</span>'.repeat(currentMultiTask.items);
        }
        html += `
            <div class="${monsterClass}" style="display:flex; flex-direction:column; align-items:center; justify-content:center; background:#ffffff; padding:10px 15px; border:2px solid #e2e8f0; border-radius:12px; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05); min-width:85px; box-sizing:border-box; transition:all 0.3s ease;">
                <span style="font-size: 46px; margin-bottom: 6px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));">👾</span>
                <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap; max-width:80px; background:${bgBox}; padding:4px 6px; border-radius:6px; border:${borderBox}; min-height:32px; align-items:center;">
                    ${contentHTML}
                </div>
            </div>`;
    }
    gameZone.innerHTML = html;
}
