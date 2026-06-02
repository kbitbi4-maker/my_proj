import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { resetAllFeedbacks } from './feedback.js';
import { initTensMode, renderTensVisual } from './tens.js';
import { initMultiplicationMode, renderMonsterGame } from './multiplication.js';
import { initMixMode } from './mix.js';

const numpadContainer = document.getElementById('main-numpad');
const menuButton = document.getElementById('menu-toggle-btn');
let isMenuOpen = false;

export function toggleMenuMode() {
    if (!numpadContainer) return;
    isMenuOpen = !isMenuOpen;

    const calcButtons = numpadContainer.querySelectorAll('.calc-btn');
    const modeButtons = numpadContainer.querySelectorAll('.mode-btn');

    numpadContainer.classList.toggle('menu-mode', isMenuOpen);
    if (menuButton) menuButton.innerText = isMenuOpen ? 'Назад к игре ▲' : getModeLabel(state.currentMode);

    calcButtons.forEach(btn => btn.style.display = isMenuOpen ? 'none' : 'flex');
    modeButtons.forEach(btn => btn.style.display = isMenuOpen ? 'flex' : 'none');
}

export function handleModeSelection(mode) {
    if (mode === 'hundreds' || mode === 'thousands') {
        alert("Режим в разработке 🛠️");
        return;
    }

    state.reset(mode);
    resetAllFeedbacks();
    GameCanvas.clearZone();
    toggleMenuMode();

    if (mode === 'tens') initTensMode();
    else if (mode === 'multiplication') initMultiplicationMode();
    else if (mode === 'mix') initMixMode();
}

function getModeLabel(mode) {
    if (mode === 'tens') return 'Режим: Десятки ▼';
    if (mode === 'multiplication') return 'Режим: Умножение 🍕 ▼';
    if (mode === 'mix') return 'Режим: Микс 🎰 ▼';
    return 'Режим: Выбрать ▼';
}
