// version: v1.5 - Fully Original Main Thread Event Handlers
import { state } from './state.js';
import { toggleMenuMode, handleModeSelection } from './menu.js';
import { pressNum, confirmAndNext } from './numpad.js';
import { openProjectMap, closeProjectMap, copyProjectMap, downloadProjectMapPDF } from './project_map.js';
import { initHundredsColumnMode } from './column_helper.js';

document.getElementById('project-map-btn')?.addEventListener('click', openProjectMap);
document.getElementById('close-map-btn')?.addEventListener('click', closeProjectMap);
document.getElementById('copy-map-btn')?.addEventListener('click', copyProjectMap);
document.getElementById('download-pdf-btn')?.addEventListener('click', downloadProjectMapPDF);
document.getElementById('menu-toggle-btn')?.addEventListener('click', toggleMenuMode);

document.querySelectorAll('.mode-btn').forEach(btn => {
 btn.addEventListener('click', (e) => handleModeSelection(e.currentTarget.getAttribute('data-mode')));
});

document.querySelectorAll('.calc-btn:not(.next)').forEach(btn => {
 btn.addEventListener('click', (e) => pressNum(e.currentTarget.getAttribute('data-key')));
});

document.getElementById('next-example-btn')?.addEventListener('click', () => {
 if (state.currentMode === 'hundreds') {
  initHundredsColumnMode();
  return;
 }
 confirmAndNext();
});
