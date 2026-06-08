// version: v2.5 - Strict DOM ID Alignment with index_arifmet.html
import { toggleMenuMode, handleModeSelection } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';
import { openProjectMap, closeProjectMap, copyProjectMap } from './project_map.js';

document.getElementById('project-map-btn')?.addEventListener('click', openProjectMap);
document.getElementById('close-map-btn')?.addEventListener('click', closeProjectMap);
document.getElementById('copy-map-btn')?.addEventListener('click', copyProjectMap);
document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);

document.querySelectorAll('.mode-btn').forEach(btn => {
 btn.addEventListener('click', (e) => handleModeSelection(e.currentTarget.getAttribute('data-mode')));
});

document.querySelectorAll('.calc-btn').forEach(btn => {
 btn.addEventListener('click', (e) => pressNum(e.currentTarget.getAttribute('data-key')));
});

document.getElementById('next-example-btn')?.addEventListener('click', confirmAndNext);
