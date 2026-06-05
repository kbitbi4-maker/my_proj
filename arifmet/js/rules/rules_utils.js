// version: v1.1
export function genCols(count, isOrange, borrow) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `<div class="crystal-column">`;
        let isLast = (i === count - 1) && (borrow > 0);
        for (let j = 1; j <= 10; j++) {
            html += `<div class="crystal-item ${(isLast && j > (10 - borrow)) ? (isOrange ? 'borrow-blue' : 'borrow-orange') : (isOrange ? 'borrow-orange' : 'borrow-blue')}"></div>`;
        }
        html += `</div>`;
    }
    return html;
}

export function genOnes(count, isOrange) {
    if (count === 0) return '';
    let html = `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
    for (let j = 1; j <= 10; j++) {
        html += (j <= count) ? `<div class="crystal-item ${isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
    }
    return html + `</div>`;
}

export function genHundreds(p, c, m, e) {
    let h = p || c || m || e ? '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">' : '';
    for (let i = 0; i < p; i++) h += '<div class="hundred-crystal"></div>';
    for (let i = 0; i < c; i++) h += '<div class="hundred-crystal crimson"></div>';
    for (let i = 0; i < m; i++) h += '<div class="hundred-crystal mixed"></div>';
    for (let i = 0; i < e; i++) h += '<div class="hundred-crystal empty"></div>';
    return h ? h + '</div>' : '';
}

export function buildTruckHTML(t) {
    let hC = genHundreds(t.hundreds, t.mixedHundreds, 0, 0), dC = '';
    for (let i = 0; i < t.tens; i++) { dC += `<div class="crystal-column">`; let isL = (i === t.tens - 1) && (t.borrow > 0); for (let j = 1; j <= 10; j++) dC += `<div class="crystal-item ${(isL && j > (10 - t.borrow)) ? (t.isOrange ? 'borrow-blue' : 'borrow-orange') : (t.isOrange ? 'borrow-orange' : 'borrow-blue')}"></div>`; dC += `</div>`; }
    if (t.ones > 0) { dC += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`; for (let j = 1; j <= 10; j++) dC += (j <= t.ones) ? `<div class="crystal-item ${t.isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`; dC += `</div>`; }
    const r = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:40px;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${t.color};font-size:13px;margin-top:2px;">${t.label}</b></div>`;
    const d = `<div class="crystal-deck ${t.isOrange ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;${t.style || ''}">${hC}<div style="display:flex;gap:4px;align-items:flex-end;">${dC}</div></div>`;
    return t.isOrange ? `<div class="crystal-truck">${d}${r}</div>` : `<div class="crystal-truck">${r}${d}</div>`;
}
