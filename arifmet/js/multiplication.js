// Переменная для хранения текущего игрового задания (сколько монстров и пицц)
let currentMultiTask = null;

// 1. Функция инициализации режима (вызывается из menu.js при клике на меню)
function initMultiplicationMode() {
    document.querySelector('.header-title').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

// 2. Генерация примера на умножение
function generateMultiExample() {
    const num1 = Math.floor(Math.random() * 4) + 2; // сколько пицц у каждого (2-5)
    const num2 = Math.floor(Math.random() * 4) + 2; // сколько монстров (2-5)
    
    const text = num1 + '×' + num2;
    const correctValue = num1 * num2;

    // Сохраняем параметры для отрисовки графики
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
    renderMonsterGame(); // Отрисовываем лужайку с монстриками
}

// 3. Функция синхронизации при клике на старые примеры в левой колонке
function syncMonsterGame() {
    if (window.activeIndex === -1) return;
    
    const activeItem = window.examplesHistory[window.activeIndex];
    const parts = activeItem.exampleText.split('×');
    
    // Безопасное извлечение чисел с индексами без скрытых символов
    currentMultiTask = {
        items: parseInt(parts[0], 10),
        monsters: parseInt(parts[1], 10)
    };
    
    renderMonsterGame();
}

// 4. Отрисовка монстриков и пицц под списком примеров
function renderMonsterGame() {
    const leftArea = document.getElementById('examples-list');
    if (!leftArea) return;

    let gameZone = document.getElementById('game-zone');
    
    // Если зоны еще нет — создаем её в самом низу левой области
    if (!gameZone) {
        gameZone = document.createElement('div');
        gameZone.id = 'game-zone';
        gameZone.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
            margin-top: 25px;
            padding: 20px;
            background-color: #f0fdf4;
            border: 2px dashed #4ade80;
            border-radius: 12px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
            width: 90%;
            margin-left: auto;
            margin-right: auto;
        `;
        leftArea.appendChild(gameZone);
    }

    if (!currentMultiTask) {
        gameZone.innerHTML = '';
        return;
    }

    let html = '';
    
    // Генерируем монстриков и раскладываем пиццы
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
