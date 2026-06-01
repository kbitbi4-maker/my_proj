// Переменная для хранения текущего игрового задания (сколько монстров и пицц)
let currentMultiTask = null;

// Переменная для хранения ID зацикленного таймера звука
let winSoundIntervalId = null;

// Счетчики для создания ритма мелодии
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
        items: parseInt(parts.at(0), 10),
        monsters: parseInt(parts.at(1), 10)
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

// ВЕСЕЛАЯ МЕЛОДИЯ ИЗ "НЯМОВ" И "ХРУМОВ"
function startWinSoundLoop() {
    if (winSoundIntervalId) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Скорость мелодии: шаг каждые 300 миллисекунд (веселый бодрый темп)
        winSoundIntervalId = setInterval(() => {
            let now = ctx.currentTime;
            
            // Базовые ноты для веселой мелодии (До, Ре, Ми, Соль)
            const scale = [261.63, 293.66, 329.63, 392.00];
            // Меняем ноту каждые два шага, чтобы получилась песенка
            let baseFreq = scale[Math.floor(melodyStep / 2) % scale.length]; 
            
            // РИТМИЧЕСКИЙ РИСУНОК: Шаг 0 - Ням, Шаг 1 - Хрум, Шаг 2 - Ням, Шаг 3 - Хрум-Хрум
            let isHrum = (melodyStep % 2 === 1);
            
            // Если шаг №3, с вероятностью 50% делаем двойной хруст
            if (melodyStep % 4 === 3 && Math.random() > 0.5) isHrum = true;

            if (!isHrum) {
                // ----------------------------------------------------
                // СИНТЕЗ ЗВУКА "НЯМ" (Мягкий гласный звук)
                // ----------------------------------------------------
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                // Прямоугольная волна ближе всего к мультяшному голосу
                osc.type = 'triangle'; 
                
                // "Ня-" (высокий старт) -> "-м" (резкое падение частоты вниз)
                osc.frequency.setValueAtTime(baseFreq * 1.4, now);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.12);
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.15);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
                
            } else {
                // ----------------------------------------------------
                // СИНТЕЗ ЗВУКА "ХРУМ" (Шум + Низкий тон чавканья)
                // ----------------------------------------------------
                // 1. Создаем хрустящий белый шум
                const bufferSize = ctx.sampleRate * 0.05; // очень короткий всплеск (0.05 сек)
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.08, now); // громкость хруста
                noiseGain.gain.linearRampToValueAtTime(0.001, now + 0.04);
                
                noise.connect(noiseGain);
                noiseGain.connect(ctx.destination);
                noise.start(now);
                
                // 2. Добавляем к шуму основу звука "-ум"
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(baseFreq * 0.8, now);
                osc.frequency.linearRampToValueAtTime(baseFreq * 0.4, now + 0.12);
                
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.14);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            }

            melodyStep++; // Переходим к следующему такту песенки
            
        }, 300);

    } catch (e) {
        console.log("Аудио-контекст заблокирован браузером");
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
        const simText = partsArr.at(0) || '';
        const finText = partsArr.at(1) || '';

        let simVal = evaluateExpr(simText);
        let simCorrect = (simVal === activeItem.correctValue);
        
        let checkParts = simText.split('+');
        let monsterCountFromText = parseInt(activeItem.exampleText.split('×').at(1), 10);
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
        startWinSoundLoop(); // Запускаем зацикленный оркестр нямов и хрумов
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
