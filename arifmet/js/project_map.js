// version: v4.1
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

/**
 * Открывает чистое окно печати браузера, содержащее весь исходный код.
 * Позволяет пользователю сохранить весь проект в полноценный PDF-файл с поддержкой кириллицы.
 */
export function downloadProjectMapPDF() {
    const area = document.getElementById('map-text-area');
    if (!area || !area.value || area.value.startsWith('⏳')) {
        alert('Пожалуйста, подождите полной сборки проекта!');
        return;
    }

    // Создаем новое временное окно для чистой печати без интерфейса игры
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Блокировщик всплывающих окон помешал открыть печать. Пожалуйста, разрешите всплывающие окна для этого сайта.');
        return;
    }

    const dateStr = new Date().toISOString().slice(0, 10);
    const escapedCode = area.value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // Формируем красивую HTML-страницу для распечатки/сохранения в PDF
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>arifmet_repository_${dateStr}</title>
            <style>
                body { margin: 20px; font-family: 'Courier New', Courier, monospace; font-size: 12px; background: #fff; color: #000; }
                pre { white-space: pre-wrap; word-wrap: break-word; line-height: 1.4; }
                @media print {
                    body { margin: 0; padding: 10mm; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="no-print" style="background:#f1f5f9; padding:12px; margin-bottom:20px; border-radius:6px; border:1px solid #cbd5e1; font-family:sans-serif;">
                <h3 style="margin:0 0 6px 0;">🖨️ Сохранение репозитория в PDF</h3>
                <p style="margin:0 0 10px 0; font-size:13px; color:#475569;">В открывшемся окне печати выберите в графе "Принтер" пункт <b>"Сохранить как PDF"</b>.</p>
                <button onclick="window.print();" style="background:#22c55e; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer;">Открыть печать повторно</button>
                <button onclick="window.close();" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; font-weight:bold; cursor:pointer; margin-left:6px;">Закрыть страницу</button>
            </div>
            <pre>${escapedCode}</pre>
            <script>
                // Автоматически запускаем диалог сохранения в PDF сразу после загрузки страницы
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 300);
                };
            <\/script>
        </body>
        </html>
    `);
    printWindow.document.close();
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

    return `==================================================
=== ARIFMET FULL REPOSITORY SOURCE BUNDLE (STATIC) ===
==================================================

${manifest}
${sources}`;
}

export async function generateDynamicMap() {
    const files = [
        './index_arifmet.html', './style_arifmet.css', './js/main.js', './js/state.js',
        './js/calculator.js', './js/feedback.js', './js/game_canvas.js', './js/view_dispatcher.js',
        './js/menu.js', './js/numpad.js', './js/tens.js', './js/mix.js', './js/multiplication.js',
        './js/addition_visual.js', './js/subtraction_visual.js', './js/project_map.js',
        './js/addition_hundreds_visual.js', './js/subtraction_hundreds_visual.js'
    ];

    let report = `==================================================\n`;
    report += `=== LIVE AUTOMATIC PROJECT ARIFMET MAP ===\n`;
    report += `=== GENERATED: ${new Date().toISOString()} ===\n`;
    report += `==================================================\n\n📁 arifmet/\n`;
    
    const tStamp = Date.now();
    // ИСПРАВЛЕНО: Заменен ошибочный массив FILE_PATHS на верный files
    for (const path of files) {
        try {
            const res = await fetch(`${path}?cb=${tStamp}`, { cache: "no-store" }); if (!res.ok) throw new Error();
            const text = await res.text();
            const lines = text.split('\n').length;
            const bytes = new Blob([text]).size;
            const m = text.match(/(?:\/\/|\/\*|<!--)\s*version:\s*([^\s\*\/]+)/i);
            const ver = m ? m[1].replace(/-->/g, '').trim() : 'unknown';
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
