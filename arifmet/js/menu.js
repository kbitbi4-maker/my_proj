// arifmet/js/menu.js
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { resetAllFeedbacks } from './feedback.js';
import { initTensMode } from './tens.js';
import { initMultiplicationMode } from './multiplication.js';
import { initMixMode } from './mix.js';
import { initArcherMode } from './archer_mode.js'; // ИМПОРТ НАШЕГО НОВОГО РЕЖИМА!

const numpadContainer = document.getElementById('calc-numpad-container');
const modesMenuContainer = document.getElementById('modes-menu-container');
const rightArea = document.querySelector('.right-area');
const menuButton = document.getElementById('menu-toggle-btn');
let isMenuOpen = false;

export function toggleMenuMode() {
    if (!numpadContainer || !modesMenuContainer || !rightArea) return;
    isMenuOpen = !isMenuOpen;
    rightArea.classList.toggle('menu-active', isMenuOpen);
    if (menuButton) menuButton.innerText = isMenuOpen ? 'Назад к игре ▲' : getModeLabel(state.currentMode);
    numpadContainer.style.display = isMenuOpen ? 'none' : 'grid';
    modesMenuContainer.style.display = isMenuOpen ? 'flex' : 'none';
}

export function handleModeSelection(mode) {
    if (mode === 'thousands') { alert("Режим в разработке 🛠️"); return; }

    state.reset(mode);
    resetAllFeedbacks();
    
    // Сброс старых Canvas-эффектов моста при переключении
    window.dispatchEvent(new CustomEvent('game-reset-all'));

    GameCanvas.clearZone();
    GameCanvas.clearHistory();
    toggleMenuMode();

    // Прямое и понятное распределение режимов
    if (mode === 'tens' || mode === 'hundreds' || mode === 'column') initTensMode();
    else if (mode === 'multiplication') initMultiplicationMode();
    else if (mode === 'mix') initMixMode();
    else if (mode === 'archer') initArcherMode(); // ПРЯМОЙ ВЫЗОВ НАШЕГО ТЕСТА!
}

function getModeLabel(mode) {
    if (mode === 'tens') return 'Режим: Десятки ▼';
    if (mode === 'hundreds') return 'Режим: Сотни ▼';
    if (mode === 'multiplication') return 'Режим: Умножение 🍕 ▼';
    if (mode === 'mix') return 'Режим: Микс 🎰 ▼';
    if (mode === 'column') return 'Режим: В столбик 📝 ▼';
    if (mode === 'archer') return 'Режим: Лучник 🏹 ▼';
    return 'Режим: Выбрать ▼';
}
