// version: v1.0
export function genSubCargo(t, o, a, s) {
    let base = (t * 10) + o, total = base + a, active = total - s, full = Math.floor(total / 10), rem = total % 10, g = 0, html = '';
    for (let i = 0; i < full; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; }
        html += `</div>`;
    }
    if (rem > 0) {
        html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= active ? `<div class="${g <= base ? 'crystal-item' : 'crystal-item borrow-orange'}"></div>` : `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; }
        html += `</div>`;
    }
    return html;
}

export function genSubEmpty(emptyCount, addedOrange) {
    let total = emptyCount + addedOrange, full = Math.floor(total / 10), rem = total % 10, g = 0, html = '';
    for (let i = 0; i < full; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) { g++; html += g <= emptyCount ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; }
        html += `</div>`;
    }
    if (rem > 0) {
        html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += g <= emptyCount ? `<div class="crystal-item" style="border:1px solid #000;background:#fff;box-shadow:none;"></div>` : `<div class="crystal-item borrow-orange"></div>`; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; }
        html += `</div>`;
    }
    return html;
}

export function genSubFinal(blueCount, orangeCount) {
    let total = blueCount + orangeCount, full = Math.floor(total / 10), rem = total % 10, g = 0, html = '';
    for (let i = 0; i < full; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) { g++; html += `<div class="crystal-item ${g <= blueCount ? '' : 'borrow-orange'}"></div>`; }
        html += `</div>`;
    }
    if (rem > 0) {
        html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        for (let j = 1; j <= 10; j++) { if (j <= rem) { g++; html += `<div class="crystal-item ${g <= blueCount ? '' : 'borrow-orange'}"></div>` ; } else html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; }
        html += `</div>`;
    }
    return html;
}

