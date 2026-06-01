// Глобальное состояние приложения, общее для всех режимов
window.currentMode = '';
window.examplesHistory = [];
window.activeIndex = -1;

// Шаг для чередования в режиме Микс (0 - плюс, 1 - минус, 2 - умножение)
window.mixStep = 0;

const menu = document.getElementById('menu');
const examplesList = document.getElementById('examples-list');

// Флаги, чтобы звуки ошибки не тарахтели при вводе каждой неверной цифры
let simFailSoundPlayed = false;
let finFailSoundPlayed = false;

// НОВЫЕ ФЛАГИ: Чтобы победные звуки в десятках срабатывали ровно по одному разу
let simWinSoundPlayed = false;
let finWinSoundPlayed = false;

function toggleMenu() { 
    menu.classList.toggle('active'); 
}

function setMode(mode) {
    menu.classList.remove('active');
    
    if (mode === 'hundreds' || mode === 'thousands') { 
        alert("Режим в разработке 🛠️"); 
        return; 
    }
    
    window.currentMode = mode;
    window.examplesHistory = [];
    window.activeIndex = -1;
    window.mixStep = 0;
    simFailSoundPlayed = false;
    finFailSoundPlayed = false;
    simWinSoundPlayed = false;
    finWinSoundPlayed = false;
    
    if (examplesList) examplesList.innerHTML = '';
    
    const gameZone = document.getElementById('game-zone');
    if (gameZone) {
        gameZone.innerHTML = '';
        gameZone.removeAttribute('data-current-example');
    }

    if (mode === 'tens') {
        initTensMode(); 
    } else if (mode === 'multiplication') {
        initMultiplicationMode(); 
    } else if (mode === 'mix') {
        initMixMode();
    }
}

function initMixMode() {
    document.querySelector('.header-title').innerText = 'Режим: Микс 🎰 ▼';
    window.mixStep = 0;
    generateMixExample();
}

function generateMixExample() {
    if (window.currentMode !== 'mix') return;

    let type = window.mixStep % 3;

    if (type === 0) {
        isAddition = true;
        generateExample();
    } else if (type === 1) {
        isAddition = false;
        generateExample();
    } else if (type === 2) {
        generateMultiExample();
    }

    document.querySelector('.header-title').innerText = 'Режим: Микс 🎰 ▼';
    window.mixStep++;
}

// УНИВЕРСАЛЬНЫЙ БЕЗОПАСНЫЙ КАЛЬКУЛЯТОР
function evaluateExpr(str) {
    if (!str) return null;
    let cleaned = str.replace(/×/g, '*').trim();
    
    // 1. Обработка умножения
    if (cleaned.includes('*')) {
        let partsArr = cleaned.split('*');
        if (partsArr.length === 2 && partsArr[0] && partsArr[1]) {
            let n1 = parseInt(partsArr[0], 10);
            let n2 = parseInt(partsArr[1], 10);
            return (isNaN(n1) || isNaN(n2)) ? null : n1 * n2;
        }
        return null;
    }
    // 2. Обработка сложения (цепочки любой длины)
    if (cleaned.includes('+')) {
        let partsArr = cleaned.split('+');
        let sum = 0;
        for (let i = 0; i < partsArr.length; i++) {
            let num = parseInt(partsArr[i], 10);
            if (isNaN(num)) return null; 
            sum += num;
        }
        return sum;
    }
    // 3. Обработка вычитания
    if (cleaned.includes('-')) {
        let partsArr = cleaned.split('-');
        if (partsArr.length === 2 && partsArr[0] && partsArr[1]) {
            let n1 = parseInt(partsArr[0], 10);
            let n2 = parseInt(partsArr[1], 10);
            return (isNaN(n1) || isNaN(n2)) ? null : n1 - n2;
        }
        return null;
    }
    
    let num = parseInt(cleaned, 10);
    return isNaN(num) ? null : num;
}

// ФУНКЦИЯ ВОСПРОИЗВЕДЕНИЯ ЗВУКА ОШИБКИ
function playFailSound() {
    try {
        const audio = new Audio('audio/fail.mp3');
        audio.volume = 0.25;
        audio.play();
    } catch (e) {
        console.log("Звук заблокирован политикой браузера");
    }
}

// НОВАЯ ФУНКЦИЯ ВОСПРОИЗВЕДЕНИЯ ЗВУКА УСПЕХА ДЛЯ ДЕСЯТКОВ
function playTensWinSound() {
    try {
        // Запускаем ваш скачанный win.mp3
        const audio = new Audio('audio/win.mp3');
        audio.volume = 0.25;
        audio.play();
    } catch (e) {
        console.log("Звук заблокирован политикой браузера");
    }
}

// Универсальный рендеринг строк для ВСЕХ режимов
function renderAllLines() {
    if (!examplesList) return;
    
    const placeholder = examplesList.querySelector('div[style*="color: #999"]');
    if (placeholder) placeholder.remove();

    let currentRenderedCount = examplesList.children.length;

    if (currentRenderedCount < window.examplesHistory.length) {
        for (let index = currentRenderedCount; index < window.examplesHistory.length; index++) {
            const item = window.examplesHistory[index];
            const line = document.createElement('div');
            line.className = `example-line ${index === window.activeIndex ? 'active' : ''}`;
            line.setAttribute('data-index', index);
            line.onclick = () => selectExample(index);
            
            line.innerHTML = `
                <span class="example-text">${item.exampleText}</span>
                <span class="sim-block-wrapper"></span>
                <span class="fin-block-wrapper"></span>
            `;
            examplesList.appendChild(line);
        }
    } else if (currentRenderedCount > window.examplesHistory.length) {
        examplesList.innerHTML = '';
    }

    window.examplesHistory.forEach((item, index) => {
        const line = examplesList.querySelector(`[data-index="${index}"]`);
        if (!line) return;

        if (index === window.activeIndex) {
            line.classList.add('active');
        } else {
            line.classList.remove('active');
        }

        const partsArr = item.currentInput.split('=');
        
        const simText = (partsArr.length > 0) ? partsArr[0] : '';
        const finText = (partsArr.length > 1) ? partsArr[1] : '';

        const simWrapper = line.querySelector('.sim-block-wrapper');
        const finWrapper = line.querySelector('.fin-block-wrapper');

        const targetLength = String(item.correctValue).length;

        let isMultiplicationLine = item.exampleText.includes('×');

        // 1. РЕНДЕРИНГ БЛОКА УПРОЩЕНИЯ (Слагаемые или Промежуточное вычисление)
        if (item.currentInput.includes('=')) {
            let simVal = evaluateExpr(simText);
            let simCorrect = (simVal === item.correctValue);
            
            if (isMultiplicationLine && simCorrect && simText) {
                let checkParts = simText.split('+');
                let monsterCountFromText = parseInt(item.exampleText.split('×')[1], 10);
                if (checkParts.length !== monsterCountFromText) {
                    simCorrect = false;
                }
            }

            simWrapper.innerHTML = ' = <span class="block ' + (simCorrect ? 'block-correct' : 'block-incorrect') + '">' + (simText || '?') + '</span>';
            
            // Логика звуков для Блока Упрощения
            if (index === window.activeIndex) {
                if (!simCorrect && !simFailSoundPlayed) {
                    playFailSound();
                    simFailSoundPlayed = true; 
                }
                // ЗВУК ТРИУМФА: Если это ПЛЮС или МИНУС (не умножение) и блок стал зеленым
                if (simCorrect && !isMultiplicationLine && !simWinSoundPlayed) {
                    playTensWinSound();
                    simWinSoundPlayed = true; // Блокируем повтор
                }
                // Сброс флагов при исправлении ошибок
                if (simCorrect) simFailSoundPlayed = false;
                if (!simCorrect) simWinSoundPlayed = false;
            }

        } else {
            simWrapper.innerHTML = ' = <span class="block">' + (simText || '_') + '</span>';
        }

        // 2. РЕНДЕРИНГ БЛОКА ОТВЕТА
        if (partsArr.length > 1) {
            let finVal = evaluateExpr(finText);
            let finCorrect = (finVal === item.correctValue);
            let trimmedFinText = String(finText).trim();
            
            if (trimmedFinText.length >= targetLength) {
                finWrapper.innerHTML = ' = <span class="block ' + (finCorrect ? 'block-correct' : 'block-incorrect') + '">' + finText + '</span>';
                
                // Логика звуков для Финального Ответа
                if (index === window.activeIndex) {
                    if (!finCorrect && !finFailSoundPlayed) {
                        playFailSound();
                        finFailSoundPlayed = true;
                    }
                    // ЗВУК ТРИУМФА: Если ответ верный и это ПЛЮС или МИНУС (у умножения свой плеер в multiplication.js)
                    if (finCorrect && !isMultiplicationLine && !finWinSoundPlayed) {
                        playTensWinSound();
                        finWinSoundPlayed = true;
                    }
                    if (finCorrect) finFailSoundPlayed = false;
                    if (!finCorrect) finWinSoundPlayed = false;
                }

            } else if (trimmedFinText.length > 0) {
                finWrapper.innerHTML = ' = <span class="block">' + finText + '</span>';
                if (index === window.activeIndex) {
                    finFailSoundPlayed = false; 
                    finWinSoundPlayed = false; // Сбрасываем флаг, пока ребенок дописывает число
                }
            } else {
                finWrapper.innerHTML = ' = <span class="block">_</span>';
                if (index === window.activeIndex) {
                    finFailSoundPlayed = false;
                    finWinSoundPlayed = false;
                }
            }
        } else {
            finWrapper.innerHTML = '';
        }
    });

    const activeElem = examplesList.querySelector('.active');
    if (activeElem) activeElem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function selectExample(index) {
    window.activeIndex = index;
    simFailSoundPlayed = false;
    finFailSoundPlayed = false;
    simWinSoundPlayed = false;
    finWinSoundPlayed = false;
    renderAllLines();

