// version: v3.8

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
    generateFullStaticTextBundle().then(textBundle => {
        area.value = textBundle;
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
    alert('Готовый статический текст для ИИ скопирован! 📋');
}

async function generateFullStaticTextBundle() {
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
                sources += `=== FILE_START: "${cleanPath}" ===\n${t}\n=== FILE_END: "${cleanPath}" ===\n\n`;
            } catch {
                const cleanPath = p.replace('./', '');
                manifest += `- PATH: "${cleanPath}" | NOT_FOUND ❌\n`;
            }
        }
    }

    return `==================================================
=== ARIFMET FULL REPOSITORY SOURCE BUNDLE (RAW TEXT) ===
==================================================

${manifest}
${sources}`;
}

if (typeof process !== 'undefined' && process.release && process.release.name === 'node') {
    generateFullStaticTextBundle().then(textBundle => {
        import('fs').then(fs => {
            fs.writeFileSync('ai_sync.txt', textBundle, 'utf-8');
            console.log('✅ [GitHub Actions] ai_sync.txt успешно обновлен серверным скриптом!');
        });
    });
}
