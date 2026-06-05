// version: v2.0
import { state } from './state.js';

export function openProjectMap() {
    const modal = document.getElementById('map-modal');
    const area = document.getElementById('map-text-area');
    if (!modal || !area) return;

    // Генерируем актуальный текстовый слепок структуры для ИИ
    area.value = `=== SNAPSHOT: PROJECT ARIFMET MAP ===
DATE_GEN: ${new Date().toISOString()}
CURRENT_MODE: ${state.currentMode || 'none'}
HISTORY_COUNT: ${state.examplesHistory.length}

[FILE]: index_arifmet.html (v1.1)
[FILE]: style_arifmet.css (v1.5)
[FILE]: js/main.js (v1.1)
[FILE]: js/state.js (v1.2)
[FILE]: js/calculator.js (v1.5)
[FILE]: js/feedback.js (v1.1)
[FILE]: js/game_canvas.js (v1.1)
[FILE]: js/view_dispatcher.js (v1.1)
[FILE]: js/menu.js (v1.2)
[FILE]: js/numpad.js (v1.2)
[FILE]: js/tens.js (v1.4)
[FILE]: js/mix.js (v1.1)
[FILE]: js/multiplication.js (v1.1)
[FILE]: js/visual_engine.js (v1.3)
[FILE]: js/rules/rules_utils.js (v1.0)
[FILE]: js/rules/rules_addition.js (v1.1)
[FILE]: js/rules/rules_sub_utils.js (v1.0)
[FILE]: js/rules/rules_subtraction.js (v1.0)
[FILE]: js/rules/rules_multiplication.js (v1.0)`;

    modal.style.display = 'flex';
}

export function closeProjectMap() {
    const modal = document.getElementById('map-modal');
    if (modal) modal.style.display = 'none';
}

export function copyProjectMap() {
    const area = document.getElementById('map-text-area');
    if (!area) return;
    area.select();
    navigator.clipboard.writeText(area.value);
    alert('Карта проекта успешно скопирована в буфер обмена! 📋');
}
