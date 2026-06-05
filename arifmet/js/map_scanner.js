// version: v2.0
const FILE_PATHS = [
    'index_arifmet.html', 'style_arifmet.css', 'js/main.js', 'js/state.js',
    'js/calculator.js', 'js/feedback.js', 'js/game_canvas.js', 'js/view_dispatcher.js',
    'js/menu.js', 'js/numpad.js', 'js/tens.js', 'js/mix.js', 'js/multiplication.js',
    'js/addition_visual.js', 'js/subtraction_visual.js', 'js/addition_hundreds_visual.js', 
    'js/subtraction_hundreds_visual.js', 'js/project_map.js', 'js/map_scanner.js', 'ai_sync.html'
];

export async function generateDynamicMap() {
    let report = `=== DYNAMIC PROJECT ARIFMET MAP ===\nGEN_DATE: ${new Date().toISOString()}\n\n📁 arifmet/\n`;
    for (const path of FILE_PATHS) {
        try {
            const res = await fetch(path); if (!res.ok) throw new Error();
            const text = await res.text();
            const lines = text.split('\n').length; const bytes = new Blob([text]).size;
            const m = text.match(/(?:\/\/|\/\*|<!--)\s*version:\s*([^\s\*\/]+)/i);
            const ver = m ? m[0].replace(/-->/g, '').trim() : 'unknown';
            report += `├── [FILE]: ${path} [VER: ${ver}] (${lines} lines, ${bytes} B)\n`;
        } catch { report += `├── [FILE]: ${path} [NOT_FOUND ❌]\n`; }
    }
    return report;
}
