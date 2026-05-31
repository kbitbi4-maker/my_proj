// Глобальное состояние приложения, общее для всех режимов
let currentMode = '';
let examplesHistory = [];
let activeIndex = -1;

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
    
    currentMode = mode;
    examplesHistory = [];
    activeIndex = -1;
    
    if (examplesList) examplesList.innerHTML = '';
    
    const oldZone = document.getElementById('game-zone');
    if (oldZone) oldZone.remove();

    // Запускаем нужный игровой движок
    if (mode === 'tens') {
        initTensMode(); 
    } else if (mode === 'multiplication') {
        initMultiplicationMode(); 
    }
}

// Универсальный калькулятор для проверки выражений
function evaluateExpr(str) {
    try {
        const cleaned = str.replace(/[^0-9+-\\*×]/g, '').replace(/×/g, '*');
        if (!cleaned) return null;
        return Function('"use strict"; return (' + cleaned + ')')();
    } catch (e) {
        return null;
    }
}

// Универсальный рендеринг строк для ВСЕХ режимов (теперь ПОЛНОСТЬЮ без мерцания!)
function renderAllLines() {
    if (!examplesList) return;
    
    // Удаляем заглушку "Выберите режим", если она есть
    const placeholder = examplesList.querySelector('div[style*="color: #999"]');
    if (placeholder) placeholder.remove();

    // Вместо полной очистки проверяем, сколько строк не хватает на экране
    let currentRenderedCount = examplesList.children.length;

    if (currentRenderedCount < examplesHistory.length) {
        // Дорисовываем ТОЛЬКО новые примеры, которые появились в массиве
        for (let index = currentRenderedCount; index < examplesHistory.length; index++) {
            const item = examplesHistory[index];
            const line = document.createElement('div');
            line.className = `example-line ${index === activeIndex ? 'active' : ''}`;
            line.setAttribute('data-index', index);
            line.onclick = () => selectExample(index);
            
            line.innerHTML = `
                <span class="example-text">${item.exampleText}</span>
                <span class="sim-block-wrapper"></span>
                <span class="fin-block-wrapper"></span>
            `;
            examplesList.appendChild(line);
        }
    } else if (currentRenderedCount > examplesHistory.length) {
        // Если массив очистился (например, при смене режима) — синхронизируем экран
        examplesList.innerHTML = '';
    }

    // Точечно обновляем содержимое строк
    examplesHistory.forEach((item, index) => {
        const line = examplesList.querySelector(`[data-index="${index}"]`);
        if (!line) return;

        // Переключаем подсветку активности без перерисовки элементов
        if (index === activeIndex) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }

        const parts = item.currentInput.split('=');
        const simText = parts[0] || '';
        const finText = parts[1] || '';

        const simWrapper = line.querySelector('.sim-block-wrapper');
        const finWrapper = line.querySelector('.fin-block-wrapper');

        // Обновляем Блок 1 (Упрощение)
        if (item.currentInput.includes('=')) {
            let simVal = evaluateExpr(simText);
            let simCorrect = (simVal === item.correctValue);
            simWrapper.innerHTML = ` = <span class="block ${simCorrect ? 'block-correct' : 'block-incorrect'}">${simText || '?'}</span>`;
        } else {
            simWrapper.innerHTML = ` = <span class="block">${simText || '_'}</span>`;
        }

        // Обновляем Блок 2 (Ответ)
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
    });

    const activeElem = examplesList.querySelector('.active');
    if (activeElem) activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectExample(index) {
    activeIndex = index;
    renderAllLines();
    if (currentMode === 'multiplication' && typeof syncMonsterGame === 'function') {
        syncMonsterGame();
    }
}

// Единая логика для кнопок нумпада
function pressNum(n) {
    if (activeIndex === -1) return;
    
    let activeItem = examplesHistory[activeIndex];
    
    if (n === 'C') {
        activeItem.currentInput = '';
    } else if (n === 'D') {
        activeItem.currentInput = activeItem.currentInput.slice(0, -1);
    } else {
        let parts = activeItem.currentInput.split('=');
        if (n === '=' && parts.length >= 2) return;
        activeItem.currentInput += n;
    }
    
    renderAllLines();
}

function confirmAndNext() {
    if (currentMode === 'tens') {
        generateExample();
    } else if (currentMode === 'multiplication') {
        generateMultiExample();
    }
}
