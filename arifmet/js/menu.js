// Глобальное состояние приложения, общее для всех режимов
window.currentMode = '';
window.examplesHistory = [];
window.activeIndex = -1;

const menu = document.getElementById('menu');
const examplesList = document.getElementById('examples-list');

// Флаги, чтобы звуки ошибки не тарахтели при вводе каждой неверной цифры
let simFailSoundPlayed = false;
let finFailSoundPlayed = false;

function toggleMenu() { 
    menu.classList.toggle('active'); 
}

function setMode(mode) {
    menu.classList.remove('active');
    
    if (mode === 'hundreds' || mode === 'thousands') { 
        alert("Режим в разработке 🛠️"); 
        return; 
    }
    
    window.currentMode = mode;
    window.examplesHistory = [];
    window.activeIndex = -1;
    simFailSoundPlayed = false;
    finFailSoundPlayed = false;
    
    if (examplesList) examplesList.innerHTML = '';
    
    // Очищаем монстров, не ломая структуру страницы
    const gameZone = document.getElementById('game-zone');
    if (gameZone) {
        gameZone.innerHTML = '';
        gameZone.removeAttribute('data-current-example');
    }

    if (mode === 'tens') {
        initTensMode(); 
    } else if (mode === 'multiplication') {
        initMultiplicationMode(); 
    }
}

// УНИВЕРСАЛЬНЫЙ БЕЗОПАСНЫЙ КАЛЬКУЛЯТОР
function evaluateExpr(str) {
    if (!str) return null;
    let cleaned = str.replace(/×/g, '*').trim();
    
    // 1. Обработка умножения
    if (cleaned.includes('*')) {
        let partsArr = cleaned.split('*');
        if (partsArr.length === 2 && partsArr[0] && partsArr[1]) {
            let n1 = parseInt(partsArr[0], 10);
            let n2 = parseInt(partsArr[1], 10);
            return (isNaN(n1) || isNaN(n2)) ? null : n1 * n2;
        }
        return null;
    }
    // 2. Обработка сложения (цепочки любой длины)
    if (cleaned.includes('+')) {
        let partsArr = cleaned.split('+');
        let sum = 0;
        for (let i = 0; i < partsArr.length; i++) {
            let num = parseInt(partsArr[i], 10);
            if (isNaN(num)) return null; 
            sum += num;
        }
        return sum;
    }
    // 3. Обработка вычитания
    if (cleaned.includes('-')) {
        let partsArr = cleaned.split('-');
        if (partsArr.length === 2 && partsArr[0] && partsArr[1]) {
            let n1 = parseInt(partsArr[0], 10);
            let n2 = parseInt(partsArr[1], 10);
            return (isNaN(n1) || isNaN(n2)) ? null : n1 - n2;
        }
        return null;
    }
    
    let num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
}

// ФУНКЦИЯ ВОСПРОИЗВЕДЕНИЯ ВАШЕГО ГОТОВОГО ФАЙЛА ОШИБКИ
function playFailSound() {
    try {
        const audio = new Audio('audio/fail.mp3');
        audio.volume = 0.25; // Устанавливаем комфортную громкость (25%)
        audio.play();
    } catch (e) {
        console.log("Звук заблокирован политикой браузера до первого клика");
    }
}

// Универсальный рендеринг строк для ВСЕХ режимов
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
            
            line.innerHTML = `
                <span class="example-text">${item.exampleText}</span>
                <span class="sim-block-wrapper"></span>
                <span class="fin-block-wrapper"></span>
            `;
            examplesList.appendChild(line);
        }
    } else if (currentRenderedCount > window.examplesHistory.length) {
        examplesList.innerHTML = '';
    }

    window.examplesHistory.forEach((item, index) => {
        const line = examplesList.querySelector(`[data-index="${index}"]`);
        if (!line) return;

        if (index === window.activeIndex) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }

        const partsArr = item.currentInput.split('=');
        
        const simText = (partsArr.length > 0) ? partsArr[0] : '';
        const finText = (partsArr.length > 1) ? partsArr[1] : '';

        const simWrapper = line.querySelector('.sim-block-wrapper');
        const finWrapper = line.querySelector('.fin-block-wrapper');

        const targetLength = String(item.correctValue).length;

        // 1. РЕНДЕРИНГ БЛОКА УПРОЩЕНИЯ (Слагаемые)
        if (item.currentInput.includes('=')) {
            let simVal = evaluateExpr(simText);
            let simCorrect = (simVal === item.correctValue);
            
            if (window.currentMode === 'multiplication' && simCorrect && simText) {
                let checkParts = simText.split('+');
                let monsterCountFromText = parseInt(item.exampleText.split('×')[1], 10);
                if (checkParts.length !== monsterCountFromText) {
                    simCorrect = false;
                }
            }

            simWrapper.innerHTML = ' = <span class="block ' + (simCorrect ? 'block-correct' : 'block-incorrect') + '">' + (simText || '?') + '</span>';
            
            // Триггер запуска вашего MP3 при ошибке в слагаемых
            if (!simCorrect && index === window.activeIndex && !simFailSoundPlayed) {
                playFailSound();
                simFailSoundPlayed = true; 
            }
            if (simCorrect && index === window.activeIndex) {
                simFailSoundPlayed = false; 
            }

        } else {
            simWrapper.innerHTML = ' = <span class="block">' + (simText || '_') + '</span>';
        }

        // 2. РЕНДЕРИНГ БЛОКА ОТВЕТА
        if (partsArr.length > 1) {
            let finVal = evaluateExpr(finText);
            let finCorrect = (finVal === item.correctValue);
            let trimmedFinText = String(finText).trim();
            
            if (trimmedFinText.length >= targetLength) {
                finWrapper.innerHTML = ' = <span class="block ' + (finCorrect ? 'block-correct' : 'block-incorrect') + '">' + finText + '</span>';
                
                // Триггер запуска вашего MP3 при ошибке в финальном ответе
                if (!finCorrect && index === window.activeIndex && !finFailSoundPlayed) {
                    playFailSound();
                    finFailSoundPlayed = true;
                }
                if (finCorrect && index === window.activeIndex) {
                    finFailSoundPlayed = false;
                }

            } else if (trimmedFinText.length > 0) {
                finWrapper.innerHTML = ' = <span class="block">' + finText + '</span>';
                finFailSoundPlayed = false; 
            } else {
                finWrapper.innerHTML = ' = <span class="block">_</span>';
                finFailSoundPlayed = false;
            }
        } else {
            finWrapper.innerHTML = '';
        }
    });

    const activeElem = examplesList.querySelector('.active');
    if (activeElem) activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectExample(index) {
    window.activeIndex = index;
    simFailSoundPlayed = false;
    finFailSoundPlayed = false;
    renderAllLines();
    if (window.currentMode === 'multiplication' && typeof syncMonsterGame === 'function') {
        syncMonsterGame();
    }
}

function pressNum(n) {
    if (window.activeIndex === -1) return;
    
    let activeItem = window.examplesHistory[window.activeIndex];
    
    if (n === 'C') {
        activeItem.currentInput = '';
        simFailSoundPlayed = false;
        finFailSoundPlayed = false;
    } else if (n === 'D') {
        activeItem.currentInput = activeItem.currentInput.slice(0, -1);
        simFailSoundPlayed = false;
        finFailSoundPlayed = false;
    } else {
        let partsArr = activeItem.currentInput.split('=');
        if (n === '=' && partsArr.length >= 2) return;
        activeItem.currentInput += n;
    }
    
    renderAllLines();

    if (window.currentMode === 'multiplication' && typeof renderMonsterGame === 'function') {
        renderMonsterGame();
    }
}

function confirmAndNext() {
    simFailSoundPlayed = false;
    finFailSoundPlayed = false;
    if (window.currentMode === 'tens') {
        generateExample();
    } else if (window.currentMode === 'multiplication') {
        generateMultiExample();
    }
}
