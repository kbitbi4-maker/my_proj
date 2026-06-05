// version: v3.7

if (typeof window !== 'undefined') {
    import('./state.js').then(module => {
        window.gameStateRef = module.state;
    });
}

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

function escapeHTML(text) {
    if (typeof text !== 'string') {
        text = String(text);
    }
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/<\/script>/gi, '&lt;/script&gt;'); // ИСПРАВЛЕНО: Безопасно нейтрализуем закрывающие скрипты, чтобы они не ломали textarea
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
                    sources += `=== FILE_START: "${cleanPath}" ===\n${escapeHTML(t)}\n=== FILE_END: "${cleanPath}" ===\n\n`;
                } else {
                    manifest += `- PATH: "${cleanPath}" | NOT_FOUND ❌\n`;
                }
            } catch (err) {
                manifest += `- PATH: "${cleanPath}" | ERROR: ${err.message} ❌\n`;
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
                sources += `=== FILE_START: "${cleanPath}" ===\n${escapeHTML(t)}\n=== FILE_END: "${cleanPath}" ===\n\n`;
            } catch {
                const cleanPath = p.replace('./', '');
                manifest += `- PATH: "${cleanPath}" | NOT_FOUND ❌\n`;
            }
        }
    }

    return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>AI Sync Panel 🤖</title>
    <style>
        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #0f172a; }
        .sync-area { width: 100%; height: 100%; background: #1e293b; color: #cbd5e1; padding: 20px; font-family: monospace; font-size: 13px; line-height: 1.5; border: none; resize: none; box-sizing: border-box; outline: none; }
    </style>
</head>
<body>
    <textarea class="sync-area" readonly>==================================================
=== ARIFMET FULL REPOSITORY SOURCE BUNDLE (STATIC) ===
==================================================

${manifest}
${sources}</textarea>
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
