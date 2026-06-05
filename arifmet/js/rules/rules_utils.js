// version: v4.0

/**
 * Универсальный генератор мега-кристаллов (сотни, тысячи, миллионы)
 */
export function genMegaCrystals(count, className = '') {
    let html = '';
    for (let i = 0; i < count; i++) html += `<div class="hundred-crystal ${className}"></div>`;
    return html;
}

/**
 * Универсальный поштучный отрисовщик кузова для абсолютно любого числа
 * @param {Object} v - Вектор: { baseColor, borrowColor, mega, tens, ones, getOnes, giveOnes }
 */
export function drawGenericNumber(v) {
    let html = '';
    
    // 1. Ряд мега-кристаллов (сотни/тысячи) со своими классами цветов
    if (v.mega > 0) {
        html += `<div style="display:flex;gap:4px;margin-bottom:8px;justify-content:flex-start;width:100%;padding-left:2px;">`;
        html += genMegaCrystals(v.mega, v.megaClass || '');
        html += `</div>`;
    }

    let deckHTML = '';
    // 2. Ряд чистых монолитных столбиков десятков
    for (let i = 0; i < v.tens; i++) {
        deckHTML += `<div class="crystal-column">`;
        for (let j = 1; j <= 10; j++) deckHTML += `<div class="crystal-item ${v.baseColor}"></div>`;
        deckHTML += `</div>`;
    }

    // 3. Выделенный правый столбец единиц (Хвостик) с поштучной раскраской обмена
    if (v.ones > 0 || v.getOnes > 0 || v.giveOnes > 0) {
        deckHTML += `<div class="crystal-column" style="margin-left:6px;border-left:1px dashed #cbd5e1;padding-left:4px;">`;
        let activeOnes = v.ones - v.giveOnes; // Сколько родных осталось после отдачи
        let totalOnes = activeOnes + v.getOnes; // Всего кубиков в хвостике с учетом прилетевших
        let gridCeil = (v.getOnes > 0 || v.giveOnes > 0) ? 10 : totalOnes; // В фазе обмена достраиваем рамку до 10

        for (let j = 1; j <= 10; j++) {
            if (j <= activeOnes) {
                deckHTML += `<div class="crystal-item ${v.baseColor}"></div>`;
            } else if (j <= totalOnes) {
                // Кубики, которые прилетели от соседа, красятся в ЕГО цвет
                deckHTML += `<div class="crystal-item ${v.borrowColor}"></div>`;
            } else if (j <= gridCeil) {
                // Пустые контуры-ячейки резерва
                deckHTML += `<div class="crystal-item" style="border:1px solid #cbd5e1; background:#fff; box-shadow:none;"></div>`;
            } else {
                deckHTML += `<div class="crystal-item" style="background:transparent;border-color:transparent;box-shadow:none;"></div>`;
            }
        }
        deckHTML += `</div>`;
    }

    html += `<div style="display:flex;gap:4px;align-items:flex-end;">${deckHTML}</div>`;
    return html;
}

export function buildTruckHTML(t) {
    const r = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:40px;"><span style="font-size:36px;line-height:1;">🤖</span><b style="color:${t.textColor};font-size:13px;margin-top:2px;">${t.label}</b></div>`;
    const d = `<div class="crystal-deck ${t.themeClass || ''}" style="display:flex;flex-direction:column;gap:5px;${t.style || ''}">${drawGenericNumber(t.vector)}</div>`;
    return t.isLeftRobot ? `<div class="crystal-truck">${r}${d}</div>` : `<div class="crystal-truck">${d}${r}</div>`;
}
