// version: v3.5
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
    
    // 1. Отрисовываем монолитные полные десятки
    for (let i = 0; i < t.tens; i++) {
        dC += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) dC += `<div class="crystal-item ${t.isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>`;
        dC += `</div>`;
    }
    
    // 2. Отрисовываем выделенный хвостик единиц (Всегда достраиваем рамку до 10!)
    if (t.ones > 0 || t.borrow !== 0) {
        dC += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        let activeOnes = t.borrow < 0 ? t.ones + t.borrow : t.ones;
        let totalOnes = t.borrow > 0 ? t.ones + t.borrow : t.ones;
        
        for (let j = 1; j <= 10; j++) {
            if (j <= activeOnes) {
                dC += `<div class="crystal-item ${t.isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>`;
            } else if (j <= totalOnes) {
                // Подкрашиваем прилетевшие кубики заимствования
                dC += `<div class="crystal-item ${t.isOrange ? 'borrow-blue' : 'borrow-orange'}"></div>`;
            } else {
                // ИСПРАВЛЕНО: на любой фазе (включая Фазу 1) незанятые места рисуются четкими пустыми контурами ячеек
                dC += `<div class="crystal-item" style="border:1px solid #cbd5e1; background:#fff; box-shadow:none;"></div>`;
            }
        }
        dC += `</div>`;
    }
    
    const r = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:40px;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${t.color};font-size:13px;margin-top:2px;">${t.label}</b></div>`;
    const d = `<div class="crystal-deck ${t.isOrange ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;${t.style || ''}">${hC}<div style="display:flex;gap:4px;align-items:flex-end;">${dC}</div></div>`;
    return t.isOrange ? `<div class="crystal-truck">${d}${r}</div>` : `<div class="crystal-truck">${r}${d}</div>`;
}

export function buildMergedDeckHTML(d) {
    let html = '';
    for (let i = 0; i < d.tens1; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item borrow-blue"></div>`;
        html += `</div>`;
    }
    if (d.leftBorrowCount > 0) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${j <= d.ones1 ? 'borrow-blue' : 'borrow-orange'}"></div>`;
        html += `</div>`;
    } else if (d.rightBorrowCount > 0) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${j <= d.ones2 ? 'borrow-orange' : 'borrow-blue'}"></div>`;
        html += `</div>`;
    }
    for (let i = 0; i < d.tens2; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item borrow-orange"></div>`;
        html += `</div>`;
    }
    let rem = d.leftBorrowCount > 0 ? d.ones2 - d.leftBorrowCount : d.ones1 - d.rightBorrowCount;
    if (rem > 0) {
        html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        for (let j = 1; j <= 10; j++) html += (j <= rem) ? `<div class="crystal-item ${d.leftBorrowCount > 0 ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
        html += `</div>`;
    }
    return html;
}
