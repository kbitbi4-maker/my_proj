let currentMultiTask = null;

function initMultiplicationMode() {
    document.querySelector('.header-title').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

function generateMultiExample() {
    const itemsPerMonster = Math.floor(Math.random() * 4) + 2; 
    const monsterCount = Math.floor(Math.random() * 4) + 2;    
    
    const text = `${itemsPerMonster}×${monsterCount}`;
    const correctValue = itemsPerMonster * monsterCount;

    currentMultiTask = {
        items: itemsPerMonster,
        monsters: monsterCount
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

function syncMonsterGame() {
    if (window.activeIndex === -1) return;
    
    const activeItem = window.examplesHistory[window.activeIndex];
    const parts = activeItem.exampleText.split('×');
    
    // Очищено от лишних скрытых символов
    currentMultiTask = {
        items: parseInt(parts[0], 10),
        monsters: parseInt(parts[1], 10)
    };
    
    renderMonsterGame();
}

function renderMonsterGame() {
    const leftArea = document.getElementById('examples-list');
    if (!leftArea) return;

    let gameZone = document.getElementById('game-zone');
    
    if (!gameZone) {
        gameZone = document.createElement('div');
        gameZone.id = 'game-zone';
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
            width: 90%;
            margin-left: auto;
            margin-right: auto;
        `;
        leftArea.appendChild(gameZone);
    }

    if (!currentMultiTask) {
        gameZone.innerHTML = '';
        return;
    }

    let html = '';
    
    for (let i = 0; i < currentMultiTask.monsters; i++) {
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
            ">
                <span style="font-size: 42px; margin-bottom: 8px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.1));">👾</span>
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
