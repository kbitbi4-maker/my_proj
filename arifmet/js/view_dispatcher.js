import { state } from './state.js';
import { renderMonsterGame, syncMonsterGame } from './multiplication.js';
import { renderTensVisual } from './tens.js';

export function selectExample(index) {
    state.activeIndex = index;
    
    if (state.currentMode === 'multiplication') {
        syncMonsterGame();
    } else if (state.currentMode === 'tens' || state.currentMode === 'mix') {
        renderTensVisual();
    }
}

