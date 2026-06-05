// version: v4.5
export function genHundreds(p, c, m, e) {
    let h = p || c || m || e ? '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">' : '';
    for (let i = 0; i < p; i++) h += '<div class="hundred-crystal"></div>';
    for (let i = 0; i < c; i++) h += '<div class="hundred-crystal crimson"></div>';
    for (let i = 0; i < m; i++) h += '<div class="hundred-crystal mixed"></div>';
    for (let i = 0; i < e; i++) h += '<div class="hundred-crystal empty"></div>';
    return h ? h + '</div>' : '';
}

export function buildTruckHTML(label, color, deckHTML, deckStyle, isOrange = false) {
    const robot = `<div style="display:flex;flex-direction:column;align-items:center;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${color};font-size:13px;margin-top:1px;">${label}</b></div>`;
    return `<div class="crystal-truck">${isOrange ? `<div class="crystal-deck orange-theme" style="${deckStyle}">${deckHTML}</div>` + robot : robot + `<div class="crystal-deck" style="${deckStyle}">${deckHTML}</div>`}</div>`;
}

export function generateCrystalColumnsHTML(count, isOrange, borrow) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-column">`; let isLast = (i === count - 1) && (borrow > 0);
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${(isLast && j > (10 - borrow)) ? (isOrange ? 'borrow-blue' : 'borrow-orange') : (isOrange ? 'borrow-orange' : 'borrow-blue')}"></div>`;
        html += `</div>`;
    }
    return html;
}

export function generateOnesHTML(count, isOrange) {
    if (count === 0) return '';
    let html = `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
    for (let j = 1; j <= 10; j++) html += (j <= count) ? `<div class="crystal-item ${isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
    return html + `</div>`;
}
