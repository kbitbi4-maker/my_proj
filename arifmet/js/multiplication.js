// Переменная для хранения текущего игрового задания (сколько монстров и пицц)
let currentMultiTask = null;

// Переменная для хранения ID зацикленного таймера звука
let winSoundIntervalId = null;

// Счетчик для создания ритма мелодии
let melodyStep = 0;

// 1. Функция инициализации режима (вызывается из menu.js при клике на меню)
function initMultiplicationMode() {
    document.querySelector('.header-title').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

// 2. Настоящая генерация примера на умножение
function generateMultiExample() {
    stopWinSoundLoop();

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
        items: parseInt(parts[0], 10),
        monsters: parseInt(parts[1], 10)
    };
    
    renderMonsterGame();
}

function stopWinSoundLoop() {
    if (winSoundIntervalId) {
        clearInterval(winSoundIntervalId);
        winSoundIntervalId = null;
    }
    melodyStep = 0;
}

// СТАБИЛЬНЫЙ МУЛЬТЯШНЫЙ ЗВУКОВОЙ ДВИЖОК (БЕЗ ОШИБОК СБОРКИ)
function startWinSoundLoop() {
    if (winSoundIntervalId) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Скорость шага — 320 миллисекунд
        winSoundIntervalId = setInterval(() => {
            let now = ctx.currentTime;
            
            // Веселая мажорная лесенка нот для мелодии (Ре, Ми, Соль, Ля)
            const scale = [293.66, 329.63, 392.00, 440.00]; 
            let baseFreq = scale[Math.floor(melodyStep / 2) % scale.length]; 
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Чередуем звуки: четный шаг - Ням, нечетный - Хрум
            if (melodyStep % 2 === 0) {
                // Имитация "Ням" через скольжение волны
                osc.type = 'triangle'; 
                osc.frequency.setValueAtTime(baseFreq * 1.3, now);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.12);
                gain.gain.setValueAtTime(0.12, now);
            } else {
                // Имитация "Хрум" через короткий булькающий шлепок
                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq * 0.8, now);
                osc.frequency.linearRampToValueAtTime(baseFreq * 0.4, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
            }

            // Плавное затухание звука
            gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 0.13);

            melodyStep++; 
            
        }, 320);

    } catch (e) {
        console.log("Audio Error");
    }
}

// 4. Отрисовка монстриков и пицц в панорамной нижней области
function renderMonsterGame() {
    const gameZone = document.getElementById('game-zone');
    if (!gameZone) return;

    if (!currentMultiTask || window.activeIndex === -1) {
        gameZone.innerHTML = '';
        gameZone.removeAttribute('data-current-example');
        stopWinSoundLoop(); 
        return;
    }

    const activeItem = window.examplesHistory[window.activeIndex];
    if (!activeItem || !activeItem.exampleText) return;

    // ПРОВЕРКА НА ПОЛНУЮ ПОБЕДУ
    let isFullySolved = false;
    if (activeItem.currentInput && activeItem.currentInput.includes('=')) {
        const partsArr = activeItem.currentInput.split('=');
        const simText = partsArr[0] || '';
        const finText = partsArr[1] || '';

        let simVal = evaluateExpr(simText);
        let simCorrect = (simVal === activeItem.correctValue);
        
        let checkParts = simText.split('+');
        let monsterCountFromText = parseInt(activeItem.exampleText.split('×')[1], 10);
        if (checkParts.length !== monsterCountFromText) {
            simCorrect = false;
        }

        let finVal = evaluateExpr(finText);
        let finCorrect = (finVal === activeItem.correctValue);

        if (simCorrect && finCorrect) {
            isFullySolved = true;
        }
    }

    const cacheKey = activeItem.exampleText + "_" + (isFullySolved ? "win" : "play");
    if (gameZone.getAttribute('data-current-example') === cacheKey) {
        return;
    }
    
    if (isFullySolved) {
        startWinSoundLoop(); 
    } else {
        stopWinSoundLoop();
    }
    
    gameZone.setAttribute('data-current-example', cacheKey);

    let html = '';
    
    for (let i = 0; i < currentMultiTask.monsters; i++) {
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
