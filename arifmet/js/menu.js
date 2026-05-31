// Глобальное состояние приложения, общее для всех режимов
let currentMode = '';
let examplesHistory = [];
let activeIndex = -1;

const menu = document.getElementById('menu');
const examplesList = document.getElementById('examples-list');

function toggleMenu() { 
    menu.classList.toggle('active'); 
}

function setMode(mode) {
    menu.classList.remove('active');
    
    if (mode === 'hundreds' || mode === 'thousands') { 
        alert("Режим в разработке 🛠️"); 
        return; 
    }
    
    currentMode = mode;
    examplesHistory = [];
    activeIndex = -1;
    
    if (examplesList) examplesList.innerHTML = '';
    
    const oldZone = document.getElementById('game-zone');
    if (oldZone) oldZone.remove();

    // Запускаем нужный игровой движок
    if (mode === 'tens') {
        initTensMode(); 
    } else if (mode === 'multiplication') {
        initMultiplicationMode(); 
    }
}

// Универсальный калькулятор для проверки выражений
function evaluateExpr(str) {
    try {
        // Разрешаем цифры, плюсы, минусы и знак умножения × (заменяя его на *)
        const cleaned = str.replace(/[^0-9+-\\*×]/g, '').replace(/×/g, '*');
        if (!cleaned) return null;
        return Function('"use strict"; return (' + cleaned + ')')();
    } catch (e) {
        return null;
    }
}

// Универсальный рендеринг строк для ВСЕХ режимов
function renderAllLines() {
    if (!examplesList) return;
    
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
            
            // Поддерживаем как однозначные (для умножения), так и двузначные числа
            let isValidLength = /^[0-9]{1,}$/.test(finText.trim());
            
            if (isValidLength || finText.trim() === String(item.correctValue)) {
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
    activeIndex = index;
    renderAllLines();
    // Логика синхронизации визуальной игры для умножения (напишем позже)
    if (currentMode === 'multiplication' && typeof syncMonsterGame === 'function') {
        syncMonsterGame();
    }
}

// Единая логика для кнопок нумпада
function pressNum(n) {
    if (activeIndex === -1) return;
    
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
    if (currentMode === 'tens') {
        generateExample();
    } else if (currentMode === 'multiplication') {
        generateMultiExample();
    }
}
