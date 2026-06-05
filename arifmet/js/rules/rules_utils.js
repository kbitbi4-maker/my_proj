// version: v2.2
export function genHundreds(p, c, m, e) {
    let h = p || c || m || e ? '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">' : '';
    for (let i = 0; i < p; i++) h += '<div class="hundred-crystal"></div>';
    for (let i = 0; i < c; i++) h += '<div class="hundred-crystal crimson"></div>';
    for (let i = 0; i < m; i++) h += '<div class="hundred-crystal mixed"></div>';
    for (let i = 0; i < e; i++) h += '<div class="hundred-crystal empty"></div>';
    return h ? h + '</div>' : '';
}

export function generateCrystalColumnsHTML(tens, ones, borrowCount, isOrange = false) {
    let html = '';
    for (let i = 0; i < tens; i++) {
        html += `<div class="crystal-column">`;
        let isLastColumn = (i === tens - 1) && (borrowCount > 0);
        for (let j = 1; j <= 10; j++) {
            let itemClass = isOrange ? 'borrow-orange' : 'borrow-blue';
            if (isLastColumn && j > (10 - borrowCount)) {
                itemClass = isOrange ? 'borrow-blue' : 'borrow-orange';
            }
            html += `<div class="crystal-item ${itemClass}"></div>`;
        }
        html += `</div>`;
    }
    if (ones > 0) {
        html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        for (let j = 1; j <= 10; j++) {
            if (j <= ones) {
                html += `<div class="crystal-item ${isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>`;
            } else {
                html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
            }
        }
        html += `</div>`;
    }
    return html;
}

export function buildMergedDeckHTML(d) {
    let html = '';
    if (d.rightBorrowCount > 0) {
        let onesHTML = '';
        if (d.totalOnes > 0) {
            onesHTML += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
            for (let j = 1; j <= 10; j++) {
                onesHTML += (j <= d.totalOnes) ? `<div class="crystal-item borrow-blue"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
            }
            onesHTML += `</div>`;
        }
        html += onesHTML + generateCrystalColumnsHTML(d.tens1, 0, 0, false) + generateCrystalColumnsHTML(d.tens2, 0, 0, true) + generateCrystalColumnsHTML(1, 0, d.rightBorrowCount, true);
    } else if (d.leftBorrowCount > 0) {
        let onesHTML = '';
        if (d.totalOnes > 0) {
            onesHTML += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
            for (let j = 1; j <= 10; j++) {
                onesHTML += (j <= d.totalOnes) ? `<div class="crystal-item borrow-orange"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
            }
            onesHTML += `</div>`;
        }
        html += generateCrystalColumnsHTML(d.tens1, 0, 0, false) + generateCrystalColumnsHTML(1, 0, d.leftBorrowCount, false) + generateCrystalColumnsHTML(d.tens2, 0, 0, true) + onesHTML;
    } else {
        html += generateCrystalColumnsHTML(d.tens1, d.ones1, 0, false) + generateCrystalColumnsHTML(d.tens2, d.ones2, 0, true);
    }
    return html;
}

export function buildTruckHTML(t) {
    let hC = genHundreds(t.hundreds, t.mixedHundreds, 0, 0);
    let dC = generateCrystalColumnsHTML(t.tens, t.ones, t.borrow, t.isOrange);
    const r = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:40px;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${t.color};font-size:13px;margin-top:2px;">${t.label}</b></div>`;
    const d = `<div class="crystal-deck ${t.isOrange ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;${t.style || ''}">${hC}<div style="display:flex;gap:4px;align-items:flex-end;">${dC}</div></div>`;
    return t.isOrange ? `<div class="crystal-truck">${d}${r}</div>` : `<div class="crystal-truck">${r}${d}</div>`;
}
