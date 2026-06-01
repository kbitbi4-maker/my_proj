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
    if (!activeItem || !activeItem.exampleText) return;
    
    const parts = activeItem.exampleText.split('×');
    if (parts.length !== 2) return;
    
    currentMultiTask = {
        items: parseInt(parts.at(0), 10),
        monsters: parseInt(parts.at(1), 10)
    };
    
    renderMonsterGame();
}

// 4. Отрисовка монстриков и пицц в панорамной нижней области (высота 32%)
function renderMonsterGame() {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;

    if (!currentMultiTask || window.activeIndex === -1) {
        gameZone.innerHTML = '';
        gameZone.removeAttribute('data-current-example');
        return;
    }

    const activeItem = window.examplesHistory[window.activeIndex];
    if (!activeItem || !activeItem.exampleText) return;

    // ПРОВЕРКА НА ПОЛНУЮ ПОБЕДУ
    let isFullySolved = false;
    if (activeItem.currentInput && activeItem.currentInput.includes('=')) {
        const partsArr = activeItem.currentInput.split('=');
        const simText = partsArr.at(0) || '';
        const finText = partsArr.at(1) || '';

        // Проверяем промежуточную сумму слагаемых
        let simVal = evaluateExpr(simText);
        let simCorrect = (simVal === activeItem.correctValue);
        
        // Проверяем количество слагаемых
        let checkParts = simText.split('+');
        let monsterCountFromText = parseInt(activeItem.exampleText.split('×').at(1), 10);
        if (checkParts.length !== monsterCountFromText) {
            simCorrect = false;
        }

        // Проверяем финальный ответ
        let finVal = evaluateExpr(finText);
        let finCorrect = (finVal === activeItem.correctValue);

        // Если и слагаемые, и ответ верны — победа!
        if (simCorrect && finCorrect) {
            isFullySolved = true;
        }
    }

    // Кэш-ключ теперь отслеживает и текст примера, и статус победы
    const cacheKey = activeItem.exampleText + "_" + (isFullySolved ? "win" : "play");
    if (gameZone.getAttribute('data-current-example') === cacheKey) {
        return;
    }
    gameZone.setAttribute('data-current-example', cacheKey);

    let html = '';
    
    // Генерируем карточки монстриков
    for (let i = 0; i < currentMultiTask.monsters; i++) {
        // Если пример решен — пиццы превращаются в текст "Ням-ням!"
        const pizzasHTML = isFullySolved 
            ? '<span style="font-size: 14px; color: #22c55e; font-weight: bold; animation: fadeIn 0.3s;">Ням-ням! 😋</span>' 
            : '<span style="font-size: 22px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));">🍕</span>'.repeat(currentMultiTask.items);
        
        html += `
            <div class="${isFullySolved ? 'monster-happy' : ''}" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                background: #ffffff;
                padding: 10px 15px;
                border: 2px solid #e2e8f0;
                border-radius: 12px;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                min-width: 85px;
                box-sizing: border-box;
                transition: all 0.3s ease;
            ">
                <span style="font-size: 46px; margin-bottom: 6px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));">👾</span>
                <div style="
                    display: flex;
                    gap: 4px;
                    justify-content: center;
                    flex-wrap: wrap;
                    max-width: 80px;
                    background: ${isFullySolved ? '#dcfce7' : '#fff7ed'};
                    padding: 4px 6px;
                    border-radius: 6px;
                    border: 1px dashed ${isFullySolved ? '#22c55e' : '#fed7aa'};
                    min-height: 32px;
                    align-items: center;
                ">
                    ${pizzasHTML}
                </div>
            </div>
        `;
    }
    
    gameZone.innerHTML = html;
}
