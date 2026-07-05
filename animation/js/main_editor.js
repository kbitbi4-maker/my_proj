import { EditorCore } from './editor_core.js';
import { AnimationPlayer } from './animation_player.js';
import { ImageScanner } from './image_scanner.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        EditorCore.init();
        AnimationPlayer.init();
    } catch (error) {
        console.error("Ошибка запуска модулей:", error);
    }

    document.getElementById('clearGridBtn')?.addEventListener('click', () => EditorCore.clearCurrentGrid());
    document.getElementById('addFrameBtn')?.addEventListener('click', () => AnimationPlayer.addFrame());
    document.getElementById('playBtn')?.addEventListener('click', () => AnimationPlayer.togglePlay());

    const fileInput = document.getElementById('imageImporter');
    document.getElementById('uploadTriggerBtn')?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => ImageScanner.scan(e));

    document.getElementById('fpsSlider')?.addEventListener('input', (e) => {
        document.getElementById('fpsVal').innerText = e.target.value;
        AnimationPlayer.updateSpeed();
    });

    document.getElementById('zoomSlider')?.addEventListener('input', (e) => {
        const zoom = e.target.value;
        document.getElementById('zoomVal').innerText = zoom + '%';
        EditorCore.setZoom(zoom);
    });

    // Считывание независимых параметров ширины и высоты
    document.getElementById('applyGridSizeBtn')?.addEventListener('click', () => {
        const newW = parseInt(document.getElementById('gridWidthInput').value, 10);
        const newH = parseInt(document.getElementById('gridHeightInput').value, 10);
        if (newW >= 8 && newW <= 64 && newH >= 8 && newH <= 64) {
            EditorCore.changeGridSize(newW, newH);
        }
    });

    document.getElementById('applyCodeBtn')?.addEventListener('click', () => {
        AnimationPlayer.loadFrameFromCode();
    });
});
