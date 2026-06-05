// version: v1.6
import { state } from './state.js';

export function openProjectMap() {
    const modal = document.getElementById('map-modal');
    const area = document.getElementById('map-text-area');
    if (!modal || !area) return;

    modal.style.display = 'flex';
    area.value = generateStaticMapText();
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
    alert('Карта проекта скопирована в буфер обмена! 📋');
}

function generateStaticMapText() {
    // Список строго синхронизирован с вашим текущим Snapshot
    const files = [
        'index_arifmet.html', 'style_arifmet.css', 'js/main.js', 'js/state.js',
        'js/calculator.js', 'js/feedback.js', 'js/game_canvas.js', 'js/view_dispatcher.js',
        'js/menu.js', 'js/numpad.js', 'js/tens.js', 'js/mix.js', 'js/multiplication.js',
        'js/addition_visual.js', 'js/subtraction_visual.js', 'js/project_map.js',
        'js/addition_hundreds_visual.js', 'js/subtraction_hundreds_visual.js', 'ai_sync.html'
    ];

    let text = `==================================================\n`;
    text += `=== SNAPSHOT: PROJECT ARIFMET MAP ===\n`;
    text += `=== DATE_GEN: ${new Date().toISOString()} ===\n`;
    text += `=== CURRENT_MODE: ${state.currentMode || 'none'} ===\n`;
    text += `==================================================\n\n📁 arifmet/\n`;

    files.forEach(f => {
        text += `├── [FILE]: ${f}\n`;
    });

    text += `\n=== END OF MAP ===`;
    return text;
}
