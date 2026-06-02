import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { resetAllFeedbacks } from './feedback.js';
import { initTensMode } from './tens.js';
import { initMultiplicationMode } from './multiplication.js';
import { initMixMode } from './mix.js';

const numpadContainer = document.getElementById('main-numpad');
const menuButton = document.querySelector('.header-menu-btn');
let isMenuOpen = false;

/**
 * Переключает отображение нумпада между калькулятором и выбором режимов
 */
export function toggleMenuMode() {
    if (!numpadContainer) return;
    isMenuOpen = !isMenuOpen;

    const calcButtons = numpadContainer.querySelectorAll('.calc-btn');
    const modeButtons = numpadContainer.querySelectorAll('.mode-btn');

    // Переключаем сетку гридов (для режимов удобнее 2 колонки, для цифр — 3)
    numpadContainer.classList.toggle('menu-mode', isMenuOpen);
    menuButton.innerText = isMenuOpen ? 'Назад к игре ▲' : getModeLabel(state.currentMode);

    // Переключаем видимость элементов
    calcButtons.forEach(btn => btn.style.display = isMenuOpen ? 'none' : 'flex');
    modeButtons.forEach(btn => btn.style.display = isMenuOpen ? 'flex' : 'none');
}

/**
 * Активирует выбранный игровой режим и возвращает нумпад в рабочий вид
 */
export function changeMode(mode) {
    if (mode === 'hundreds' || mode === 'thousands') {
        alert("Режим в разработке 🛠️");
        return;
    }

    // Сбрасываем стейт, звуки и экраны через движок
    state.reset(mode);
    resetAllFeedbacks();
    GameCanvas.clearZone();
    
    // Переключаем интерфейс обратно на цифровой нумпад
    toggleMenuMode();

    // Инициализируем выбранную фичу
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

// Привязка к window для поддержки инлайновых onclick в HTML-каркасе
window.toggleMenuMode = toggleMenuMode;
window.changeMode = changeMode;
