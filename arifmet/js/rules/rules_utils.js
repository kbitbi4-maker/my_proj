// version: v2.1
export function genHundreds(p, c, m, e) {
    let h = p || c || m || e ? '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">' : '';
    for (let i = 0; i < p; i++) h += '<div class="hundred-crystal"></div>';
    for (let i = 0; i < c; i++) h += '<div class="hundred-crystal crimson"></div>';
    for (let i = 0; i < m; i++) h += '<div class="hundred-crystal mixed"></div>';
    for (let i = 0; i < e; i++) h += '<div class="hundred-crystal empty"></div>';
    return h ? h + '</div>' : '';
}

function buildColsHTML(tens, ones, isOrange, isLRound, isRRound, need) {
    let html = '', totalCubes = tens * 10 + ones;
    // Динамически вычисляем ИТОГОВОЕ живое количество кубиков в Фазе 2
    if (isLRound) totalCubes = isOrange ? totalCubes - need : totalCubes + need;
    if (isRRound) totalCubes = isOrange ? totalCubes + need : totalCubes - need;

    let displayTens = Math.floor(totalCubes / 10);
    let displayOnes = totalCubes % 10;

    // 1. Отрисовываем чистые полные десятки
    for (let i = 0; i < displayTens; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>`;
        html += `</div>`;
    }
    // 2. Отрисовываем смешанный столбик или чистый хвостик единиц
    if (isLRound && !isOrange && displayOnes === 0 && totalCubes > 0) {
        html = html.substring(0, html.lastIndexOf('<div class="crystal-column">')); // Заменяем последний десяток на гибрид
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${j <= ones ? 'borrow-blue' : 'borrow-orange'}"></div>`;
        html += `</div>`;
    } else if (isRRound && isOrange && displayOnes === 0 && totalCubes > 0) {
        html = html.substring(0, html.lastIndexOf('<div class="crystal-column">'));
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${j <= ones ? 'borrow-orange' : 'borrow-blue'}"></div>`;
        html += `</div>`;
    } else if (displayOnes > 0) {
        html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        for (let j = 1; j <= 10; j++) html += (j <= displayOnes) ? `<div class="crystal-item ${isOrange ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
        html += `</div>`;
    }
    return html;
}

export function buildTruckHTML(t) {
    let hC = genHundreds(t.hundreds, t.mixedHundreds, 0, 0);
    let dC = buildColsHTML(t.tens, t.ones, t.isOrange, t.isLeftRound, t.isRightRound, t.needOnes);
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
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${j <= l.ones ? 'borrow-blue' : 'borrow-orange'}"></div>`;
        html += `</div>`;
    } else if (l.isRightRound) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item ${j <= r.ones ? 'borrow-orange' : 'borrow-blue'}"></div>`;
        html += `</div>`;
    }
    for (let i = 0; i < r.tens; i++) {
        html += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) html += `<div class="crystal-item borrow-orange"></div>`;
        html += `</div>`;
    }
    let rem = l.isLeftRound ? r.ones - l.needOnes : l.ones - l.needOnes;
    if (rem > 0) {
        html += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        for (let j = 1; j <= 10; j++) html += (j <= rem) ? `<div class="crystal-item ${l.isLeftRound ? 'borrow-orange' : 'borrow-blue'}"></div>` : `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
        html += `</div>`;
    }
    return html;
}
