import { EditorCore } from './editor_core.js';
import { AnimationPlayer } from './animation_player.js';

document.addEventListener('DOMContentLoaded', () => {
    // Безопасная инициализация модулей
    try {
        EditorCore.init();
        AnimationPlayer.init();
    } catch (error) {
        console.error("Ошибка инициализации редактора:", error);
    }

    // Слушатели интерфейса
    document.getElementById('clearGridBtn')?.addEventListener('click', () => {
        EditorCore.clearCurrentGrid();
    });

    document.getElementById('addFrameBtn')?.addEventListener('click', () => {
        AnimationPlayer.addFrame();
    });

    document.getElementById('playBtn')?.addEventListener('click', () => {
        AnimationPlayer.togglePlay();
    });

    document.getElementById('fpsSlider')?.addEventListener('input', (e) => {
        const target = e.target;
        document.getElementById('fpsVal').innerText = target.value;
        AnimationPlayer.updateSpeed();
    });
});
