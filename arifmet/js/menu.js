// version: v1.1 - Original Menu with Isolated Hundreds Integration
import { state } from './state.js';
import { initTensMode } from './tens.js';
import { initMultiplicationMode } from './multiplication.js';
import { initMixMode } from './mix.js';
import { initHundredsColumnMode } from './column_helper.js';

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
  if (mode === 'hundreds') {
   state.currentMode = 'hundreds';
   initHundredsColumnMode();
   return;
  }
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
