// version: v1.4
import { toggleMenuMode, handleModeSelection } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';
import { selectExample } from './view_dispatcher.js';

document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', (e) => handleModeSelection(e.currentTarget.getAttribute('data-mode')));
});

document.querySelectorAll('.calc-btn:not(.next)').forEach(btn => {
    btn.addEventListener('click', (e) => pressNum(e.currentTarget.getAttribute('data-key')));
});

document.getElementById('next-example-btn')?.addEventListener('click', confirmAndNext);
