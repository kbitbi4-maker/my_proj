// version: v2.3 - Strict HTML Selector Alignment Test Passed
import { toggleMenuMode, handleModeSelection } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';
import { openProjectMap, closeProjectMap, copyProjectMap, downloadProjectMapPDF } from './project_map.js';

// Привязка событий строго по оригинальным классам и ID вашего HTML
document.querySelector('.header-map-btn')?.addEventListener('click', openProjectMap);
document.querySelector('.modal-close-btn')?.addEventListener('click', closeProjectMap);
document.getElementById('copy-map-btn')?.addEventListener('click', copyProjectMap);
document.getElementById('download-pdf-btn')?.addEventListener('click', downloadProjectMapPDF);
document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);

document.querySelectorAll('.mode-btn').forEach(btn => {
 btn.addEventListener('click', (e) => handleModeSelection(e.currentTarget.getAttribute('data-mode')));
});

document.querySelectorAll('.numpad-btn').forEach(btn => {
 btn.addEventListener('click', (e) => pressNum(e.currentTarget.getAttribute('data-key') || e.currentTarget.innerText));
});

document.querySelector('.next-btn')?.addEventListener('click', confirmAndNext);
