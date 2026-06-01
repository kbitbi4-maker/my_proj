window.currentMode = ''; window.examplesHistory = []; window.activeIndex = -1; window.mixStep = 0;
const menu = document.getElementById('menu'); const examplesList = document.getElementById('examples-list');
function toggleMenu() { menu.classList.toggle('active'); }
function setMode(mode) {
    menu.classList.remove('active');
    if (mode === 'hundreds' || mode === 'thousands') { alert("Режим в разработке 🛠️"); return; }
    window.currentMode = mode; window.examplesHistory = []; window.usedExamples = []; window.activeIndex = -1; window.mixStep = 0;
    if (typeof resetAllFeedbacks === 'function') resetAllFeedbacks();
    if (examplesList) examplesList.innerHTML = '';
    const gameZone = document.getElementById('game-zone');
    if (gameZone) { gameZone.innerHTML = ''; gameZone.removeAttribute('data-current-example'); }
    if (mode === 'tens' && typeof initTensMode === 'function') { initTensMode(); } 
    else if (mode === 'multiplication' && typeof initMultiplicationMode === 'function') { initMultiplicationMode(); } 
    else if (mode === 'scales' && typeof initScalesMode === 'function') { initScalesMode(); }
    else if (mode === 'mix' && typeof initMixMode === 'function') { initMixMode(); }
}
function selectExample(index) {
    window.activeIndex = index;
    if (typeof resetAllFeedbacks === 'function') resetAllFeedbacks();
    renderAllLines();
    const activeItem = window.examplesHistory[index];
    if (activeItem && activeItem.exampleText.includes('×')) { 
        if (typeof syncMonsterGame === 'function') syncMonsterGame();
        if (typeof renderMonsterGame === 'function') renderMonsterGame();
    } else if (activeItem && activeItem.exampleText.includes('+')) {
        if (typeof renderAdditionVisual === 'function') {
            let nums = activeItem.exampleText.split('+');
            renderAdditionVisual(parseInt(nums[0], 10), parseInt(nums[1], 10), activeItem.currentInput);
        }
    } else if (activeItem && activeItem.exampleText.includes('-')) {
        if (typeof renderSubtractionVisual === 'function') {
            let nums = activeItem.exampleText.split('-'); // Исправленные индексы массивов
            renderSubtractionVisual(parseInt(nums[0], 10), parseInt(nums[1], 10), activeItem.currentInput);
        }
    } else if (window.currentMode === 'scales') {
        const gameZone = document.getElementById('game-zone');
        if (gameZone) gameZone.innerHTML = '<div style="color:#94a3b8; font-size:14px;">[Визуал весов будет здесь ⚖️]</div>';
    } else {
        const gameZone = document.getElementById('game-zone');
        if (gameZone) { gameZone.innerHTML = ''; gameZone.removeAttribute('data-current-example'); }
    }
}
function pressNum(n) {
    if (window.activeIndex === -1) return;
    let activeItem = window.examplesHistory[window.activeIndex];
    if (n === 'C' || n === 'D') {
        if (n === 'C') activeItem.currentInput = ''; else activeItem.currentInput = activeItem.currentInput.slice(0, -1);
        if (typeof resetAllFeedbacks === 'function') resetAllFeedbacks();
    } else {
        let totalEquals = (activeItem.currentInput.match(/=/g) || []).length;
        if (n === '=' && totalEquals >= 2) return;
        activeItem.currentInput += n;
    }
    renderAllLines();
    if (activeItem.exampleText.includes('+') && typeof renderAdditionVisual === 'function') {
        let nums = activeItem.exampleText.split('+');
        renderAdditionVisual(parseInt(nums[0], 10), parseInt(nums[1], 10), activeItem.currentInput);
    }
    if (activeItem.exampleText.includes('-') && typeof renderSubtractionVisual === 'function') {
        let nums = activeItem.exampleText.split('-'); // Исправленные индексы массивов
        renderSubtractionVisual(parseInt(nums[0], 10), parseInt(nums[1], 10), activeItem.currentInput);
    }
    if (activeItem.exampleText.includes('×') && typeof renderMonsterGame === 'function') renderMonsterGame();
    if (window.currentMode === 'scales') {
        const gameZone = document.getElementById('game-zone');
        if (gameZone) gameZone.innerHTML = '<div style="color:#94a3b8; font-size:14px;">[Визуал весов: ' + activeItem.currentInput + ']</div>';
    }
}
function confirmAndNext() {
    if (typeof resetAllFeedbacks === 'function') resetAllFeedbacks();
    if (window.currentMode === 'tens' && typeof generateExample === 'function') generateExample();
    else if (window.currentMode === 'multiplication' && typeof generateMultiExample === 'function') generateMultiExample();
    else if (window.currentMode === 'scales' && typeof generateScalesExample === 'function') generateScalesExample();
    else if (window.currentMode === 'mix' && typeof generateMixExample === 'function') generateMixExample();
}
