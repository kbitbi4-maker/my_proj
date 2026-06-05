// version: v3.1
import { state } from './state.js';

export function openProjectMap() {
    const modal = document.getElementById('map-modal');
    const area = document.getElementById('map-text-area');
    if (!modal || !area) return;

    modal.style.display = 'flex';
    area.value = '⏳ Сборка монолита проекта... Пожалуйста, подождите.';
    generateFullStaticHTMLBundle().then(htmlBundle => {
        area.value = htmlBundle;
    });
}

export function closeProjectMap() {
    const modal = document.getElementById('map-modal');
    if (modal) modal.style.display = 'none';
}

export function copyProjectMap() {
    const area = document.getElementById('map-text-area');
    if (!area) return;
    area.select(); navigator.clipboard.writeText(area.value);
    alert('Готовый статический HTML-код для ai_sync.html скопирован! 📋');
}

async function generateFullStaticHTMLBundle() {
    const files = [
        './index_arifmet.html', './style_arifmet.css', './js/main.js', './js/state.js',
        './js/calculator.js', './js/feedback.js', './js/game_canvas.js', './js/view_dispatcher.js',
        './js/menu.js', './js/numpad.js', './js/tens.js', './js/mix.js', './js/multiplication.js',
        './js/addition_visual.js', './js/subtraction_visual.js', './js/project_map.js',
        './js/addition_hundreds_visual.js', './js/subtraction_hundreds_visual.js'
    ];
    
    let manifest = `[AI RECONSTRUCTION MANIFEST]\n`;
    let sources = ``;
    const tStamp = Date.now();

    if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
        const fs = await import('fs');
        const path = await import('path');

        for (const p of files) {
            const cleanPath = p.replace('./', '');
            try {
                const fullPath = path.resolve(cleanPath);
                if (fs.existsSync(fullPath)) {
                    const t = fs.readFileSync(fullPath, 'utf-8');
                    manifest += `- PATH: "${cleanPath}" | SIZE: ${t.length} chars\n`;
                    sources += `=== FILE_START: "${cleanPath}" ===\n${t}\n=== FILE_END: "${cleanPath}" ===\n\n`;
                } else {
                    manifest += `- PATH: "${cleanPath}" | NOT_FOUND ❌\n`;
                }
            } catch {
                manifest += `- PATH: "${cleanPath}" | ERROR ❌\n`;
            }
        }
    } 
    else {
        for (const p of files) {
            try {
                const r = await fetch(`${p}?cb=${tStamp}`, { cache: "no-store" }); if (!r.ok) continue;
                const t = await r.text();
                const cleanPath = p.replace('./', '');
                manifest += `- PATH: "${cleanPath}" | SIZE: ${t.length} chars\n`;
                sources += `=== FILE_START: "${cleanPath}" ===\n${t}\n=== FILE_END: "${cleanPath}" ===\n\n`;
            } catch {
                const cleanPath = p.replace('./', '');
                manifest += `- PATH: "${cleanPath}" | NOT_FOUND ❌\n`;
            }
        }
    }

    return `<!-- ВЕРСИЯ: СТАТИЧЕСКИЙ МОНОЛИТ -->
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>AI Sync Panel 🤖 (Static)</title>
    <style>
        body { margin: 0; padding: 20px; background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 13px; line-height: 1.5; }
        pre { white-space: pre-wrap; word-break: break-all; background: #1e293b; padding: 15px; border-radius: 8px; border: 1px solid #334155; color: #cbd5e1; }
    </style>
</head>
<body>
    <div style="color: #22c55e; margin-bottom: 20px; font-weight: bold;">✅ Статическая сборка завершена! Страница мгновенно готова для чтения ИИ.</div>
    <pre>
==================================================
=== ARIFMET FULL REPOSITORY SOURCE BUNDLE (STATIC) ===
==================================================

${manifest}
${sources}
    </pre>
</body>
</html>`;
}

if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
    generateFullStaticHTMLBundle().then(htmlBundle => {
        import('fs').then(fs => {
            fs.writeFileSync('ai_sync.html', htmlBundle, 'utf-8');
            console.log('✅ [GitHub Actions] ai_sync.html успешно обновлен серверным скриптом!');
        });
    });
}
