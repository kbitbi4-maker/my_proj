// version: v1.2
import { state } from './state.js';
import { GameCanvas } from './game_canvas.js';
import { VisualEngine } from './visual_engine.js';
import { getTensHistoryHTML } from './tens.js';
import { getMultiplicationHistoryHTML } from './multiplication.js';
import { triggerTensWinSound, triggerWinFeedback, triggerFailFeedback, resetAllFeedbacks, soundFlags } from './feedback.js';

export function selectExample(index) {
    state.activeIndex = index;
    resetAllFeedbacks();

    const ctx = state.getContext();
    if (!ctx) return;

    if (ctx.isFullySolved) {
        if (ctx.operation === '×') triggerWinFeedback(); else triggerTensWinSound();
        soundFlags.finWinSoundPlayed = soundFlags.simWinSoundPlayed = true;
    } else if (ctx.simCorrect && ctx.phase === 2) {
        triggerTensWinSound(); soundFlags.simWinSoundPlayed = true;
    } else if (ctx.isWrongAnswer) {
        triggerFailFeedback();
        if (ctx.currentInput.includes('=')) soundFlags.finFailSoundPlayed = true; else soundFlags.simFailSoundPlayed = true;
    }

    const renderer = ctx.operation === '×' ? getMultiplicationHistoryHTML : getTensHistoryHTML;
    GameCanvas.renderHistory(state.examplesHistory, state.activeIndex, state.currentMode, renderer);
    VisualEngine.render(ctx);
}
