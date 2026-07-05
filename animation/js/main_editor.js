import { EditorCore } from './editor_core.js';
import { AnimationPlayer } from './animation_player.js';

document.addEventListener('DOMContentLoaded', () => {
    EditorCore.init();
    AnimationPlayer.init();

    document.getElementById('clearGridBtn')?.addEventListener('click', () => EditorCore.clearCurrentGrid());
    document.getElementById('addFrameBtn')?.addEventListener('click', () => AnimationPlayer.addFrame());
    document.getElementById('playBtn')?.addEventListener('click', () => AnimationPlayer.togglePlay());

    document.getElementById('fpsSlider')?.addEventListener('input', (e) => {
        document.getElementById('fpsVal').innerText = e.target.value;
        AnimationPlayer.updateSpeed();
    });

    // Масштабирование (Зум) холста
    document.getElementById('zoomSlider')?.addEventListener('input', (e) => {
        const zoom = e.target.value;
        document.getElementById('zoomVal').innerText = zoom + '%';
        EditorCore.setZoom(zoom);
    });

    // Изменение размерности сетки (16, 20, 35 и т.д.)
    document.getElementById('applyGridSizeBtn')?.addEventListener('click', () => {
        const newSize = parseInt(document.getElementById('gridSizeInput').value, 10);
        if (newSize >= 8 && newSize <= 64) {
            EditorCore.changeGridSize(newSize);
        }
    });

    // Применение текстового кода из консоли в пиксели кадра
    document.getElementById('applyCodeBtn')?.addEventListener('click', () => {
        AnimationPlayer.loadFrameFromCode();
    });
});
