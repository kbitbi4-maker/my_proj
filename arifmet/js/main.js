// Константы и переменные, специфичные только для режима "Десятки"
const examplesList = document.getElementById('examples-list');
let isAddition = true; 

// Функция инициализации режима, вызывается из menu.js
function initTensMode() {
    isAddition = true; 
    document.querySelector('.header-title').innerText = 'Режим: Десятки ▼';
    generateExample();
}

function generateExample() {
    if (currentMode !== 'tens') return;
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
    
    examplesHistory.push({
        exampleText: text,
        correctValue: correctValue,
        currentInput: ''
    });
    
    activeIndex = examplesHistory.length - 1;
    isAddition = !isAddition;
    
    renderAllLines();
}

function evaluateExpr(str) {
    try {
        const cleaned = str.replace(/[^0-9+-]/g, '');
        if (!cleaned) return null;
        return Function('"use strict"; return (' + cleaned + ')')();
    } catch (e) {
        return null;
    }
}

function renderAllLines() {
    if (currentMode !== 'tens') return; // Рендерим только если активен этот режим
    
    const placeholder = examplesList.querySelector('div[style*="color: #999"]');
    if (placeholder) placeholder.remove();
    
    examplesList.innerHTML = '';
    
    examplesHistory.forEach((item, index) => {
        const line = document.createElement('div');
        line.className = `example-line ${index === activeIndex ? 'active' : ''}`;
        line.onclick = () => selectExample(index);
        
        let parts = item.currentInput.split('=');
        let html = `<span>${item.exampleText}</span>`;
        
        let simText = parts[0] || '';
        let finText = parts[1] || '';
        
        // 1. Блок упрощения
        if (item.currentInput.includes('=')) {
            let simVal = evaluateExpr(simText);
            let simCorrect = (simVal === item.correctValue);
            html += ` = <span class="block ${simCorrect ? 'block-correct' : 'block-incorrect'}">${simText || '?'}</span>`;
        } else {
            html += ` = <span class="block">${simText || '_'}</span>`;
        }
        
        // 2. Блок ответа
        if (parts.length > 1) {
            let finVal = evaluateExpr(finText);
            let finCorrect = (finVal === item.correctValue);
            
            let isTwoDigits = /^[0-9]{2,}$/.test(finText.trim());
            
            if (isTwoDigits || finText.trim() === String(item.correctValue)) {
                html += ` = <span class="block ${finCorrect ? 'block-correct' : 'block-incorrect'}">${finText}</span>`;
            } else if (finText.length > 0) {
                html += ` = <span class="block">${finText}</span>`;
            } else {
                html += ` = <span class="block">_</span>`;
            }
        }
        
        line.innerHTML = html;
        examplesList.appendChild(line);
    });
    
    const activeElem = examplesList.querySelector('.active');
    if (activeElem) activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectExample(index) {
    if (currentMode !== 'tens') return;
    activeIndex = index;
    renderAllLines();
}

function pressNum(n) {
    if (activeIndex === -1 || currentMode !== 'tens') return;
    
    let activeItem = examplesHistory[activeIndex];
    
    if (n === 'C') {
        activeItem.currentInput = '';
    } else if (n === 'D') {
        activeItem.currentInput = activeItem.currentInput.slice(0, -1);
    } else {
        let parts = activeItem.currentInput.split('=');
        if (n === '=' && parts.length >= 2) return;
        activeItem.currentInput += n;
    }
    
    renderAllLines();
}

function confirmAndNext() {
    if (currentMode !== 'tens') return;
    generateExample();
}
