// version: v1.2 - Dynamic Workspace Management for Mixed Mode
import { state } from './state.js';
import { generateExample } from './tens.js';
import { generateMultiExample } from './multiplication.js';

export function initMixMode() {
 document.querySelector('.header-menu-btn').innerText = 'Режим: Микс 🎰 ▼';
 state.mixStep = 0;
 updateWorkspaceForMix();
 generateMixExample();
}

export function generateMixExample() {
 if (state.currentMode !== 'mix') return;
 let type = state.mixStep % 3;

 if (type === 0 || type === 1) {
  generateExample();
 } else if (type === 2) {
  generateMultiExample();
 }

 document.querySelector('.header-menu-btn').innerText = 'Режим: Микс 🎰 ▼';
 state.mixStep++;
 updateWorkspaceForMix();
}

function updateWorkspaceForMix() {
 const activeItem = state.examplesHistory[state.activeIndex];
 if (!activeItem) return;
 
 const isHundreds = activeItem.exampleText.includes('+') || activeItem.exampleText.includes('-');
 const gameZone = document.getElementById('game-zone');
 if (gameZone) {
  gameZone.style.display = isHundreds ? 'none' : 'flex';
  document.querySelector('.game-workspace').style.height = isHundreds ? '100%' : '68%';
 }
}
