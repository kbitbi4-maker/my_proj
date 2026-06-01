// Глобальное состояние приложения, общее для всех режимов
window.currentMode = '';
window.examplesHistory = [];
window.activeIndex = -1;

const menu = document.getElementById('menu');
const examplesList = document.getElementById('examples-list');

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
    
    if (examplesList) examplesList.innerHTML = '';
    
    const oldZone = document.getElementById('game-zone');
    if (oldZone) oldZone.remove();

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
        if (partsArr.length === 2) {
            return parseInt(partsArr.at(0), 10) * parseInt(partsArr.at(1), 10);
        }
    }
    // 2. Обработка сложения (цепочки любой длины)
    if (cleaned.includes('+')) {
        let partsArr = cleaned.split('+');
        let sum = 0;
        for (let i = 0; i < partsArr.length; i++) {
            let num = parseInt(partsArr.at(i), 10);
            if (isNaN(num)) return null;
            sum += num;
        }
        return sum;
    }
    // 3. Обработка вычитания
    if (cleaned.includes('-')) {
        let partsArr = cleaned.split('-');
        if (partsArr.length === 2) {
            return parseInt(partsArr.at(0), 10) - parseInt(partsArr.at(1), 10);
        }
    }
    
    let num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
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
        
        // БЕЗОПАСНОЕ ИЗВЛЕЧЕНИЕ: без использования квадратных скобок в коде
        const simText = (partsArr.length > 0) ? partsArr.at(0) : '';
        const finText = (partsArr.length > 1) ? partsArr.at(1) : '';

        const simWrapper = line.querySelector('.sim-block-wrapper');
        const finWrapper = line.querySelector('.fin-block-wrapper');

        // РЕНДЕРИНГ БЛОКА УПРОЩЕНИЯ
        if (item.currentInput.includes('=')) {
            let simVal = evaluateExpr(simText);
            let simCorrect = (simVal === item.correctValue);
            
            // Педагогическая проверка: совпадает ли количество слагаемых с числом монстров
            if (window.currentMode === 'multiplication' && simCorrect && simText) {
                let checkParts = simText.split('+');
                let monsterCountFromText = parseInt(item.exampleText.split('×').at(1), 10);
                if (checkParts.length !== monsterCountFromText) {
                    simCorrect = false;
                }
            }

            simWrapper.innerHTML = ' = <span class="block ' + (simCorrect ? 'block-correct' : 'block-incorrect') + '">' + (simText || '?') + '</span>';
        } else {
            simWrapper.innerHTML = ' = <span class="block">' + (simText || '_') + '</span>';
        }

        // РЕНДЕРИНГ БЛОКА ОТВЕТА
        if (partsArr.length > 1) {
            let finVal = evaluateExpr(finText);
            let finCorrect = (finVal === item.correctValue);
            let isValidLength = /^[0-9]{1,}$/.test(String(finText).trim());

            if (isValidLength || String(finText).trim() === String(item.correctValue)) {
                finWrapper.innerHTML = ' = <span class="block ' + (finCorrect ? 'block-correct' : 'block-incorrect') + '">' + finText + '</span>';
            } else if (String(finText).length > 0) {
                finWrapper.innerHTML = ' = <span class="block">' + finText + '</span>';
            } else {
                finWrapper.innerHTML = ' = <span class="block">_</span>';
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
    } else if (n === 'D') {
        activeItem.currentInput = activeItem.currentInput.slice(0, -1);
    } else {
        let partsArr = activeItem.currentInput.split('=');
        if (n === '=' && partsArr.length >= 2) return;
        activeItem.currentInput += n;
    }
    
    renderAllLines();
}

function confirmAndNext() {
    if (window.currentMode === 'tens') {
        generateExample();
    } else if (window.currentMode === 'multiplication') {
        generateMultiExample();
    }
}
