// version: v2.2
export function genHundreds(p, c, m, e) {
    let h = p || c || m || e ? '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">' : '';
    for (let i = 0; i < p; i++) h += '<div class="hundred-crystal"></div>';
    for (let i = 0; i < c; i++) h += '<div class="hundred-crystal crimson"></div>';
    for (let i = 0; i < m; i++) h += '<div class="hundred-crystal mixed"></div>';
    for (let i = 0; i < e; i++) h += '<div class="hundred-crystal empty"></div>';
    return h ? h + '</div>' : '';
}

export function buildTruckHTML(t) {
    let hC = genHundreds(t.hundreds, t.mixedHundreds, 0, 0), dC = '', globalCounter = 0;
    let totalCubes = t.tens * 10 + t.ones;
    let fullCols = Math.floor(totalCubes / 10), remOnes = totalCubes % 10;

    for (let i = 0; i < fullCols; i++) {
        dC += `<div class="crystal-column">`;
        let isLast = (i === fullCols - 1) && (t.colorBorrow > 0);
        for (let j = 1; j <= 10; j++) {
            globalCounter++;
            // Если это последний столбик округления, красим его верхушку в цвет заимствования
            let itemClass = (isLast && j > (10 - t.colorBorrow)) ? (t.isOrange ? 'borrow-blue' : 'borrow-orange') : (t.isOrange ? 'borrow-orange' : 'borrow-blue');
            dC += `<div class="crystal-item ${itemClass}"></div>`;
        }
        dC += `</div>`;
    }
    if (remOnes > 0) {
        dC += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        for (let j = 1; j <= 10; j++) {
            if (j <= remOnes) {
                dC += `<div class="crystal-item ${t.isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>`;
            } else dC += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
        }
        dC += `</div>`;
    }
    const r = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:40px;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${t.color};font-size:13px;margin-top:2px;">${t.label}</b></div>`;
    const d = `<div class="crystal-deck ${t.isOrange ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;${t.style || ''}">${hC}<div style="display:flex;gap:4px;align-items:flex-end;">${dC}</div></div>`;
    return t.isOrange ? `<div class="crystal-truck">${d}${r}</div>` : `<div class="crystal-truck">${r}${d}</div>`;
}

export function buildMergedDeckHTML(l, r) {
    let html = '';
    for (let i = 0; i < l.tens; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item borrow-blue"></div>`;
        html += `</div>`;
    }
    if (l.isLeftRound) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${j <= (10 - l.colorBorrow) ? 'borrow-blue' : 'borrow-orange'}"></div>`;
        html += `</div>`;
    } else if (l.isRightRound) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${j <= (10 - l.colorBorrow) ? 'borrow-orange' : 'borrow-blue'}"></div>`;
        html += `</div>`;
    }
    for (let i = 0; i < r.tens; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item borrow-orange"></div>`;
        html += `</div>`;
    }
    let rem = l.isLeftRound ? r.ones : l.ones;
    if (rem > 0) {
        html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        for (let j = 1; j <= 10; j++) html += (j <= rem) ? `<div class="crystal-item ${l.isLeftRound ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
        html += `</div>`;
    }
    return html;
}
