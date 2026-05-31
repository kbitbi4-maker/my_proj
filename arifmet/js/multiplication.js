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

