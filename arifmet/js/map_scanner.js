// version: v1.4
const FILE_PATHS = [
    'index_arifmet.html', 'style_arifmet.css', 'js/main.js', 'js/state.js',
    'js/calculator.js', 'js/feedback.js', 'js/game_canvas.js', 'js/view_dispatcher.js',
    'js/menu.js', 'js/numpad.js', 'js/tens.js', 'js/mix.js', 'js/multiplication.js',
    'js/visual_engine.js', 'js/project_map.js', 'js/rules/rules_utils.js',
    'js/rules/rules_addition.js', 'js/rules/rules_sub_utils.js',
    'js/rules/rules_subtraction.js', 'js/rules/rules_multiplication.js',
    'js/rules/rules_style.css' // ДОБАВИЛИ НОВЫЙ CSS СЮДА
];

export async function generateDynamicMap() {
    let report = `=== DYNAMIC PROJECT ARIFMET MAP ===\nGEN_DATE: ${new Date().toISOString()}\n\n`;
    const filesData = {};

    for (const path of FILE_PATHS) {
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error();
            const text = await res.text();
            
            const lines = text.split('\n').length;
            const bytes = new Blob([text]).size;
            const verMatch = text.match(/(?:\/\/|\/\*|<!--)\s*version:\s*([^\s\*\/]+)/i);
            const rawVer = verMatch ? verMatch[1] : 'unknown';
            const version = rawVer.replace(/-->/g, '').trim();

            filesData[path] = { version, lines, bytes };
        } catch {
            filesData[path] = { version: 'NOT_FOUND ❌', lines: 0, bytes: 0 };
        }
    }

    report += `📁 arifmet/\n`;
    report += `├── 📄 index_arifmet.html [VER: ${filesData['index_arifmet.html'].version}] (${filesData['index_arifmet.html'].lines} lines, ${filesData['index_arifmet.html'].bytes} B)\n`;
    report += `├── 🎨 style_arifmet.css [VER: ${filesData['style_arifmet.css'].version}] (${filesData['style_arifmet.css'].lines} lines, ${filesData['style_arifmet.css'].bytes} B)\n`;
    report += `└── 📁 js/\n`;

    const jsRootFiles = ['main.js', 'state.js', 'calculator.js', 'feedback.js', 'game_canvas.js', 'view_dispatcher.js', 'menu.js', 'numpad.js', 'tens.js', 'mix.js', 'multiplication.js', 'visual_engine.js', 'project_map.js'];
    jsRootFiles.forEach((file, idx) => {
        const p = `js/${file}`; const isLast = idx === jsRootFiles.length - 1;
        report += `    ${isLast ? '└──' : '├──'} 📄 ${file} [VER: ${filesData[p].version}] (${filesData[p].lines} lines, ${filesData[p].bytes} B)\n`;
    });

    report += `    └── 📁 rules/\n`;
    const rulesFiles = ['rules_utils.js', 'rules_addition.js', 'rules_sub_utils.js', 'rules_subtraction.js', 'rules_multiplication.js', 'rules_style.css'];
    rulesFiles.forEach((file, idx) => {
        const p = `js/rules/${file}`; const isLast = idx === rulesFiles.length - 1;
        report += `        ${isLast ? '└──' : '├──'} 📄 ${file} [VER: ${filesData[p].version}] (${filesData[p].lines} lines, ${filesData[p].bytes} B)\n`;
    });

    return report;
}
