let isAddition = true; 
function initTensMode() {
    isAddition = true; 
    document.querySelector('.header-title').innerText = 'Режим: Десятки ▼';
    generateExample();
}
function generateExample() {
    if (window.currentMode !== 'tens' && window.currentMode !== 'mix') return;
    if (!window.usedExamples) window.usedExamples = []; // Инициализируем массив уникальности
    let num1, num2, correctValue, text;
    if (isAddition) {
        while (true) {
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            if ((num1 % 10 + num2 % 10) > 10 && (num1 + num2) < 100) {
                text = num1 + '+' + num2;
                if (!window.usedExamples.includes(text)) { // Проверка на уникальность
                    correctValue = num1 + num2;
                    break;
                }
            }
        }
    } else {
        while (true) {
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            if (num1 > num2 && (num2 % 10) >= (num1 % 10 + 1) && (num1 - num2) >= 1) {
                text = num1 + '-' + num2;
                if (!window.usedExamples.includes(text)) { // Проверка на уникальность
                    correctValue = num1 - num2;
                    break;
                }
            }
        }
    }
    window.usedExamples.push(text); // Запоминаем сгенерированный пример
    window.examplesHistory.push({
        exampleText: text,
        correctValue: correctValue,
        currentInput: ''
    });
    window.activeIndex = window.examplesHistory.length - 1;
    if (isAddition && typeof renderAdditionVisual === 'function') {
        renderAdditionVisual(num1, num2, '');
    } else if (!isAddition && typeof renderSubtractionVisual === 'function') {
        renderSubtractionVisual(num1, num2, '');
    }
    isAddition = !isAddition;
    renderAllLines();
}
