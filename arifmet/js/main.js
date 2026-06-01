let isAddition = true; 

function initTensMode() {
    isAddition = true; 
    document.querySelector('.header-title').innerText = 'Режим: Десятки ▼';
    generateExample();
}

function generateExample() {
    // ИСПРАВЛЕНО: Теперь генератор разрешает работу как в режиме Десятков, так и в Миксе
    if (window.currentMode !== 'tens' && window.currentMode !== 'mix') return;
    let num1, num2, correctValue, text;
    
    if (isAddition) {
        while (true) {
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            if ((num1 % 10 + num2 % 10) > 10 && (num1 + num2) < 100) {
                text = num1 + '+' + num2;
                correctValue = num1 + num2;
                break;
            }
        }
    } else {
        while (true) {
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            if (num1 > num2 && (num2 % 10) >= (num1 % 10 + 1) && (num1 - num2) >= 1) {
                text = num1 + '-' + num2;
                correctValue = num1 - num2;
                break;
            }
        }
    }
    
    window.examplesHistory.push({
        exampleText: text,
        correctValue: correctValue,
        currentInput: ''
    });
    
    window.activeIndex = window.examplesHistory.length - 1;
    
    // ИНТЕГРАЦИЯ ВИЗУАЛИЗАЦИИ: Проверяем, какой пример был сгенерирован
    if (isAddition) {
        // Если у вас в addition_visual.js функция называется render, вызываем её:
        if (typeof AdditionVisual !== 'undefined' && AdditionVisual.render) {
            AdditionVisual.render('game-zone', num1, num2);
        }
    } else {
        // Если это вычитание, инициализируем сцену с роботами и кубиками
        if (typeof SubtractionVisual !== 'undefined' && SubtractionVisual.init) {
            SubtractionVisual.init('game-zone', num1, num2);
        }
    }
    
    isAddition = !isAddition;
    
    renderAllLines();
}
