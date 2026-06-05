// version: v4.0
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
 * Читает содержимое текстового поля и генерирует на его основе PDF для ИИ
 */
export function downloadProjectMapPDF() {
    const area = document.getElementById('map-text-area');
    if (!area || !area.value || area.value.startsWith('⏳')) {
        alert('Пожалуйста, подождите полной сборки проекта!');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
    });

    // Настраиваем плотный Courier, чтобы код не разъезжался
    doc.setFont("Courier", "normal");
    doc.setFontSize(8);

    const fullText = area.value;
    const lines = fullText.split('\n');

    const pageHeight = doc.internal.pageSize.height; // ~297mm
    const margin = 10; 
    const lineHeight = 3.5; 
    let y = margin;

    lines.forEach((line) => {
        // Перенос строки при заполнении страницы A4
        if (y + lineHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        
        // Очищаем строку от непечатаемых управляющих символов ASCII во избежание сбоев в jsPDF
        const cleanLine = line.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
        doc.text(cleanLine, margin, y);
        y += lineHeight;
    });

    const dateStr = new Date().toISOString().slice(0,10);
    doc.save(`arifmet_repository_${dateStr}.pdf`);
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
