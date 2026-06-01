// Переменная для хранения текущего игрового задания (сколько монстров и пицц)
let currentMultiTask = null;

// Глобальные переменные для контроля проигрывания аудиофайла
let winSoundIntervalId = null;
let currentAudioPlayer = null;
let audioRepeatCount = 0; // Счётчик для ограничения повторов звука

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

// ФУНКЦИЯ ОСТАНОВКИ И ГЛУШЕНИЯ ЗВУКА
function stopWinSoundLoop() {
    if (currentAudioPlayer) {
        currentAudioPlayer.onended = null;
        currentAudioPlayer.pause();
        currentAudioPlayer.currentTime = 0;
        currentAudioPlayer = null;
    }
    winSoundIntervalId = null;
    audioRepeatCount = 0;
}

// ФУНКЦИЯ ЗАПУСКА АУДИО С ОГРАНИЧЕНИЕМ В 3 ПОВТОРЕНИЯ
function startWinSoundLoop() {
    if (winSoundIntervalId) return;

    try {
        currentAudioPlayer = new Audio('audio/alien_win.mp3');
        currentAudioPlayer.volume = 0.25;
        currentAudioPlayer.loop = false;
        audioRepeatCount = 1;
        
        currentAudioPlayer.onended = function() {
            if (audioRepeatCount < 3) {
                audioRepeatCount++;
                if (currentAudioPlayer) currentAudioPlayer.play();
            } else {
                if (currentAudioPlayer) {
                    currentAudioPlayer.onended = null;
                    currentAudioPlayer = null;
                }
            }
        };
        
        currentAudioPlayer.play();
        winSoundIntervalId = true;
    } catch (e) {
        console.log("Аудио заблокировано политикой браузера");
    }
}

// 4. Отрисовка монстриков, пицц, слёз и анимаций
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

    // ПЕРЕМЕННЫЕ СОСТОЯНИЯ ИГРЫ
    let isFullySolved = false; // Флаг победы
    let isWrongAnswer = false; // Флаг ошибки

    if (activeItem.currentInput) {
        const partsArr = activeItem.currentInput.split('=');
        const simText = partsArr.at(0) || '';
        const finText = partsArr.at(1) || '';

        // Проверяем слагаемые
        let simVal = evaluateExpr(simText);
        let simCorrect = (simVal === activeItem.correctValue);
        let checkParts = simText.split('+');
        let monsterCountFromText = parseInt(activeItem.exampleText.split('×').at(1), 10);
        
        if (checkParts.length !== monsterCountFromText) {
            simCorrect = false;
        }

        // Проверяем финальный ответ
        let finVal = evaluateExpr(finText);
        let finCorrect = (finVal === activeItem.correctValue);
        let targetLength = String(activeItem.correctValue).length;

        // Если введён знак равенства, но слагаемые уже неверны — фиксируем ошибку
        if (activeItem.currentInput.includes('=') && !simCorrect) {
            isWrongAnswer = true;
        }

        // Если введён финальный ответ (длина совпала), но он неверный — фиксируем ошибку
        if (partsArr.length > 1 && finText.trim().length >= targetLength && !finCorrect) {
            isWrongAnswer = true;
        }

        // Чистая победа
        if (activeItem.currentInput.includes('=') && simCorrect && finCorrect) {
            isFullySolved = true;
        }
    }

    // Сохраняем состояние в кэш-ключ, включая ошибку
    let status = "play";
    if (isFullySolved) status = "win";
    if (isWrongAnswer) status = "sad";

    const cacheKey = activeItem.exampleText + "_" + status;
    if (gameZone.getAttribute('data-current-example') === cacheKey) {
        return;
    }
    
    // Управление звуком победы
    if (isFullySolved) {
        startWinSoundLoop(); 
    } else {
        stopWinSoundLoop();
    }
    
    gameZone.setAttribute('data-current-example', cacheKey);

    let html = '';
    
    for (let i = 0; i < currentMultiTask.monsters; i++) {
        let contentHTML = '';
        let bgBox = '#fff7ed';
        let borderBox = '1px dashed #fed7aa';
        let monsterClass = '';

        if (isFullySolved) {
            contentHTML = '<span style="font-size: 14px; color: #22c55e; font-weight: bold; animation: fadeIn 0.3s;">Ням-ням! 😋</span>';
            bgBox = '#dcfce7';
            borderBox = '1px dashed #22c55e';
            monsterClass = 'monster-happy';
        } else if (isWrongAnswer) {
            // Если ошибка — пиццы пропадают, капают анимированные слёзы
            contentHTML = '<span class="tears-animation" style="font-size: 22px;">💦</span>';
            bgBox = '#eff6ff'; // нежно-голубой цвет грусти
            borderBox = '1px dashed #60a5fa';
            monsterClass = 'monster-sad';
        } else {
            // Обычное состояние игры — раскладываем пиццы
            contentHTML = '<span style="font-size: 22px; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.1));">🍕</span>'.repeat(currentMultiTask.items);
        }
        
        html += `
            <div class="${monsterClass}" style="
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
                    background: ${bgBox};
                    padding: 4px 6px;
                    border-radius: 6px;
                    border: ${borderBox};
                    min-height: 32px;
                    align-items: center;
                ">
                    ${contentHTML}
                </div>
            </div>
        `;
    }
    
    gameZone.innerHTML = html;
}
