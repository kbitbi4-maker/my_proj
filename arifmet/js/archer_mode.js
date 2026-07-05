// arifmet/js/archer_mode.js
import { GameCanvas } from './game_canvas.js';

export function initArcherMode() {
    // 1. Меняем заголовок в шапке игры
    document.querySelector('.header-menu-btn').innerText = 'Режим: Лучник 🏹 ▼';
    
    // 2. Полностью очищаем левую панель истории примеров, так как это чистый графический тест
    GameCanvas.clearHistory();
    const historyPlaceholder = document.getElementById('history-placeholder');
    if (historyPlaceholder) {
        historyPlaceholder.innerHTML = `<div style="color: #a78bfa; text-align: center; margin-top: 20px; font-weight: bold;">Тестирование анимации Гранд-Эльфа 🏹</div>`;
    }

    // 3. Очищаем нижнюю зону и сажаем туда прямоугольный Canvas для анимации
    GameCanvas.clearZone();
    const cacheKey = "archer_standalone_live_test";
    const archerCanvasHTML = `
        <div style="display:flex; justify-content:center; align-items:center; width:100%; height:100%;">
            <canvas id="bridgeCanvas" style="width:120px; height:120px; background:transparent;"></canvas>
        </div>`;
        
    GameCanvas.renderZoneScene(archerCanvasHTML, cacheKey);
}

