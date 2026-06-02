import { toggleMenuMode, handleModeSelection } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Слушатель для кнопки открытия меню в хэдере
    document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);

    // 2. Делегирование кликов для кнопок выбора режима внутри нумпада
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const mode = e.target.getAttribute('data-mode');
            handleModeSelection(mode);
        });
    });

    // 3. Делегирование кликов для цифровых кнопок калькулятора
    document.querySelectorAll('.calc-btn:not(.next)').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const key = e.currentTarget.getAttribute('data-key');
            pressNum(key);
        });
    });

    // 4. Слушатель для кнопки "Следующий пример"
    document.getElementById('next-example-btn')?.addEventListener('click', confirmAndNext);
});
