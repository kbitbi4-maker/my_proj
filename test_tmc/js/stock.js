// js/stock.js — Модуль Excel-грида остатков склада с поддержкой выделений и Shift-диапазонов — ЧАСТЬ 1

window.isStockEditMode = false;
window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.stockActiveCell = { row: null, col: null };
window.stockChangesQueue = {}; // Кэш измененных ячеек: {"R_C": {value, bg, fontColor, fontWeight}}

function showStock() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length === 0) { 
    alert("Сначала нажмите кнопку синхронизации ☁"); 
    return; 
  }
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";
  window.isStockEditMode = true; // Сразу активируем интерактивный Excel-режим

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
  
  renderStock(); 
}

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase() : "";
  
  const currentData = window.inventoryData;
  if (!currentData || !currentData.length) return;
  
  let controlsWrapper = document.getElementById('stock-edit-controls-wrapper');
  if (!controlsWrapper) {
    controlsWrapper = document.createElement('div');
    controlsWrapper.id = 'stock-edit-controls-wrapper';
    controlsWrapper.style.width = '100%';
    if (searchInput && searchInput.parentNode) {
      searchInput.parentNode.insertBefore(controlsWrapper, searchInput);
    }
  }

  controlsWrapper.innerHTML = `
    <div id="stock-edit-badge" class="stock-mode-badge">
      🟢 РЕЖИМ EXCEL-ГРИДА АКТИВЕН (Выделение ячеек, строк, столбцов, клик с Shift)
    </div>
    <div id="stock-edit-actions" class="stock-edit-actions-row">
      <button class="btn-stock-cancel" onclick="cancelStockChanges()">Сбросить кэш</button>
      <button class="btn-stock-save" onclick="saveStockChangesCloud()">Сохранить изменения в Google (${Object.keys(window.stockChangesQueue).length})</button>
    </div>
  `;
  
  // Добавляем пустой заголовок в начало для столбца нумерации строк (Excel-style)
  head.innerHTML = `
    <th></th>
    <th onclick="excelSelectWholeColumn(0)">Партия</th>
    <th onclick="excelSelectWholeColumn(1)">Материал</th>
    <th onclick="excelSelectWholeColumn(2)">КрТекстМатериала</th>
    <th onclick="excelSelectWholeColumn(3)">Базисная ЕИ</th>
    <th onclick="excelSelectWholeColumn(4)">Кол-во<br>запаса</th>
    <th onclick="excelSelectWholeColumn(5)">из.SUP</th>
    <th onclick="excelSelectWholeColumn(6)">скл.1</th>
    <th onclick="excelSelectWholeColumn(7)">не проведено<br>в SUP</th>
    <th onclick="excelSelectWholeColumn(8)">скл.2</th>
    <th onclick="excelSelectWholeColumn(9)">цена<br>за ед.</th>
    <th onclick="excelSelectWholeColumn(10)">полка №</th>
    <th onclick="excelSelectWholeColumn(11)">лок.ID</th>
    <th onclick="excelSelectWholeColumn(12)">Ст-ть<br>запаса</th>
    <th onclick="excelSelectWholeColumn(13)">Завод</th>
    <th onclick="excelSelectWholeColumn(14)">Склад</th>
    <th onclick="excelSelectWholeColumn(15)">Особый запас</th>
    <th onclick="excelSelectWholeColumn(16)">СПП-элемент</th>
    <th onclick="excelSelectWholeColumn(17)">Группа материалов</th>
    <th onclick="excelSelectWholeColumn(18)">Дата поступления</th>
    <th onclick="excelSelectWholeColumn(19)">Золото</th>
    <th onclick="excelSelectWholeColumn(20)">Серебро</th>
  `;

  body.innerHTML = currentData.map((row, rIdx) => {
    if (rIdx === 0) return ''; // Пропускаем шапку, так как она уже в head
    
    const isMatch = row.some(cell => String(cell).toLowerCase().includes(term));
    if (!isMatch && term !== "") return '';

    // Генерируем ячейки строки. Первая ячейка — номер строки Excel (1-индексация для пользователя)
    let cellsHtml = `<td class="row-header-num" id="row-hdr-${rIdx}" onclick="excelSelectWholeRow(event, ${rIdx})">${rIdx + 1}</td>`;

    cellsHtml += row.map((cell, cIdx) => {
      const cellKey = `${rIdx}_${cIdx}`;
      const isDirty = window.stockChangesQueue[cellKey];
      let displayValue = isDirty ? isDirty.value : cell;

      if (cIdx === 9 && !isDirty) { // Форматирование цены (индекс 9)
        const parsedPrice = parseFloat(String(cell).replace(/,/g, '.').replace(/\s+/g, ''));
        if (!isNaN(parsedPrice)) displayValue = parsedPrice.toFixed(3);
      }

      const dirtyClass = isDirty ? 'cell-stock-dirty' : '';
      
      // Читаем дефолтные или измененные стили для точной отрисовки
      const bgStyle = isDirty && isDirty.bg ? `background-color: ${isDirty.bg};` : '';
      const colorStyle = isDirty && isDirty.fontColor ? `color: ${isDirty.fontColor};` : '';
      const weightStyle = isDirty && isDirty.fontWeight ? `font-weight: ${isDirty.fontWeight};` : '';

      return `
        <td id="ex-cell-${rIdx}-${cIdx}" 
            class="${dirtyClass}" 
            style="${bgStyle} ${colorStyle} ${weightStyle}"
            contenteditable="true" 
            onclick="excelHandleCellClick(event, ${rIdx}, ${cIdx})"
            onblur="excelHandleCellBlur(this, ${rIdx}, ${cIdx})"
            onkeydown="excelHandleCellKeyDown(event, ${rIdx}, ${cIdx})">
          ${displayValue}
        </td>
      `;
    }).join('');

    return `<tr id="ex-row-${rIdx}">${cellsHtml}</tr>`;
  }).join('');
  
  if (body.innerHTML.trim() === "") {
    body.innerHTML = '<tr><td colspan="22">Ничего не найдено</td></tr>';
  }

  // После перерисовки восстанавливаем подсветку выделений, если они были
  excelRefreshSelectionVisuals();
}











' =========================================================================
' ДОСТИГНУТ ЛИМИТ В 6400 СИМВОЛОВ — НАЧАЛО ЧАСТИ 2
' =========================================================================
// js/stock.js — Модуль Excel-грида остатков склада — ОКОНЧАНИЕ ЧАСТИ 2

function excelHandleCellClick(event, rIdx, cIdx) {
  const currentData = window.inventoryData;
  if (!currentData || !currentData[rIdx]) return;

  // Логика выделения с зажатой клавишей SHIFT (Прямоугольный диапазон)
  if (event.shiftKey && window.stockActiveCell.row !== null && window.stockActiveCell.col !== null) {
    window.stockSelectedRange.startRow = Math.min(window.stockActiveCell.row, rIdx);
    window.stockSelectedRange.endRow = Math.max(window.stockActiveCell.row, rIdx);
    window.stockSelectedRange.startCol = Math.min(window.stockActiveCell.col, cIdx);
    window.stockSelectedRange.endCol = Math.max(window.stockActiveCell.col, cIdx);
  } else {
    // Обычный одиночный клик — сбрасываем диапазон и ставим фокус на ячейку
    window.stockActiveCell.row = rIdx;
    window.stockActiveCell.col = cIdx;
    window.stockSelectedRange.startRow = rIdx;
    window.stockSelectedRange.endRow = rIdx;
    window.stockSelectedRange.startCol = cIdx;
    window.stockSelectedRange.endCol = cIdx;
  }

  excelRefreshSelectionVisuals();
  
  // Добавляем класс фокуса на редактируемую ячейку
  const cellEl = document.getElementById(`ex-cell-${rIdx}-${cIdx}`);
  if (cellEl) cellEl.classList.add('cell-active-focus');
}

function excelSelectWholeRow(event, rIdx) {
  event.stopPropagation();
  const currentData = window.inventoryData;
  if (!currentData || !currentData[rIdx]) return;

  window.stockActiveCell.row = rIdx;
  window.stockActiveCell.col = 0;
  
  window.stockSelectedRange.startRow = rIdx;
  window.stockSelectedRange.endRow = rIdx;
  window.stockSelectedRange.startCol = 0;
  window.stockSelectedRange.endCol = currentData[rIdx].length - 1;

  excelRefreshSelectionVisuals();
}

// Выделение всего столбца (привязываем к th шапки при клике)
function excelSelectWholeColumn(cIdx) {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length <= 1) return;

  window.stockActiveCell.row = 1;
  window.stockActiveCell.col = cIdx;

  window.stockSelectedRange.startRow = 1;
  window.stockSelectedRange.endRow = currentData.length - 1;
  window.stockSelectedRange.startCol = cIdx;
  window.stockSelectedRange.endCol = cIdx;

  excelRefreshSelectionVisuals();
}

function excelRefreshSelectionVisuals() {
  // Зачищаем старые классы выделений со всех ячеек и номеров строк
  document.querySelectorAll('.cell-selected, .cell-active-focus, .row-selected')
    .forEach(el => el.classList.remove('cell-selected', 'cell-active-focus', 'row-selected'));

  if (window.stockSelectedRange.startRow === null) return;

  // Подсвечиваем ячейки внутри прямоугольного диапазона
  for (let r = window.stockSelectedRange.startRow; r <= window.stockSelectedRange.endRow; r++) {
    const rowHdr = document.getElementById(`row-hdr-${r}`);
    if (rowHdr) rowHdr.classList.add('row-selected');

    for (let c = window.stockSelectedRange.startCol; c <= window.stockSelectedRange.endCol; c++) {
      const cellEl = document.getElementById(`ex-cell-${r}-${c}`);
      if (cellEl) {
        cellEl.classList.add('cell-selected');
        // Если это активная ячейка фокуса — добавляем рамку
        if (r === window.stockActiveCell.row && c === window.stockActiveCell.col) {
          cellEl.classList.add('cell-active-focus');
        }
      }
    }
  }
}

function excelHandleCellBlur(cellElement, rIdx, cIdx) {
  cellElement.classList.remove('cell-active-focus');
  const newValue = cellElement.innerText.trim();
  const originalValue = String(window.inventoryData[rIdx][cIdx]).trim();

  // Считываем текущее визуальное оформление ячейки, чтобы Excel считал цвета/шрифты
  const currentBg = window.getComputedStyle(cellElement).backgroundColor;
  const currentTextHex = window.getComputedStyle(cellElement).color;
  const currentWeight = window.getComputedStyle(cellElement).fontWeight;

  const cellKey = `${rIdx}_${cIdx}`;

  // Проверяем, изменилось ли значение или оформление относительно исходной базы
  if (newValue !== originalValue || currentBg !== 'transparent' || currentWeight !== 'normal') {
    cellElement.classList.add('cell-stock-dirty');
    
    // Записываем точечные метаданные транзакции в Dirty-кэш изменений
    window.stockChangesQueue[cellKey] = {
      row: rIdx,
      col: cIdx,
      value: newValue,
      bg: currentBg,
      fontColor: currentTextHex,
      fontWeight: currentWeight
    };
  } else {
    // Если вернули старое значение — стираем ячейку из очереди отправки
    cellElement.classList.remove('cell-stock-dirty');
    delete window.stockChangesQueue[cellKey];
  }

  // Обновляем счетчик на кнопке сохранения
  const saveBtn = document.querySelector('.btn-stock-save');
  if (saveBtn) {
    saveBtn.innerText = `Сохранить изменения в Google (${Object.keys(window.stockChangesQueue).length})`;
  }
}

function excelHandleCellKeyDown(event, rIdx, cIdx) {
  // Нажатие на Enter переводит фокус на ячейку ниже (Excel-Style)
  if (event.key === 'Enter') {
    event.preventDefault();
    const nextCell = document.getElementById(`ex-cell-${rIdx + 1}-${cIdx}`);
    if (nextCell) {
      nextCell.focus();
      excelHandleCellClick(event, rIdx + 1, cIdx);
    }
  }
}
