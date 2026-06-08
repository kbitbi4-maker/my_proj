// version: ORIGINAL - Extracted From Project Map Context
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks, soundFlags } from './feedback.js';
import { generateExample, getTensHistoryHTML, renderTensVisual } from './tens.js';
import { generateMultiExample, getMultiplicationHistoryHTML, renderMonsterGame } from './multiplication.js';
import { generateMixExample } from './mix.js';

export function pressNum(n) {
 if (state.activeIndex === -1 || !state.examplesHistory[state.activeIndex]) return;
 const activeItem = state.examplesHistory[state.activeIndex];
 if (n === 'C' || n === 'D') {
  if (n === 'C') activeItem.currentInput = '';
  else activeItem.currentInput = activeItem.currentInput.slice(0, -1);
  resetAllFeedbacks();
 } else {
  const totalEquals = (activeItem.currentInput.match(/=/g) || []).length;
  if (n === '=' && totalEquals >= 2) return;
  activeItem.currentInput += n;
 }
 const report = state.validateCurrentInput();
 handleInputSounds(report, activeItem.exampleText);
 refreshUI();
}

export function confirmAndNext() {
 resetAllFeedbacks();
 if (state.currentMode === 'tens') generateExample();
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
 } else if (report.simCorrect && report.phase === 2 && !soundFlags.simWinSoundPlayed) {
  triggerTensWinSound(); soundFlags.simWinSoundPlayed = true;
 } else if (report.isWrongAnswer) {
  const parts = state.examplesHistory[state.activeIndex].currentInput.split('=');
  const hasFin = parts.length > 1 && parts[1].trim().length > 0;
  if (hasFin && !soundFlags.finFailSoundPlayed) { triggerFailFeedback(); soundFlags.finFailSoundPlayed = true; }
  else if (!hasFin && !soundFlags.simFailSoundPlayed) { triggerFailFeedback(); soundFlags.simFailSoundPlayed = true; }
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
