// Глобальное состояние приложения, общее для всех режимов
window.currentMode = '';
window.examplesHistory = [];
window.activeIndex = -1;

// Шаг для чередования в режиме Микс (0 - плюс, 1 - минус, 2 - умножение)
window.mixStep = 0;

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
    window.mixStep = 0; // Сбрасываем счётчик микса при старте режима
    
    if (examplesList) examplesList.innerHTML = '';
    
    // Мягко очищаем область монстров
    const gameZone = document.getElementById('game-zone');
    if (gameZone) {
        gameZone.innerHTML = '';
        gameZone.removeAttribute('data-current-example');
    }

    // Диспетчер запуска режимов
    if (mode === 'tens') {
        initTensMode(); 
    } else if (mode === 'multiplication') {
        initMultiplicationMode(); 
    } else if (mode === 'mix') {
        initMixMode(); // Запуск нового режима
    }
}

// Функция старта режима МИКС
function initMixMode() {
    document.querySelector('.header-title').innerText = 'Режим: Микс 🎰 ▼';
    window.mixStep = 0; // Начинаем со сложения
    generateMixExample();
}

// Генератор примеров для режима МИКС с умным переключением графики
function generateMixExample() {
    if (window.currentMode !== 'mix') return;

    // Считаем остаток от деления, определяя тип примера
    let type = window.mixStep % 3;

    if (type === 0) {
        // 1. Очередь СЛОЖЕНИЯ (вызываем генератор из main.js, принудительно включив плюс)
        isAddition = true;
        generateExample();
    } else if (type === 1) {
        // 2. Очередь ВЫЧИТАНИЯ (вызываем генератор из main.js, принудительно включив минус)
        isAddition = false;
        generateExample();
    } else if (type === 2) {
        // 3. Очередь УМНОЖЕНИЯ (вызываем генератор из multiplication.js)
        generateMultiExample();
    }

    // Синхронизируем заголовок активного примера в истории, чтобы вернуть правильный текст режима в шапку
    document.querySelector('.header-title').innerText = 'Режим: Микс 🎰 ▼';

    window.mixStep++; // Двигаем очередь на следующий шаг
}

// УНИВЕРСАЛЬНЫЙ БЕЗОПАСНЫЙ КАЛЬКУЛЯТОР (С полной защитой от NaN)
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

        // Определяем, является ли проверяемая строка умножением
        let isMultiplicationLine = item.exampleText.includes('×');

        // 1. РЕНДЕРИНГ БЛОКА УПРОЩЕНИЯ
        if (item.currentInput.includes('=')) {
            let simVal = evaluateExpr(simText);
            let simCorrect = (simVal === item.correctValue);
            
            // Запускаем проверку слагаемых только если это строка умножения
            if (isMultiplicationLine && simCorrect && simText) {
                let checkParts = simText.split('+');
                let monsterCountFromText = parseInt(item.exampleText.split('×')[1], 10);
                if (checkParts.length !== monsterCountFromText) {
                    simCorrect = false;
                }
            }

            simWrapper.innerHTML = ' = <span class="block ' + (simCorrect ? 'block-correct' : 'block-incorrect') + '">' + (simText || '?') + '</span>';
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
            } else if (trimmedFinText.length > 0) {
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

// Клик по старым примерам в истории
function selectExample(index) {
    window.activeIndex = index;
    renderAllLines();

    // Умное переключение монстров при клике по истории в режиме Микс
    const activeItem = window.examplesHistory[index];
    if (activeItem && activeItem.exampleText.includes('×')) {
        if (typeof syncMonsterGame === 'function') syncMonsterGame();
    } else {
        // Если кликнули на плюс или минус — очищаем нижний этаж от монстров
        const gameZone = document.getElementById('game-zone');
        if (gameZone) {
            gameZone.innerHTML = '';
            gameZone.removeAttribute('data-current-example');
        }
    }
}

// Единая логика для кнопок нумпада
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

    // Перерисовываем монстров при вводе только если текущий активный пример — это умножение
    if (activeItem.exampleText.includes('×') && typeof renderMonsterGame === 'function') {
        renderMonsterGame();
    }
}

// Кнопка "Следующий пример"
function confirmAndNext() {
    if (window.currentMode === 'tens') {
        generateExample();
    } else if (window.currentMode === 'multiplication') {
        generateMultiExample();
    } else if (window.currentMode === 'mix') {
        generateMixExample(); // Вызов генерации микса по кругу
    }
}
