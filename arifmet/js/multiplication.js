let currentMultiTask = null;
let winSoundIntervalId = null;
let melodyStep = 0;

function initMultiplicationMode() {
    document.querySelector('.header-title').innerText = 'Режим: Умножение 🍕 ▼';
    generateMultiExample();
}

function generateMultiExample() {
    stopWinSoundLoop();
    const num1 = Math.floor(Math.random() * 4) + 2; 
    const num2 = Math.floor(Math.random() * 4) + 2; 
    currentMultiTask = { items: num1, monsters: num2 };

    window.examplesHistory.push({
        exampleText: num1 + '×' + num2,
        correctValue: num1 * num2,
        currentInput: ''
    });
    window.activeIndex = window.examplesHistory.length - 1;
    renderAllLines();
    renderMonsterGame(); 
}

function syncMonsterGame() {
    if (window.activeIndex === -1) return;
    const parts = window.examplesHistory[window.activeIndex].exampleText.split('×');
    currentMultiTask = { items: parseInt(parts[0], 10), monsters: parseInt(parts[1], 10) };
    renderMonsterGame();
}

function stopWinSoundLoop() {
    if (winSoundIntervalId) clearInterval(winSoundIntervalId);
    winSoundIntervalId = null;
    melodyStep = 0;
}

// Сжатый оптимизированный синтезатор "Ням" и "Хрум"
function startWinSoundLoop() {
    if (winSoundIntervalId) return;
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const scale = [293.66, 329.63, 392.00, 440.00];

        winSoundIntervalId = setInterval(() => {
            let now = ctx.currentTime;
            let baseFreq = scale[Math.floor(melodyStep / 2) % scale.length];
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            if (melodyStep % 2 === 0) {
                // НЯМ: Скользящий тон вниз
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(baseFreq * 1.3, now);
                osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, now + 0.12);
                gain.gain.setValueAtTime(0.15, now);
            } else {
                // ХРУМ: Низкий глухой шлепок-удар
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.08);
                gain.gain.setValueAtTime(0.2, now);
            }

            gain.gain.linearRampToValueAtTime(0.001, now + 0.12);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.13);
            melodyStep++;
        }, 320);
    } catch (e) { console.log("Audio Error"); }
}

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
    let isFullySolved = false;

    // Сжатая проверка на правильность решения
    if (activeItem.currentInput && activeItem.currentInput.includes('=')) {
        const parts = activeItem.currentInput.split('=');
        let simCorrect = (evaluateExpr(parts[0]) === activeItem.correctValue) && 
                         (parts[0].split('+').length === currentMultiTask.monsters);
        let finCorrect = (evaluateExpr(parts[1]) === activeItem.correctValue);
        if (simCorrect && finCorrect) isFullySolved = true;
    }

    const cacheKey = activeItem.exampleText + "_" + (isFullySolved ? "win" : "play");
    if (gameZone.getAttribute('data-current-example') === cacheKey) return;

    if (isFullySolved) startWinSoundLoop(); else stopWinSoundLoop();
    gameZone.setAttribute('data-current-example', cacheKey);

    let html = '';
    const textBox = isFullySolved ? '<b style="color:#22c55e;">Ням-ням! 😋</b>' : '🍕'.repeat(currentMultiTask.items);
    const bgBox = isFullySolved ? '#dcfce7' : '#fff7ed';
    const borderBox = isFullySolved ? '1px dashed #22c55e' : '1px dashed #fed7aa';

    for (let i = 0; i < currentMultiTask.monsters; i++) {
        html += `
            <div class="${isFullySolved ? 'monster-happy' : ''}" style="display:flex; flex-direction:column; align-items:center; background:#fff; padding:10px 15px; border:2px solid #e2e8f0; border-radius:12px; min-width:85px; box-sizing:border-box;">
                <span style="font-size:46px; margin-bottom:6px;">👾</span>
                <div style="display:flex; gap:4px; justify-content:center; flex-wrap:wrap; max-width:80px; background:${bgBox}; padding:4px 6px; border-radius:6px; border:${borderBox}; min-height:32px; align-items:center;">
                    ${textBox}
                </div>
            </div>`;
    }
    gameZone.innerHTML = html;
}
