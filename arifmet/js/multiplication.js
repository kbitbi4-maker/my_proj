// Переменная для хранения текущего игрового задания (сколько монстров и пицц)
let currentMultiTask = null;

// 1. Функция инициализации режима (вызывается из menu.js при клике на меню)
function initMultiplicationMode() {
    document.querySelector('.header-title').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

// 2. Настоящая генерация примера на умножение
function generateMultiExample() {
    const num1 = Math.floor(Math.random() * 4) + 2; // размер порции пиццы (2-5)
    const num2 = Math.floor(Math.random() * 4) + 2; // количество монстров (2-5)
    
    const text = num1 + '×' + num2;
    const correctValue = num1 * num2;

    currentMultiTask = {
        items: num1,
        monsters: num2
    };

    window.examplesHistory.push({
        exampleText: text,
        correctValue: correctValue,
        currentInput: ''
    });
    
    window.activeIndex = window.examplesHistory.length - 1;
    
    renderAllLines();
    renderMonsterGame(); 
}

// 3. Функция синхронизации при клике на старые примеры в левой колонке
function syncMonsterGame() {
    if (window.activeIndex === -1) return;
    
    const activeItem = window.examplesHistory[window.activeIndex];
    const parts = activeItem.exampleText.split('×');
    
    currentMultiTask = {
        items: parseInt(parts.at(0), 10),
        monsters: parseInt(parts.at(1), 10)
    };
    
    renderMonsterGame();
}

// 4. Отрисовка монстриков и пицц строго ВНИЗУ левой области
function renderMonsterGame() {
    const leftArea = document.getElementById('examples-list');
    if (!leftArea) return;

    // Ищем, нет ли уже созданной игровой зоны на странице
    let gameZone = document.getElementById('game-zone');
    
    if (!gameZone) {
        gameZone = document.createElement('div');
        gameZone.id = 'game-zone';
        
        // Оптимизировали CSS: добавили margin-top: auto для прижатия к полу
        gameZone.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            margin-top: auto;
            padding: 20px;
            background-color: #f0fdf4;
            border: 2px dashed #4ade80;
            border-radius: 12px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            width: 90%;
            margin-left: auto;
            margin-right: auto;
        `;
        
        // Принудительно задаем левой панели блочную структуру вертикального флекса,
        // чтобы margin-top: auto у лужайки сработал идеально
        leftArea.style.display = 'flex';
        leftArea.style.flexDirection = 'column';
        leftArea.style.minHeight = 'calc(100vh - 120px)'; // Адаптивная высота под размер экрана
        
        leftArea.appendChild(gameZone);
    }

    if (!currentMultiTask || window.activeIndex === -1) {
        gameZone.innerHTML = '';
        gameZone.removeAttribute('data-current-example');
        return;
    }

    const activeItem = window.examplesHistory[window.activeIndex];
    const exampleText = activeItem.exampleText;

    // Удержание графики при редактировании примера (защита от моргания)
    if (gameZone.getAttribute('data-current-example') === exampleText) {
        return;
    }

    gameZone.setAttribute('data-current-example', exampleText);

    let html = '';
    
    // Генерируем карточки монстриков
    for (let i = 0; i < currentMultiTask.monsters; i++) {
        const pizzasHTML = '<span style="font-size: 20px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));">🍕</span>'.repeat(currentMultiTask.items);
        
        html += `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #ffffff;
                padding: 12px;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                min-width: 90px;
            ">
                <span style="font-size: 42px; margin-bottom: 8px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));">👾</span>
                <div style="
                    display: flex;
                    gap: 4px;
                    justify-content: center;
                    flex-wrap: wrap;
                    max-width: 75px;
                    background: #fff7ed;
                    padding: 4px 8px;
                    border-radius: 6px;
                    border: 1px dashed #fed7aa;
                ">
                    ${pizzasHTML}
                </div>
            </div>
        `;
    }
    
    gameZone.innerHTML = html;
}
