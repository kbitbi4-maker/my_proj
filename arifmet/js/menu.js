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

// БЕЗОПАСНЫЙ калькулятор без использования Function/eval
function evaluateExpr(str) {
    if (!str) return null;
    let cleaned = str.replace(/×/g, '*').trim();
    
    if (cleaned.includes('*')) {
        let parts = cleaned.split('*');
        if (parts.length === 2) {
            return parseInt(parts[0], 10) * parseInt(parts[1], 10);
        }
    }
    if (cleaned.includes('+')) {
        let parts = cleaned.split('+');
        if (parts.length === 2) {
            return parseInt(parts[0], 10) + parseInt(parts[1], 10);
        }
    }
    if (cleaned.includes('-')) {
        let parts = cleaned.split('-');
        if (parts.length === 2) {
            return parseInt(parts[0], 10) - parseInt(parts[1], 10);
        }
    }
    
    let num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
}

// Универсальный рендеринг строк для ВСЕХ режимов (ПОЛНОСТЬЮ ИСПРАВЛЕННЫЙ)
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

        const parts = item.currentInput.split('=');
        // ЖЕСТКО ИСПРАВЛЕНО: Возвращены правильные индексы массивов [0] и [1]
        const simText = parts[0] || '';
        const finText = parts[1] || '';

        const simWrapper = line.querySelector('.sim-block-wrapper');
        const finWrapper = line.querySelector('.fin-block-wrapper');

        // ЛОГИКА ДЛЯ РЕЖИМА "УМНОЖЕНИЕ" (Ввод сразу ответа, без промежуточных блоков)
        if (window.currentMode === 'multiplication') {
            simWrapper.innerHTML = ''; // Скрываем блок упрощения
            
            if (item.currentInput.length > 0) {
                let userVal = parseInt(item.currentInput, 10);
                let isCorrect = (userVal === item.correctValue);
                // Подсвечиваем зеленым, если ответ совпал, или пишем синим, пока ребенок вводит цифры
                if (userVal === item.correctValue || item.currentInput.length >= String(item.correctValue).length) {
                    finWrapper.innerHTML = ` = <span class="block ${isCorrect ? 'block-correct' : 'block-incorrect'}">${item.currentInput}</span>`;
                } else {
                    finWrapper.innerHTML = ` = <span class="block">${item.currentInput}</span>`;
                }
            } else {
                finWrapper.innerHTML = ` = <span class="block">_</span>`;
            }
        } 
        // ЛОГИКА ДЛЯ РЕЖИМА "ДЕСЯТКИ" (Двухуровневый ввод с упрощением через "=")
        else {
            if (item.currentInput.includes('=')) {
                let simVal = evaluateExpr(simText);
                let simCorrect = (simVal === item.correctValue);
                simWrapper.innerHTML = ` = <span class="block ${simCorrect ? 'block-correct' : 'block-incorrect'}">${simText || '?'}</span>`;
            } else {
                simWrapper.innerHTML = ` = <span class="block">${simText || '_'}</span>`;
            }

            if (parts.length > 1) {
                let finVal = evaluateExpr(finText);
                let finCorrect = (finVal === item.correctValue);
                let isValidLength = /^[0-9]{1,}$/.test(finText.trim());

                if (isValidLength || finText.trim() === String(item.correctValue)) {
                    finWrapper.innerHTML = ` = <span class="block ${finCorrect ? 'block-correct' : 'block-incorrect'}">${finText}</span>`;
                } else if (finText.length > 0) {
                    finWrapper.innerHTML = ` = <span class="block">${finText}</span>`;
                } else {
                    finWrapper.innerHTML = ` = <span class="block">_</span>`;
                }
            } else {
                finWrapper.innerHTML = '';
            }
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
        // Если это умножение — запрещаем вводить знак "=" (он не нужен)
        if (window.currentMode === 'multiplication' && n === '=') return;
        
        let parts = activeItem.currentInput.split('=');
        if (n === '=' && parts.length >= 2) return;
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
