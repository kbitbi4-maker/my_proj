// Переменная для хранения текущего игрового задания (сколько монстров и пицц)
let currentMultiTask = null;

// Переменная для хранения ID зацикленного таймера звука
let winSoundIntervalId = null;

// 1. Функция инициализации режима (вызывается из menu.js при клике на меню)
function initMultiplicationMode() {
    document.querySelector('.header-title').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

// 2. Настоящая генерация примера на умножение
function generateMultiExample() {
    // Перед генерацией нового примера железно останавливаем старый зацикленный звук
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

// Функция остановки бесконечного звука
function stopWinSoundLoop() {
    if (winSoundIntervalId) {
        clearInterval(winSoundIntervalId);
        winSoundIntervalId = null;
    }
}

// ЗАЦИКЛЕННЫЙ И РАЗНООБРАЗНЫЙ ЗВУК ХОРА ПРИШЕЛЬЦЕВ
function startWinSoundLoop() {
    // Защита: если звук уже вовсю играет — не запускаем еще один параллельно
    if (winSoundIntervalId) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Запускаем бесконечный цикл возгласов, который срабатывает каждые 450 миллисекунд
        winSoundIntervalId = setInterval(() => {
            // Забавный случайный выбор одного из трех типов инопланетных возгласов
            const soundType = Math.floor(Math.random() * 3);
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            let now = ctx.currentTime;

            // Рандомизируем базовый голос (высокий или низкий пришелец кричит)
            let baseFreq = 250 + Math.random() * 350; 

            switch (soundType) {
                case 0: // Возглас 1: Резкий испуганный "ПИУ!" вверх
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(baseFreq, now);
                    osc.frequency.exponentialRampToValueAtTime(baseFreq * 3, now + 0.15);
                    break;
                case 1: // Возглас 2: Булькающий прыгающий "УИ-УИ" вниз-вверх
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(baseFreq * 1.5, now);
                    osc.frequency.linearRampToValueAtTime(baseFreq * 0.7, now + 0.08);
                    osc.frequency.linearRampToValueAtTime(baseFreq * 2, now + 0.18);
                    break;
                case 2: // Возглас 3: Дрожащий космический крик радости (вибрато)
                    osc.type = 'sawtooth'; // более яркий праздничный звук
                    osc.frequency.setValueAtTime(baseFreq, now);
                    // Быстрое раскачивание частоты туда-сюда
                    for (let i = 0; i < 6; i++) {
                        let modTime = now + (i * 0.03);
                        let offset = (i % 2 === 0) ? 40 : -40;
                        osc.frequency.setValueAtTime(baseFreq + offset, modTime);
                    }
                    break;
            }

            // Мягкая комфортная громкость, чтобы не раздражать при долгом звучании
            gain.gain.setValueAtTime(0.08, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(now);
            osc.stop(now + 0.25);

        }, 450);

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
        stopWinSoundLoop(); // Останавливаем звук, если ушли с примера
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

        if (simCorrect && finCorrect) {
            isFullySolved = true;
        }
    }

    const cacheKey = activeItem.exampleText + "_" + (isFullySolved ? "win" : "play");
    if (gameZone.getAttribute('data-current-example') === cacheKey) {
        return;
    }
    
    // Если зафиксирована победа — запускаем бесконечный разнообразный хор пришельцев
    if (isFullySolved) {
        startWinSoundLoop();
    } else {
        // Если ребенок стер ответ или пример сменился — глушим звук
        stopWinSoundLoop();
    }
    
    gameZone.setAttribute('data-current-example', cacheKey);

    let html = '';
    
    // Генерируем карточки монстриков
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
