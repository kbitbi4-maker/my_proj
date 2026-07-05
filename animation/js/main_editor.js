import { EditorCore } from './editor_core.js';
import { AnimationPlayer } from './animation_player.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        EditorCore.init();
        AnimationPlayer.init();
    } catch (error) {
        console.error("Ошибка инициализации редактора:", error);
    }

    document.getElementById('clearGridBtn')?.addEventListener('click', () => EditorCore.clearCurrentGrid());
    document.getElementById('addFrameBtn')?.addEventListener('click', () => AnimationPlayer.addFrame());
    document.getElementById('playBtn')?.addEventListener('click', () => AnimationPlayer.togglePlay());

    // Новая кнопка заливки синего фона космоса
    document.getElementById('fillSpaceBtn')?.addEventListener('click', () => {
        EditorCore.fillWholeCanvas('#000080');
    });

    document.getElementById('fpsSlider')?.addEventListener('input', (e) => {
        document.getElementById('fpsVal').innerText = e.target.value;
        AnimationPlayer.updateSpeed();
    });

    document.getElementById('zoomSlider')?.addEventListener('input', (e) => {
        const zoom = e.target.value;
        document.getElementById('zoomVal').innerText = zoom + '%';
        EditorCore.setZoom(zoom);
    });

    document.getElementById('applyGridSizeBtn')?.addEventListener('click', () => {
        const newSize = parseInt(document.getElementById('gridSizeInput').value, 10);
        if (newSize >= 8 && newSize <= 64) {
            EditorCore.changeGridSize(newSize);
        }
    });

    document.getElementById('applyCodeBtn')?.addEventListener('click', () => {
        AnimationPlayer.loadFrameFromCode();
    });
});
