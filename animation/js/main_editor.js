import { EditorCore } from './editor_core.js';
import { AnimationPlayer } from './animation_player.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализируем ядро рисования
    EditorCore.init();

    // 2. Инициализируем плеер кадров
    AnimationPlayer.init();

    // 3. Вешаем базовые слушатели на кнопки
    document.getElementById('clearGridBtn').addEventListener('click', () => {
        EditorCore.clearCurrentGrid();
    });

    document.getElementById('addFrameBtn').addEventListener('click', () => {
        AnimationPlayer.addFrame();
    });

    document.getElementById('playBtn').addEventListener('click', () => {
        AnimationPlayer.togglePlay();
    });

    document.getElementById('fpsSlider').addEventListener('input', (e) => {
        document.getElementById('fpsVal').innerText = e.target.value;
        AnimationPlayer.updateSpeed();
    });
});

