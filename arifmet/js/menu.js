window.currentMode = '';
window.examplesHistory = [];
window.activeIndex = -1;
window.mixStep = 0;
const menu = document.getElementById('menu');
const examplesList = document.getElementById('examples-list');
let simFailSoundPlayed = false;
let finFailSoundPlayed = false;
let simWinSoundPlayed = false;
let finWinSoundPlayed = false;
function toggleMenu() { menu.classList.toggle('active'); }
function setMode(mode) {
    menu.classList.remove('active');
    if (mode === 'hundreds' || mode === 'thousands') { alert("Режим в разработке 🛠️"); return; }
    window.currentMode = mode;
    window.examplesHistory = [];
    window.activeIndex = -1;
    window.mixStep = 0;
    simFailSoundPlayed = false; finFailSoundPlayed = false; simWinSoundPlayed = false; finWinSoundPlayed = false;
    if (examplesList) examplesList.innerHTML = '';
    const gameZone = document.getElementById('game-zone');
    if (gameZone) { gameZone.innerHTML = ''; gameZone.removeAttribute('data-current-example'); }
    if (mode === 'tens') { initTensMode(); } 
    else if (mode === 'multiplication') { initMultiplicationMode(); } 
    else if (mode === 'mix') { initMixMode(); }
}
function initMixMode() {
    document.querySelector('.header-title').innerText = 'Режим: Микс 🎰 ▼';
    window.mixStep = 0;
    generateMixExample();
}
function generateMixExample() {
    if (window.currentMode !== 'mix') return;
    let type = window.mixStep % 3;
    if (type === 0) { isAddition = true; generateExample(); } 
    else if (type === 1) { isAddition = false; generateExample(); } 
    else if (type === 2) { generateMultiExample(); }
    document.querySelector('.header-title').innerText = 'Режим: Микс 🎰 ▼';
    window.mixStep++;
}
function playFailSound() {
    try { const audio = new Audio('audio/fail.mp3'); audio.volume = 0.25; audio.play(); } 
    catch (e) { console.log("Audio Blocked"); }
}
function playTensWinSound() {
    try { const audio = new Audio('audio/win.mp3'); audio.volume = 0.25; audio.play(); } 
    catch (e) { console.log("Audio Blocked"); }
}
function renderAllLines() {
    if (!examplesList) return;
    const placeholder = examplesList.querySelector('div[style*="color: #999"]');
    if (placeholder) placeholder.remove();
    let currentRenderedCount = examplesList.children.length;
    if (currentRenderedCount < window.examplesHistory.length) {
        for (let index = currentRenderedCount; index < window.examplesHistory.length; index++) {
            const item = window.examplesHistory[index];
            const line = document.createElement('div');
            line.className = `example-line ${index === window.activeIndex ? 'active' : ''}`;
            line.setAttribute('data-index', index);
            line.onclick = () => selectExample(index);
            line.innerHTML = `<span class="example-text">${item.exampleText}</span><span class="sim-block-wrapper"></span><span class="fin-block-wrapper"></span>`;
            examplesList.appendChild(line);
        }
    } else if (currentRenderedCount > window.examplesHistory.length) { examplesList.innerHTML = ''; }
    window.examplesHistory.forEach((item, index) => {
        const line = examplesList.querySelector(`[data-index="${index}"]`);
        if (!line) return;
        if (index === window.activeIndex) { line.classList.add('active'); } else { line.classList.remove('active'); }
        const partsArr = item.currentInput.split('=');
        // СТОП-БАГ: Заменили квадратные скобки на пуленепробиваемые методы .at()
        const simText = (partsArr.length > 0) ? partsArr.at(0) : '';
        const finText = (partsArr.length > 1) ? partsArr.at(1) : '';
        const simWrapper = line.querySelector('.sim-block-wrapper');
        const finWrapper = line.querySelector('.fin-block-wrapper');
        const targetLength = String(item.correctValue).length;
        let isMultiplicationLine = item.exampleText.includes('×');
        if (item.currentInput.includes('=')) {
            let simVal = evaluateExpr(simText);
            let simCorrect = (simVal === item.correctValue);
            if (isMultiplicationLine && simCorrect && simText) {
                let checkParts = simText.split('+');
                let monsterCountFromText = parseInt(item.exampleText.split('×').at(1), 10);
                if (checkParts.length !== monsterCountFromText) simCorrect = false;
            }
            simWrapper.innerHTML = ' = <span class="block ' + (simCorrect ? 'block-correct' : 'block-incorrect') + '">' + (simText || '?') + '</span>';
            if (index === window.activeIndex) {
                if (!simCorrect && !simFailSoundPlayed) { playFailSound(); simFailSoundPlayed = true; }
                if (simCorrect && !isMultiplicationLine && !simWinSoundPlayed) { playTensWinSound(); simWinSoundPlayed = true; }
                if (simCorrect) simFailSoundPlayed = false;
                if (!simCorrect) simWinSoundPlayed = false;
            }
        } else { simWrapper.innerHTML = ' = <span class="block">' + (simText || '_') + '</span>'; }
        if (partsArr.length > 1) {
            let finVal = evaluateExpr(finText);
            let finCorrect = (finVal === item.correctValue);
            let trimmedFinText = String(finText).trim();
            if (trimmedFinText.length >= targetLength) {
                finWrapper.innerHTML = ' = <span class="block ' + (finCorrect ? 'block-correct' : 'block-incorrect') + '">' + finText + '</span>';
                if (index === window.activeIndex) {
                    if (!finCorrect && !finFailSoundPlayed) { playFailSound(); finFailSoundPlayed = true; }
                    if (finCorrect && !isMultiplicationLine && !finWinSoundPlayed) { playTensWinSound(); finWinSoundPlayed = true; }
                    if (finCorrect) finFailSoundPlayed = false;
                    if (!finCorrect) finWinSoundPlayed = false;
                }
            } else if (trimmedFinText.length > 0) {
                finWrapper.innerHTML = ' = <span class="block">' + finText + '</span>';
                if (index === window.activeIndex) { finFailSoundPlayed = false; finWinSoundPlayed = false; }
            } else {
                finWrapper.innerHTML = ' = <span class="block">_</span>';
                if (index === window.activeIndex) { finFailSoundPlayed = false; finWinSoundPlayed = false; }
            }
        } else { finWrapper.innerHTML = ''; }
    });
    const activeElem = examplesList.querySelector('.active');
    if (activeElem) activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function selectExample(index) {
    window.activeIndex = index;
    simFailSoundPlayed = false; finFailSoundPlayed = false; simWinSoundPlayed = false; finWinSoundPlayed = false;
    renderAllLines();
    const activeItem = window.examplesHistory[index];
    if (activeItem && activeItem.exampleText.includes('×')) { if (typeof syncMonsterGame === 'function') syncMonsterGame(); } 
    else {
        const gameZone = document.getElementById('game-zone');
        if (gameZone) { gameZone.innerHTML = ''; gameZone.removeAttribute('data-current-example'); }
    }
}
function pressNum(n) {
    if (window.activeIndex === -1) return;
    let activeItem = window.examplesHistory[window.activeIndex];
    if (n === 'C') {
        activeItem.currentInput = '';
        simFailSoundPlayed = false; finFailSoundPlayed = false; simWinSoundPlayed = false; finWinSoundPlayed = false;
    } else if (n === 'D') {
        activeItem.currentInput = activeItem.currentInput.slice(0, -1);
        simFailSoundPlayed = false; finFailSoundPlayed = false; simWinSoundPlayed = false; finWinSoundPlayed = false;
    } else {
        let totalEquals = (activeItem.currentInput.match(/=/g) || []).length;
        if (n === '=' && totalEquals >= 2) return;
        activeItem.currentInput += n;
    }
    renderAllLines();
    if (activeItem.exampleText.includes('×') && typeof renderMonsterGame === 'function') renderMonsterGame();
}
function confirmAndNext() {
    simFailSoundPlayed = false; finFailSoundPlayed = false; simWinSoundPlayed = false; finWinSoundPlayed = false;
    if (window.currentMode === 'tens') generateExample();
    else if (window.currentMode === 'multiplication') generateMultiExample();
    else if (window.currentMode === 'mix') generateMixExample();
}
