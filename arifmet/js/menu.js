// version: ORIGINAL - Restored From PDF Context
import { state } from './state.js';
import { initTensMode } from './tens.js';
import { initMultiplicationMode } from './multiplication.js';
import { initMixMode } from './mix.js';

export function toggleMenuMode() {
 const container = document.querySelector('.header-menu-container');
 if (container) {
  container.classList.toggle('active');
 }
}

export function handleModeSelection(mode) {
 const container = document.querySelector('.header-menu-container');
 if (container) {
  container.classList.remove('active');
 }
 state.clearHistory();
 if (mode === 'tens' || mode === 'hundreds') {
  state.currentMode = 'tens';
  initTensMode();
 } else if (mode === 'multiplication') {
  state.currentMode = 'multiplication';
  initMultiplicationMode();
 } else if (mode === 'mix') {
  state.currentMode = 'mix';
  initMixMode();
 }
}
