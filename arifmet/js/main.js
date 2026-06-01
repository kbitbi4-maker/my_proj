let isAddition = true; 

function initTensMode() {
    isAddition = true; 
    document.querySelector('.header-title').innerText = 'Режим: Десятки ▼';
    generateExample();
}

function generateExample() {
    // ИСПРАВЛЕНО: Добавлена приставка window. к глобальным переменным состояния
    if (window.currentMode !== 'tens') return;
    let num1, num2, correctValue, text;
    
    if (isAddition) {
        while (true) {
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            if ((num1 % 10 + num2 % 10) > 10 && (num1 + num2) < 100) {
                text = `${num1}+${num2}`;
                correctValue = num1 + num2;
                break;
            }
        }
    } else {
        while (true) {
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            if (num1 > num2 && (num2 % 10) >= (num1 % 10 + 1) && (num1 - num2) >= 1) {
                text = `${num1}-${num2}`;
                correctValue = num1 - num2;
                break;
            }
        }
    }
    
    // ИСПРАВЛЕНО: Запись идет строго в window.examplesHistory
    window.examplesHistory.push({
        exampleText: text,
        correctValue: correctValue,
        currentInput: ''
    });
    
    window.activeIndex = window.examplesHistory.length - 1;
    isAddition = !isAddition;
    
    renderAllLines();
}
