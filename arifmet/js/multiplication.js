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

// РИТМИЧНЫЙ ХОР "НЯМ" И "ХРУМ" (БЕЗ БУЛЬКАНЬЯ)
function startWinSoundLoop() {
    if (winSoundIntervalId) return;

    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        // Скорость шага — 320 миллисекунд для бодрой детской песенки
        winSoundIntervalId = setInterval(() => {
            let now = ctx.currentTime;
            
            // Веселая мажорная лесенка нот для мелодии
            const scale = [293.66, 329.63, 392.00, 440.00]; // Ре, Ми, Соль, Ля
            let baseFreq = scale[Math.floor(melodyStep / 2) % scale.length]; 
            
            // Чередуем: четный шаг - Ням, нечетный шаг - Хрум
            let isHrum = (melodyStep % 2 === 1);

            if (!isHrum) {
                // ----------------------------------------------------
                // ФОРМАНТНЫЙ СИНТЕЗ ЗВУКА "НЯМ" (Двухголосый мультяшный звук)
                // ----------------------------------------------------
                // Осциллятор 1: отвечает за гласную "Ня-" (высокий тон)
                const osc1 = ctx.createOscillator();
                const gain1 = ctx.createGain();
                osc1.type = 'triangle';
                osc1.frequency.setValueAtTime(baseFreq * 1.5, now);
                osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, now + 0.08);
                
                // Осциллятор 2: падает глубоко вниз, имитируя закрытие губ на "-М"
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.type = 'sawtooth'; // добавляет речевой текстуры
                osc2.frequency.setValueAtTime(baseFreq * 0.9, now);
                osc2.frequency.linearRampToValueAtTime(120, now + 0.14); // резкий уход в бас на согласную М

                // Пропускаем через фильтр, чтобы убрать лишний гул и сделать звук "носовым"
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(baseFreq * 1.2, now);

                gain1.gain.setValueAtTime(0.12, now);
                gain1.gain.linearRampToValueAtTime(0.001, now + 0.14);
                
                gain2.gain.setValueAtTime(0.06, now);
                gain2.gain.linearRampToValueAtTime(0.001, now + 0.14);

                osc1.connect(gain1);
                osc2.connect(gain2);
                gain1.connect(filter);
                gain2.connect(filter);
                filter.connect(ctx.destination);

                osc1.start(now);
                osc2.start(now);
                osc1.stop(now + 0.15);
                osc2.stop(now + 0.15);
                
            } else {
                // ----------------------------------------------------
                // СУХОЙ СИНТЕЗ ЗВУКА "ХРУМ" (Фильтрованный треск + глухой удар)
                // ----------------------------------------------------
                // 1. Имитация сухого хруста (Высокочастотный отсеченный шум)
                const bufferSize = ctx.sampleRate * 0.04; 
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'highpass'; // Отсекаем весь низ, убирая "бульканье"
                noiseFilter.frequency.setValueAtTime(4000, now); // Оставляем только сухой шорох и треск

                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(0.18, now); 
                noiseGain.gain.linearRampToValueAtTime(0.001, now + 0.04);
                
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(ctx.destination);
                noise.start(now);
                
                // 2. Глухой короткий удар "-УМ" в конце хруста
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(180, now); // низкая глухая частота закрытого рта
                osc.frequency.linearRampToValueAtTime(90, now + 0.08);
                
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.linearRampToValueAtTime(0.001, now + 0.1);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.11);
            }

            melodyStep++; // Шаг вперед по тактам песенки
            
        }, 320);

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
        startWinSoundLoop(); 
    } else {
        stopWinSoundLoop();
    }
    
       gameZone.setAttribute('data-current-example', cacheKey);

    let html = '';
    
    for (let i = 0; i < currentMultiTask.monsters; i++) {
        // Если пример полностью решен — пиццы исчезают, иначе — рисуем пиццы
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
