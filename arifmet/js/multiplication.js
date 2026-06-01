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

// 4. Отрисовка монстриков и пицц в панорамной нижней области
function renderMonsterGame() {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;

    if (!currentMultiTask || window.activeIndex === -1) {
        gameZone.innerHTML = '';
        gameZone.removeAttribute('data-current-example');
        return;
    }

    const activeItem = window.examplesHistory[window.activeIndex];
    const exampleText = activeItem.exampleText;

    // Удержание графики при редактировании примера (блокируем мерцание)
    if (gameZone.getAttribute('data-current-example') === exampleText) {
        return;
    }

    gameZone.setAttribute('data-current-example', exampleText);

    let html = '';
    
    // Генерируем карточки монстриков (увеличили размеры под широкую зону)
    for (let i = 0; i < currentMultiTask.monsters; i++) {
        const pizzasHTML = '<span style="font-size: 24px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));">🍕</span>'.repeat(currentMultiTask.items);
        
        html += `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #ffffff;
                padding: 15px;
                border: 2px solid #e2e8f0;
                border-radius: 14px;
                box-shadow: 0 6px 12px -2px rgba(0, 0, 0, 0.04);
                min-width: 110px;
            ">
                <span style="font-size: 52px; margin-bottom: 10px; filter: drop-shadow(0 3px 3px rgba(0,0,0,0.1));">👾</span>
                <div style="
                    display: flex;
                    gap: 5px;
                    justify-content: center;
                    flex-wrap: wrap;
                    max-width: 90px;
                    background: #fff7ed;
                    padding: 6px 10px;
                    border-radius: 8px;
                    border: 1px dashed #fed7aa;
                ">
                    ${pizzasHTML}
                </div>
            </div>
        `;
    }
    
    gameZone.innerHTML = html;
}
