// 1. Функция инициализации режима (вызывается из menu.js при клике на меню)
function initMultiplicationMode() {
    document.querySelector('.header-title').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

// 2. Генерация простейшего примера на умножение
function generateMultiExample() {
    // Генерируем числа от 2 до 5
    const num1 = Math.floor(Math.random() * 4) + 2; 
    const num2 = Math.floor(Math.random() * 4) + 2;    
    
    const text = num1 + '×' + num2;
    const correctValue = num1 * num2;

    // Пушим в глобальную историю сайта
    window.examplesHistory.push({
        exampleText: text,
        correctValue: correctValue,
        currentInput: ''
    });
    
    window.activeIndex = window.examplesHistory.length - 1;
    
    // Запускаем плавный рендер строки из menu.js
    renderAllLines();
}

