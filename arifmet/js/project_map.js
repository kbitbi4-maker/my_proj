import { state } from './state.js';

const projectStructure = [
    'index_arifmet.html', 'style_arifmet.css', 'js/main.js', 'js/state.js', 
    'js/calculator.js', 'js/feedback.js', 'js/game_canvas.js', 'js/view_dispatcher.js', 
    'js/menu.js', 'js/numpad.js', 'js/tens.js', 'js/mix.js', 
    'js/multiplication.js', 'js/addition_visual.js', 'js/subtraction_visual.js'
];

export async function openProjectMap() {
    const modal = document.getElementById('map-modal'), area = document.getElementById('map-text-area');
    if (!modal || !area) return;

    let textOutput = `=== SNAPSHOT: PROJECT ARIFMET MAP ===\n`;
    textOutput += `DATE_GEN: ${new Date().toISOString()}\n`;
    textOutput += `CURRENT_MODE: ${state.currentMode || 'none'}\n`;
    textOutput += `HISTORY_COUNT: ${state.examplesHistory.length}\n\n`;

    for (const path of projectStructure) {
        let linesCount = 'N/A', hash = 'N/A', version = 'v1.0';
        try {
            const response = await fetch(path);
            if (response.ok) {
                const text = await response.text();
                linesCount = text.split('\n').length;
                hash = text.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a; }, 0);
                
                // Извлекаем версию из первой строчки файла (из комментария)
                const firstLine = text.split('\n')[0] || '';
                const match = firstLine.match(/v\d+\.\d+/);
                if (match) version = match[0];
            }
        } catch (e) { linesCount = 'FETCH_ERR'; }

        textOutput += `[FILE]: ${path}\n`;
        textOutput += `  VERSION: ${version}\n`;
        textOutput += `  METRICS: LINES=${linesCount} | HASH_ID=${hash}\n`;
        textOutput += `--------------------------------------------------\n`;
    }

    area.value = textOutput; modal.style.display = 'flex';
}

export function closeProjectMap() { document.getElementById('map-modal').style.display = 'none'; }
export function copyProjectMap() {
    const area = document.getElementById('map-text-area'); if (!area) return;
    area.select(); document.execCommand('copy'); alert('Карта проекта скопирована! 📋');
}

