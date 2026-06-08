// version: v2.2 - Restore renderTensVisual Execution and Validation Hooks
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { triggerTensWinSound, resetAllFeedbacks, soundFlags } from './feedback.js';
import { generateExample, getTensHistoryHTML, renderTensVisual } from './tens.js';

export function pressNum(n) {
 if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
 const activeItem = state.examplesHistory[state.activeIndex];
 const isHundreds = (state.currentMode === 'hundreds');

 if (n === 'C' || n === 'D') {
  if (n === 'C') activeItem.currentInput = '';
  else activeItem.currentInput = activeItem.currentInput.slice(0, -1);
  resetAllFeedbacks();
 } else {
  if (n !== '=') {
   activeItem.currentInput += n;
  }
 }

 const validationStr = isHundreds ? `${activeItem.exampleText}=${activeItem.currentInput}` : activeItem.currentInput;
 const report = state.validateCurrentInput(validationStr);
 
 if (report.isFullySolved && !soundFlags.finWinSoundPlayed) {
  triggerTensWinSound();
  soundFlags.finWinSoundPlayed = true;
 }
 refreshUI();
}

export function confirmAndNext() {
 resetAllFeedbacks();
 generateExample();
}

export function refreshUI() {
 if (state.activeIndex === -1) return;
 GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, getTensHistoryHTML);
 renderTensVisual();
}
