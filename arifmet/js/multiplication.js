// Переменная для хранения текущего игрового задания (сколько монстров и пицц)
let currentMultiTask = null;

// 1. Функция инициализации режима (вызывается из menu.js при клике на меню)
function initMultiplicationMode() {
    document.querySelector('.header-title').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

// 2. Генерация примера на умножение (от 2 до 5)
function generateMultiExample() {
    if (currentMode !== 'multiplication') return;

    // Генерируем случайные числа от 2 до 5 для ребенка 7 лет
    const itemsPerMonster = Math.floor(Math.random() * 4) + 2; // сколько пицц (2-5)
    const monsterCount = Math.floor(Math.random() * 4) + 2;    // сколько монстров (2-5)
    
    // Формируем текст примера с красивым знаком умножения
    const text = `${itemsPerMonster}×${monsterCount}`;
    const correctValue = itemsPerMonster * monsterCount;

    // Сохраняем параметры задания для отрисовки графики
    currentMultiTask = {
        items: itemsPerMonster,
        monsters: monsterCount
    };

    // Записываем пример в глобальную историю (общую для всего сайта)
    examplesHistory.push({
        exampleText: text,
        correctValue: correctValue,
        currentInput: ''
    });
    
    activeIndex = examplesHistory.length - 1;
    
    // Вызываем глобальный рендер строки из menu.js
    renderAllLines();
    
    // Запускаем отрисовку монстриков (напишем на следующем шаге)
    renderMonsterGame();
}

// 3. Функция синхронизации при клике на старые примеры в истории
function syncMonsterGame() {
    if (currentMode !== 'multiplication' || activeIndex === -1) return;
    
    const activeItem = examplesHistory[activeIndex];
    // Восстанавливаем количество монстров и пицц из текста примера (например, "3×4")
    const parts = activeItem.exampleText.split('×');
    
    currentMultiTask = {
        items: parseInt(parts[0]),
        monsters: parseInt(parts[1])
    };
    
    renderMonsterGame();
}
// 4. Отрисовка монстриков и пицц под списком примеров
function renderMonsterGame() {
    // Находим левую колонку, где живут примеры
    const leftArea = document.getElementById('examples-list');
    if (!leftArea) return;

    // Ищем, нет ли уже созданной игровой зоны на странице
    let gameZone = document.getElementById('game-zone');
    
    // Если зоны еще нет — создаем её и аккуратно прикрепляем в самый конец левой области
    if (!gameZone) {
        gameZone = document.createElement('div');
        gameZone.id = 'game-zone';
        
        // Стилизуем зону: делаем красивую рамку-лужайку
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
        `;
        leftArea.appendChild(gameZone);
    }

    // Если задание по какой-то причине пустое — очищаем лужайку
    if (!currentMultiTask) {
        gameZone.innerHTML = '';
        return;
    }

    let html = '';
    
    // Генерируем карточку для каждого монстрика
    for (let i = 0; i < currentMultiTask.monsters; i++) {
        // Используем встроенный метод повторения строк .repeat() для быстрой генерации пицц
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
                animation: popIn 0.3s ease-out;
            ">
                <!-- Забавный эмодзи монстрика -->
                <span style="font-size: 42px; margin-bottom: 8px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));">👾</span>
                
                <!-- Контейнер с порцией пиццы для этого конкретного монстра -->
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

