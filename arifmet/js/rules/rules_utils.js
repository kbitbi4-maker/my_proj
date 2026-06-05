// version: v3.0
export function genHundreds(p, c, m, e) {
    let h = p || c || m || e ? '<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">' : '';
    for (let i = 0; i < p; i++) h += '<div class="hundred-crystal"></div>';
    for (let i = 0; i < c; i++) h += '<div class="hundred-crystal crimson"></div>';
    for (let i = 0; i < m; i++) h += '<div class="hundred-crystal mixed"></div>';
    for (let i = 0; i < e; i++) h += '<div class="hundred-crystal empty"></div>';
    return h ? h + '</div>' : '';
}

/**
 * Универсальный отрисовщик кузова по вектору: родные, прилетевшие, отданные кубики и цель
 */
export function drawVectorDeck(base, get, give, target, isOrange = false) {
    let html = '', globalCounter = 0;
    let activeCubes = base - give + get; // Сколько реально закрашено кубиков в кузове
    let totalGridCubes = Math.max(base + get, target); // Сколько всего ячеек строить в сетке
    if (totalGridCubes === 0) return '';

    let fullCols = Math.floor(totalGridCubes / 10);
    let remOnes = totalGridCubes % 10;
    if (remOnes > 0) fullCols++; // Добавляем неполную колонку в общую сетку циклов

    for (let i = 0; i < fullCols; i++) {
        let isLastColumn = (i === fullCols - 1) && (remOnes > 0);
        html += `<div class="crystal-column" style="${isLastColumn ? 'margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;' : ''}">`;
        
        for (let j = 1; j <= 10; j++) {
            globalCounter++;
            if (globalCounter > totalGridCubes) {
                html += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
            } else if (globalCounter <= activeCubes) {
                // Если счетчик в зоне прилетевших чужих кубиков — красим в инвертированный цвет
                let isGettedItem = globalCounter > (base - give);
                let itemClass = isGettedItem ? (isOrange ? 'borrow-blue' : 'borrow-orange') : (isOrange ? 'borrow-orange' : 'borrow-blue');
                html += `<div class="crystal-item ${itemClass}"></div>`;
            } else {
                // Все отданные или пустые ячейки резерва рисуются прозрачными контурами с белым фоном
                html += `<div class="crystal-item" style="border:1px solid #cbd5e1; background:#fff; box-shadow:none;"></div>`;
            }
        }
        html += `</div>`;
    }
    return html;
}

export function buildTruckHTML(t) {
    let hC = genHundreds(t.hundreds, t.mixedHundreds, 0, 0);
    let dC = drawVectorDeck(t.base, t.get, t.give, t.target, t.isOrange);
    const r = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:40px;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${t.color};font-size:13px;margin-top:2px;">${t.label}</b></div>`;
    const d = `<div class="crystal-deck ${t.isOrange ? 'orange-theme' : ''}" style="display:flex;flex-direction:column;gap:5px;${t.style || ''}">${hC}<div style="display:flex;gap:4px;align-items:flex-end;">${dC}</div></div>`;
    return t.isOrange ? `<div class="crystal-truck">${d}${r}</div>` : `<div class="crystal-truck">${r}${d}</div>`;
}
