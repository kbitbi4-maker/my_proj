// version: v2.2
const FILE_PATHS = [
    './index_arifmet.html', './style_arifmet.css', './js/main.js', './js/state.js',
    './js/calculator.js', './js/feedback.js', './js/game_canvas.js', './js/view_dispatcher.js',
    './js/menu.js', './js/numpad.js', './js/tens.js', './js/mix.js', './js/multiplication.js',
    './js/addition_visual.js', './js/subtraction_visual.js', './js/project_map.js',
    './js/addition_hundreds_visual.js', './js/subtraction_hundreds_visual.js', './ai_sync.html'
];

export async function generateDynamicMap() {
    let report = `==================================================\n`;
    report += `=== LIVE AUTOMATIC PROJECT ARIFMET MAP ===\n`;
    report += `=== GENERATED: ${new Date().toISOString()} ===\n`;
    report += `==================================================\n\n📁 arifmet/\n`;
    
    const tStamp = Date.now();
    for (const path of FILE_PATHS) {
        try {
            const res = await fetch(`${path}?cb=${tStamp}`, { cache: "no-store" }); if (!res.ok) throw new Error();
            const text = await res.text();
            const lines = text.split('\n').length;
            const bytes = new Blob([text]).size;
            const m = text.match(/(?:\/\/|\/\*|<!--)\s*version:\s*([^\s\*\/]+)/i);
            const ver = m ? m.replace(/-->/g, '').trim() : 'unknown';
            // Убираем префикс "./" из вывода в карту для красоты текста
            const cleanPath = path.replace('./', '');
            report += `├── [FILE]: ${cleanPath} [VER: ${ver}] (${lines} lines, ${bytes} B)\n`;
        } catch {
            const cleanPath = path.replace('./', '');
            report += `├── [FILE]: ${cleanPath} [NOT_FOUND ❌]\n`;
        }
    }
    report += `\n=== END OF LIVE MAP ===`;
    return report;
}
