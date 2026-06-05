// version: v1.0
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

