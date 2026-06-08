// version: v1.7 - Clean String Synthesis for State Validator
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks, soundFlags } from './feedback.js';
import { generateExample, getTensHistoryHTML, renderTensVisual } from './tens.js';
import { generateMultiExample, getMultiplicationHistoryHTML, renderMonsterGame } from './multiplication.js';
import { generateMixExample } from './mix.js';

export function pressNum(n) {
 if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
 const activeItem = state.examplesHistory[state.activeIndex];
 const isHundreds = (state.currentMode === 'hundreds');

 if (n === 'C' || n === 'D') {
  if (n === 'C') activeItem.currentInput = '';
  else {
   if (isHundreds) {
    let currentAns = activeItem.currentInput.includes('=') ? activeItem.currentInput.split('=')[1] : '';
    activeItem.currentInput = activeItem.exampleText + '=' + currentAns.slice(0, -1);
   } else {
    activeItem.currentInput = activeItem.currentInput.slice(0, -1);
   }
  }
  resetAllFeedbacks();
 } else {
  if (isHundreds) {
   let currentAns = activeItem.currentInput.includes('=') ? activeItem.currentInput.split('=')[1] : '';
   if (n !== '=') currentAns += n;
   activeItem.currentInput = activeItem.exampleText + '=' + currentAns;
  } else {
   const totalEquals = (activeItem.currentInput.match(/=/g) || []).length;
   if (n === '=' && totalEquals >= 2) return;
   activeItem.currentInput += n;
  }
 }
 const report = state.validateCurrentInput();
 handleInputSounds(report, activeItem.exampleText);
 refreshUI();
}

export function confirmAndNext() {
 resetAllFeedbacks();
 if (state.currentMode === 'tens' || state.currentMode === 'hundreds') generateExample();
 else if (state.currentMode === 'multiplication') generateMultiExample();
 else if (state.currentMode === 'mix') generateMixExample();
}

function handleInputSounds(report, exampleText) {
 const isMulti = exampleText.includes('×');
 if (report.isFullySolved) {
  if (!soundFlags.finWinSoundPlayed) {
   if (isMulti) triggerWinFeedback(); else triggerTensWinSound();
   soundFlags.finWinSoundPlayed = true; soundFlags.simWinSoundPlayed = true;
  }
 } else if (report.isWrongAnswer) {
  if (!soundFlags.finFailSoundPlayed) { triggerFailFeedback(); soundFlags.finFailSoundPlayed = true; }
 }
}

export function refreshUI() {
 if (state.activeIndex === -1) return;
 const item = state.examplesHistory[state.activeIndex];
 const isMulti = item.exampleText.includes('×');
 const renderer = isMulti ? getMultiplicationHistoryHTML : getTensHistoryHTML;
 GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, renderer);
 if (state.currentMode === 'multiplication' || (state.currentMode === 'mix' && isMulti)) renderMonsterGame();
 else renderTensVisual();
}
