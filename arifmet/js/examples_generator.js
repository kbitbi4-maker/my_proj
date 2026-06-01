let isAddition = true;
function initTensMode() {
    isAddition = true;
    document.querySelector('.header-title').innerText = 'Режим: Десятки ▼';
    generateExample();
}
function generateExample() {
    if (window.currentMode !== 'tens' && window.currentMode !== 'mix') return;
    if (!window.usedExamples) window.usedExamples = [];
    let num1, num2, correctValue, text;
    if (isAddition) {
        while (true) {
            num1 = Math.floor(Math.random() * 90) + 10;
            num2 = Math.floor(Math.random() * 90) + 10;
            if ((num1 % 10 + num2 % 10) > 10 && (num1 + num2) < 100) {
                text = num1 + '+' + num2;
                if (!window.usedExamples.includes(text)) {
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
                if (!window.usedExamples.includes(text)) {
                    correctValue = num1 - num2;
                    break;
                }
            }
        }
    }
    window.usedExamples.push(text);
    window.examplesHistory.push({ exampleText: text, correctValue: correctValue, currentInput: '' });
    window.activeIndex = window.examplesHistory.length - 1;
    isAddition = !isAddition;
    if (typeof renderAllLines === 'function') renderAllLines();
}
function initMixMode() {
    document.querySelector('.header-title').innerText = 'Режим: Микс 🎰 ▼';
    window.mixStep = 0;
    generateMixExample();
}
function generateMixExample() {
    if (window.currentMode !== 'mix') return;
    let type = window.mixStep % 3;
    if (type === 0) { isAddition = true; generateExample(); } 
    else if (type === 1) { isAddition = false; generateExample(); } 
    else if (type === 2 && typeof generateMultiExample === 'function') { generateMultiExample(); }
    document.querySelector('.header-title').innerText = 'Режим: Микс 🎰 ▼';
    window.mixStep++;
}

