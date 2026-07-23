// ================================================================
// excel_engine.js — ЕДИНЫЙ УНИВЕРСАЛЬНЫЙ ДВИЖОК EXCEL-ТАБЛИЦ
// Версия 1.0 — рендеринг, выделение, drag, copy/paste, сортировка, фильтрация, кастомные обработчики
// ================================================================

const EXCEL_ENGINE = {
  tables: {},
  selections: {},
  sorts: {},
  filters: {},
  editModes: {},
  changesQueues: {},
  activeCells: {},
  isDragging: false,
  dragStart: null,
};

// ================================================================
// РЕГИСТРАЦИЯ ТАБЛИЦЫ
// ================================================================

function excelRegisterTable(tableId, config) {
  const defaultConfig = {
    data: [],
    headers: null,
    colCount: null,
    containerId: tableId,
    searchInputId: null,
    title: 'Таблица',
    editMode: false,
    onRowClick: null,        // функция (tableId, rowIndex) => {}
    onCellClick: null,       // функция (tableId, rowIndex, colIndex, event) => возвращает false чтобы отменить стандартное выделение
    rowColors: null,
    formulas: {},
    cellColors: null,
    isBalanceTable: false,
    allowSelectionInView: false, // разрешить выделение в режиме просмотра
  };

  const merged = Object.assign({}, defaultConfig, config);
  EXCEL_ENGINE.tables[tableId] = merged;
  EXCEL_ENGINE.selections[tableId] = { startRow: null, startCol: null, endRow: null, endCol: null };
  EXCEL_ENGINE.sorts[tableId] = { column: null, direction: null };
  EXCEL_ENGINE.filters[tableId] = { color: 'all', search: '' };
  EXCEL_ENGINE.editModes[tableId] = merged.editMode || false;
  EXCEL_ENGINE.changesQueues[tableId] = {};
  EXCEL_ENGINE.activeCells[tableId] = { row: null, col: null };
  console.log('✅ Таблица зарегистрирована:', tableId);
  return merged;
}

// ================================================================
// ОБНОВЛЕНИЕ ДАННЫХ
// ================================================================

function excelUpdateData(tableId, newData) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) { console.error('❌ Таблица не зарегистрирована:', tableId); return; }
  table.data = newData;
  excelRenderTable(tableId);
}

// ================================================================
// УНИВЕРСАЛЬНЫЙ РЕНДЕРИНГ
// ================================================================

function excelRenderTable(tableId) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) { console.error('❌ Таблица не зарегистрирована:', tableId); return; }

  const data = table.data;
  if (!data || data.length === 0) {
    const bodyContainer = document.getElementById(table.containerId + '-body');
    if (bodyContainer) bodyContainer.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:#999;">Нет данных</td></tr>';
    return;
  }

  const headers = table.headers || data[0] || [];
  const hasHeaders = !!(table.headers || data[0]);
  const dataStartIndex = hasHeaders ? 1 : 0;

  const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const numCols = table.colCount || Math.max(headers.length, data[dataStartIndex] ? data[dataStartIndex].length : 1);

  const headContainer = document.getElementById(table.containerId + '-head');
  const bodyContainer = document.getElementById(table.containerId + '-body');
  if (!headContainer || !bodyContainer) { console.error('❌ Контейнеры не найдены:', tableId); return; }

  // --- ШАПКА (буквы, без номера) ---
  let headHtml = '<tr>';
  headHtml += '<th class="excel-corner" onclick="excelSelectAll(\''+tableId+'\')" title="Выделить всё" style="min-width:40px;max-width:40px;width:40px;background:#e8e8e8!important;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;text-align:center;user-select:none;">⬚</th>';
  for (let c = 0; c < numCols; c++) {
    const letter = colLetters[c] || String.fromCharCode(65 + c);
    const sortIndicator = (EXCEL_ENGINE.sorts[tableId].column === c) ? (EXCEL_ENGINE.sorts[tableId].direction === 'asc' ? ' ↑' : ' ↓') : '';
    headHtml += '<th id="col-hdr-'+tableId+'-'+c+'" onclick="excelSortByColumn(\''+tableId+'\','+c+')" title="Сортировка по столбцу '+letter+'" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;white-space:normal;word-wrap:break-word;">'+letter+sortIndicator+'</th>';
  }
  headHtml += '</tr>';
  headContainer.innerHTML = headHtml;

  // --- СБОР СТРОК ДЛЯ ТЕЛА ---
  let allRows = [];
  if (hasHeaders) {
    allRows.push({ index: 0, data: headers, isHeader: true });
  }
  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    const searchTerm = EXCEL_ENGINE.filters[tableId].search || '';
    if (searchTerm !== '') {
      const isMatch = row.some(cell => String(cell).toLowerCase().includes(searchTerm.toLowerCase()));
      if (!isMatch) continue;
    }
    allRows.push({ index: i, data: row, isHeader: false });
  }

  // Сортировка (только данные)
  const sortCol = EXCEL_ENGINE.sorts[tableId].column;
  const sortDir = EXCEL_ENGINE.sorts[tableId].direction;
  if (sortCol !== null && sortDir !== null) {
    const headersRows = allRows.filter(r => r.isHeader);
    const dataRows = allRows.filter(r => !r.isHeader);
    dataRows.sort((a, b) => {
      let va = String(a.data[sortCol] || '').toLowerCase();
      let vb = String(b.data[sortCol] || '').toLowerCase();
      let na = parseFloat(va.replace(/[^0-9.-]/g, ''));
      let nb = parseFloat(vb.replace(/[^0-9.-]/g, ''));
      if (!isNaN(na) && !isNaN(nb)) return sortDir === 'asc' ? na - nb : nb - na;
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    allRows = headersRows.concat(dataRows);
  }

  // --- ТЕЛО ТАБЛИЦЫ ---
  let bodyHtml = '';
  for (let ri = 0; ri < allRows.length; ri++) {
    const rowData = allRows[ri];
    const rIdx = rowData.index;
    const row = rowData.data;
    const isHeader = rowData.isHeader || false;
    const rowNum = ri + 1;

    // Цвет строки (только для данных)
    let rowColor = '';
    if (!isHeader && table.rowColors) {
      for (let colorKey in table.rowColors) {
        if (table.rowColors[colorKey](row)) { rowColor = colorKey; break; }
      }
    }

    let bgStyle = '';
    if (isHeader) {
      bgStyle = 'background:#f0f0f0;';
    } else if (rowColor) {
      bgStyle = 'background:'+rowColor+';';
    } else {
      bgStyle = (ri % 2 === 1) ? 'background:#e8f5e9;' : 'background:#ffffff;';
    }

    // Выделение строки
    const sel = EXCEL_ENGINE.selections[tableId];
    const isRowSelected = (sel.startRow !== null && rIdx >= sel.startRow && rIdx <= sel.endRow);

    // Обработчик клика по строке (если есть onRowClick и не в режиме редактирования)
    const rowClickAttr = (!EXCEL_ENGINE.editModes[tableId] && table.onRowClick) ? ` onclick="excelHandleRowClick('${tableId}',${rIdx})" style="cursor:pointer;"` : '';

    bodyHtml += '<tr id="ex-row-'+tableId+'-'+rIdx+'"'+rowClickAttr+' style="'+bgStyle+'">';
    bodyHtml += '<td class="row-header-num" id="row-hdr-'+tableId+'-'+rIdx+'" onclick="excelSelectWholeRow(\''+tableId+'\','+rIdx+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;width:40px;padding:4px 2px;'+(isRowSelected ? 'background:#c7e0f4;' : '')+'">'+rowNum+'</td>';

    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      let displayValue = (row[cIdx] !== undefined) ? row[cIdx] : '';
      if (!isHeader && table.formulas && table.formulas[cIdx]) {
        displayValue = table.formulas[cIdx](row);
      }

      const isSelected = (sel.startRow !== null && rIdx >= sel.startRow && rIdx <= sel.endRow && cIdx >= sel.startCol && cIdx <= sel.endCol);
      const isActive = (EXCEL_ENGINE.activeCells[tableId].row === rIdx && EXCEL_ENGINE.activeCells[tableId].col === cIdx);
      const selectClass = isSelected ? 'cell-selected' : '';
      const activeClass = isActive ? 'cell-active-focus' : '';

      const isEditable = EXCEL_ENGINE.editModes[tableId] && !isHeader;

      let cellStyle = bgStyle + ' border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:60px;white-space:normal;word-wrap:break-word;word-break:break-word;' + (isEditable ? 'outline:none;' : '') + 'user-select:none;';
      if (isHeader) cellStyle += 'font-weight:600;background:#f0f0f0;color:#333;';

      const clickHandler = `onclick="excelHandleCellClick('${tableId}',event,${rIdx},${cIdx})"`;
      const mousedownHandler = `onmousedown="excelHandleMouseDown('${tableId}',event,${rIdx},${cIdx})"`;
      const mouseoverHandler = `onmouseover="excelHandleMouseOver('${tableId}',event,${rIdx},${cIdx})"`;
      const blurHandler = isEditable ? `onblur="excelHandleCellBlur('${tableId}',this,${rIdx},${cIdx})"` : '';
      const keydownHandler = isEditable ? `onkeydown="excelHandleCellKeyDown('${tableId}',event,${rIdx},${cIdx})"` : '';
      const contentEditableAttr = isEditable ? 'contenteditable="true"' : '';

      bodyHtml += `<td id="ex-cell-${tableId}-${rIdx}-${cIdx}" class="${selectClass} ${activeClass}" style="${cellStyle}" ${contentEditableAttr} ${clickHandler} ${mousedownHandler} ${mouseoverHandler} ${blurHandler} ${keydownHandler}>${displayValue}</td>`;
    }
    bodyHtml += '</tr>';
  }

  bodyContainer.innerHTML = bodyHtml || `<tr><td colspan="${numCols+1}" style="text-align:center;padding:20px;color:#999;">Ничего не найдено</td></tr>`;

  excelRefreshSelectionVisuals(tableId);
  excelAttachDragListeners(tableId);
}

// ================================================================
// ОБРАБОТЧИКИ КЛИКОВ (С ПОДДЕРЖКОЙ КАСТОМНЫХ onCellClick / onRowClick)
// ================================================================

function excelHandleRowClick(tableId, rIdx) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table || EXCEL_ENGINE.editModes[tableId]) return;
  if (table.onRowClick) table.onRowClick(tableId, rIdx);
}

function excelHandleCellClick(tableId, event, rIdx, cIdx) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;

  // Если есть кастомный обработчик для ячейки
  if (table.onCellClick) {
    const result = table.onCellClick(tableId, rIdx, cIdx, event);
    if (result === false) return; // запрещаем стандартное выделение и onRowClick
  }

  // Если не в режиме редактирования и есть onRowClick — вызываем его и выходим
  if (!EXCEL_ENGINE.editModes[tableId] && table.onRowClick) {
    table.onRowClick(tableId, rIdx);
    return;
  }

  // Иначе — стандартное выделение
  if (EXCEL_ENGINE.isDragging) return;

  const sel = EXCEL_ENGINE.selections[tableId];
  if (event.shiftKey && sel.startRow !== null) {
    sel.startRow = Math.min(sel.startRow, rIdx);
    sel.endRow = Math.max(sel.endRow, rIdx);
    sel.startCol = Math.min(sel.startCol, cIdx);
    sel.endCol = Math.max(sel.endCol, cIdx);
  } else {
    sel.startRow = rIdx;
    sel.endRow = rIdx;
    sel.startCol = cIdx;
    sel.endCol = cIdx;
  }
  EXCEL_ENGINE.activeCells[tableId].row = rIdx;
  EXCEL_ENGINE.activeCells[tableId].col = cIdx;
  excelRefreshSelectionVisuals(tableId);

  if (EXCEL_ENGINE.editModes[tableId]) {
    const cellEl = document.getElementById(`ex-cell-${tableId}-${rIdx}-${cIdx}`);
    if (cellEl) cellEl.focus();
  }
}

function excelHandleMouseDown(tableId, event, rIdx, cIdx) {
  event.preventDefault();
  EXCEL_ENGINE.isDragging = true;
  EXCEL_ENGINE.dragStart = { tableId, row: rIdx, col: cIdx };
  const sel = EXCEL_ENGINE.selections[tableId];
  sel.startRow = rIdx;
  sel.endRow = rIdx;
  sel.startCol = cIdx;
  sel.endCol = cIdx;
  EXCEL_ENGINE.activeCells[tableId].row = rIdx;
  EXCEL_ENGINE.activeCells[tableId].col = cIdx;
  excelRefreshSelectionVisuals(tableId);
}

function excelHandleMouseOver(tableId, event, rIdx, cIdx) {
  if (!EXCEL_ENGINE.isDragging) return;
  if (EXCEL_ENGINE.dragStart.tableId !== tableId) return;
  const startRow = EXCEL_ENGINE.dragStart.row;
  const startCol = EXCEL_ENGINE.dragStart.col;
  const sel = EXCEL_ENGINE.selections[tableId];
  sel.startRow = Math.min(startRow, rIdx);
  sel.endRow = Math.max(startRow, rIdx);
  sel.startCol = Math.min(startCol, cIdx);
  sel.endCol = Math.max(startCol, cIdx);
  excelRefreshSelectionVisuals(tableId);
}

// ================================================================
// ВЫДЕЛЕНИЕ (ОБЩЕЕ)
// ================================================================

function excelSelectAll(tableId) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  const data = table.data;
  if (!data || data.length === 0) return;
  const lastRow = data.length - 1;
  const numCols = table.colCount || data[0].length;
  const sel = EXCEL_ENGINE.selections[tableId];
  sel.startRow = 0;
  sel.endRow = lastRow;
  sel.startCol = 0;
  sel.endCol = numCols - 1;
  EXCEL_ENGINE.activeCells[tableId].row = 0;
  EXCEL_ENGINE.activeCells[tableId].col = 0;
  excelRefreshSelectionVisuals(tableId);
}

function excelSelectWholeRow(tableId, rIdx) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  const numCols = table.colCount || table.data[0].length;
  const sel = EXCEL_ENGINE.selections[tableId];
  sel.startRow = rIdx;
  sel.endRow = rIdx;
  sel.startCol = 0;
  sel.endCol = numCols - 1;
  EXCEL_ENGINE.activeCells[tableId].row = rIdx;
  EXCEL_ENGINE.activeCells[tableId].col = 0;
  excelRefreshSelectionVisuals(tableId);
}

function excelSelectWholeColumn(tableId, cIdx) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  const data = table.data;
  if (!data || data.length === 0) return;
  const lastRow = data.length - 1;
  const sel = EXCEL_ENGINE.selections[tableId];
  sel.startRow = 0;
  sel.endRow = lastRow;
  sel.startCol = cIdx;
  sel.endCol = cIdx;
  EXCEL_ENGINE.activeCells[tableId].row = 0;
  EXCEL_ENGINE.activeCells[tableId].col = cIdx;
  excelRefreshSelectionVisuals(tableId);
}

function excelRefreshSelectionVisuals(tableId) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  const container = document.getElementById(table.containerId);
  if (!container) return;

  container.querySelectorAll('.cell-selected, .cell-active-focus, .row-selected, .col-selected')
    .forEach(el => {
      el.classList.remove('cell-selected', 'cell-active-focus', 'row-selected', 'col-selected');
      el.style.background = '';
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.borderBottom = '';
    });

  const headRow = document.querySelector(`#${table.containerId}-head tr:first-child`);
  if (headRow) {
    headRow.querySelectorAll('th').forEach(el => { el.style.background = ''; el.style.borderBottom = ''; });
  }

  const sel = EXCEL_ENGINE.selections[tableId];
  if (sel.startRow === null) return;

  for (let r = sel.startRow; r <= sel.endRow; r++) {
    const rowHdr = document.getElementById(`row-hdr-${tableId}-${r}`);
    if (rowHdr) { rowHdr.classList.add('row-selected'); rowHdr.style.background = '#c7e0f4'; }
    for (let c = sel.startCol; c <= sel.endCol; c++) {
      const cellEl = document.getElementById(`ex-cell-${tableId}-${r}-${c}`);
      if (cellEl) {
        cellEl.classList.add('cell-selected');
        cellEl.style.background = '#c7e0f4';
        cellEl.style.outline = '2px solid #2b5797';
        cellEl.style.outlineOffset = '-2px';
        if (r === EXCEL_ENGINE.activeCells[tableId].row && c === EXCEL_ENGINE.activeCells[tableId].col) {
          cellEl.classList.add('cell-active-focus');
          cellEl.style.outline = '3px solid #1e4f7a';
          cellEl.style.outlineOffset = '-3px';
          cellEl.style.background = '#d4e8f7';
        }
      }
    }
  }

  if (headRow) {
    const cells = headRow.querySelectorAll('th');
    if (cells[sel.startCol + 1]) {
      cells[sel.startCol + 1].style.background = '#c7e0f4';
      cells[sel.startCol + 1].style.borderBottom = '3px solid #2b5797';
    }
  }
}

// ================================================================
// DRAG (ГЛОБАЛЬНЫЕ СЛУШАТЕЛИ)
// ================================================================

function excelAttachDragListeners(tableId) {
  const container = document.getElementById(EXCEL_ENGINE.tables[tableId].containerId);
  const table = container ? container.querySelector('table') : null;
  if (!table) return;
  // удаляем старые
  table.removeEventListener('mousedown', excelGlobalMouseDown);
  table.removeEventListener('mousemove', excelGlobalMouseMove);
  table.removeEventListener('mouseup', excelGlobalMouseUp);
  document.removeEventListener('mouseup', excelGlobalMouseUp);
  // добавляем
  table.addEventListener('mousedown', excelGlobalMouseDown);
  table.addEventListener('mousemove', excelGlobalMouseMove);
  table.addEventListener('mouseup', excelGlobalMouseUp);
  document.addEventListener('mouseup', excelGlobalMouseUp);
}

function excelGlobalMouseDown(e) {
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('ex-cell-')) return;
  const parts = cellEl.id.replace('ex-cell-', '').split('-');
  const tableId = parts[0];
  const rIdx = parseInt(parts[1]);
  const cIdx = parseInt(parts[2]);
  if (!EXCEL_ENGINE.tables[tableId]) return;
  e.preventDefault();
  EXCEL_ENGINE.isDragging = true;
  EXCEL_ENGINE.dragStart = { tableId, row: rIdx, col: cIdx };
  const sel = EXCEL_ENGINE.selections[tableId];
  sel.startRow = rIdx;
  sel.endRow = rIdx;
  sel.startCol = cIdx;
  sel.endCol = cIdx;
  EXCEL_ENGINE.activeCells[tableId].row = rIdx;
  EXCEL_ENGINE.activeCells[tableId].col = cIdx;
  excelRefreshSelectionVisuals(tableId);
}

function excelGlobalMouseMove(e) {
  if (!EXCEL_ENGINE.isDragging) return;
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('ex-cell-')) return;
  const parts = cellEl.id.replace('ex-cell-', '').split('-');
  const tableId = parts[0];
  const rIdx = parseInt(parts[1]);
  const cIdx = parseInt(parts[2]);
  if (!EXCEL_ENGINE.tables[tableId]) return;
  if (EXCEL_ENGINE.dragStart.tableId !== tableId) return;
  e.preventDefault();
  const startRow = EXCEL_ENGINE.dragStart.row;
  const startCol = EXCEL_ENGINE.dragStart.col;
  const sel = EXCEL_ENGINE.selections[tableId];
  sel.startRow = Math.min(startRow, rIdx);
  sel.endRow = Math.max(startRow, rIdx);
  sel.startCol = Math.min(startCol, cIdx);
  sel.endCol = Math.max(startCol, cIdx);
  excelRefreshSelectionVisuals(tableId);
}

function excelGlobalMouseUp(e) {
  if (EXCEL_ENGINE.isDragging) {
    EXCEL_ENGINE.isDragging = false;
    // не сбрасываем выделение
  }
}

// ================================================================
// РЕДАКТИРОВАНИЕ (BLUR, KEYDOWN)
// ================================================================

function excelHandleCellBlur(tableId, cellElement, rIdx, cIdx) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table || !EXCEL_ENGINE.editModes[tableId]) return;
  const newValue = cellElement.innerText.trim();
  const originalValue = String(table.data[rIdx][cIdx] || '').trim();
  if (table.formulas && table.formulas[cIdx]) {
    cellElement.innerText = table.formulas[cIdx](table.data[rIdx]);
    return;
  }
  if (newValue !== originalValue) {
    table.data[rIdx][cIdx] = newValue;
    if (!EXCEL_ENGINE.changesQueues[tableId]) EXCEL_ENGINE.changesQueues[tableId] = {};
    const key = rIdx+'_'+cIdx;
    EXCEL_ENGINE.changesQueues[tableId][key] = { row: rIdx, col: cIdx, value: newValue };
    cellElement.classList.add('cell-stock-dirty');
  } else {
    const key = rIdx+'_'+cIdx;
    if (EXCEL_ENGINE.changesQueues[tableId]) delete EXCEL_ENGINE.changesQueues[tableId][key];
    cellElement.classList.remove('cell-stock-dirty');
  }
}

function excelHandleCellKeyDown(tableId, event, rIdx, cIdx) {
  if (!EXCEL_ENGINE.editModes[tableId]) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    const nextCell = document.getElementById(`ex-cell-${tableId}-${rIdx+1}-${cIdx}`);
    if (nextCell) { nextCell.focus(); excelHandleCellClick(tableId, event, rIdx+1, cIdx); }
  }
}

// ================================================================
// СОРТИРОВКА, ФИЛЬТРАЦИЯ, СБРОС
// ================================================================

function excelSortByColumn(tableId, cIdx) {
  const sort = EXCEL_ENGINE.sorts[tableId];
  if (sort.column === cIdx) {
    if (sort.direction === 'asc') sort.direction = 'desc';
    else if (sort.direction === 'desc') { sort.column = null; sort.direction = null; }
  } else {
    sort.column = cIdx;
    sort.direction = 'asc';
  }
  excelRenderTable(tableId);
}

function excelSearch(tableId, term) {
  EXCEL_ENGINE.filters[tableId].search = term || '';
  excelRenderTable(tableId);
}

function excelResetFilters(tableId) {
  EXCEL_ENGINE.filters[tableId].search = '';
  EXCEL_ENGINE.sorts[tableId].column = null;
  EXCEL_ENGINE.sorts[tableId].direction = null;
  const input = document.getElementById(EXCEL_ENGINE.tables[tableId].searchInputId);
  if (input) input.value = '';
  excelRenderTable(tableId);
}

function excelToggleEditMode(tableId) {
  EXCEL_ENGINE.editModes[tableId] = !EXCEL_ENGINE.editModes[tableId];
  EXCEL_ENGINE.selections[tableId] = { startRow: null, startCol: null, endRow: null, endCol: null };
  EXCEL_ENGINE.activeCells[tableId] = { row: null, col: null };
  excelRenderTable(tableId);
}

// ================================================================
// СОХРАНЕНИЕ ИЗМЕНЕНИЙ
// ================================================================

function excelSaveChanges(tableId, saveCallback) {
  const changes = EXCEL_ENGINE.changesQueues[tableId] || {};
  const count = Object.keys(changes).length;
  if (count === 0) { alert('Нет изменений для сохранения.'); return; }
  const list = Object.values(changes);
  list.forEach(tx => {
    if (EXCEL_ENGINE.tables[tableId].data[tx.row]) {
      EXCEL_ENGINE.tables[tableId].data[tx.row][tx.col] = tx.value;
    }
  });
  if (saveCallback) saveCallback(tableId, list);
  EXCEL_ENGINE.changesQueues[tableId] = {};
  excelRenderTable(tableId);
}

// ================================================================
// КОПИРОВАНИЕ / ВСТАВКА (ГЛОБАЛЬНЫЕ)
// ================================================================

document.addEventListener('copy', function(e) {
  let activeId = null;
  for (let tid in EXCEL_ENGINE.tables) {
    const container = document.getElementById(EXCEL_ENGINE.tables[tid].containerId);
    if (container && container.contains(document.activeElement)) { activeId = tid; break; }
  }
  if (!activeId) return;
  const table = EXCEL_ENGINE.tables[activeId];
  const sel = EXCEL_ENGINE.selections[activeId];
  if (sel.startRow === null) return;
  const data = table.data;
  const { startRow, endRow, startCol, endCol } = sel;
  let copyData = [];
  for (let r = startRow; r <= endRow && r < data.length; r++) {
    if (!data[r]) continue;
    let row = [];
    for (let c = startCol; c <= endCol && c < data[r].length; c++) {
      row.push(data[r][c] !== undefined ? data[r][c] : '');
    }
    copyData.push(row);
  }
  const tsv = copyData.map(row => row.join('\t')).join('\n');
  e.clipboardData.setData('text/plain', tsv);
  e.preventDefault();
});

document.addEventListener('paste', function(e) {
  let activeId = null;
  for (let tid in EXCEL_ENGINE.tables) {
    const container = document.getElementById(EXCEL_ENGINE.tables[tid].containerId);
    if (container && container.contains(document.activeElement)) { activeId = tid; break; }
  }
  if (!activeId) return;
  const table = EXCEL_ENGINE.tables[activeId];
  if (!EXCEL_ENGINE.editModes[activeId]) return;
  const sel = EXCEL_ENGINE.selections[activeId];
  if (sel.startRow === null) return;
  const pasteData = e.clipboardData.getData('text/plain');
  if (!pasteData) return;
  e.preventDefault();
  const rows = pasteData.split('\n').filter(line => line.trim() !== '');
  const startR = sel.startRow;
  const startC = sel.startCol;
  let count = 0;
  rows.forEach((rowText, ri) => {
    const cells = rowText.split('\t');
    const targetR = startR + ri;
    if (targetR >= table.data.length) return;
    if (!table.data[targetR]) return;
    cells.forEach((cellVal, ci) => {
      const targetC = startC + ci;
      if (targetC >= table.data[targetR].length) return;
      if (table.formulas && table.formulas[targetC]) return;
      const val = cellVal.trim();
      table.data[targetR][targetC] = val;
      if (!EXCEL_ENGINE.changesQueues[activeId]) EXCEL_ENGINE.changesQueues[activeId] = {};
      const key = targetR+'_'+targetC;
      EXCEL_ENGINE.changesQueues[activeId][key] = { row: targetR, col: targetC, value: val };
      count++;
    });
  });
  excelRenderTable(activeId);
});

console.log('✅ excel_engine.js загружен');
