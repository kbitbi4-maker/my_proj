// ================================================================
// excel_core.js — УНИВЕРСАЛЬНЫЙ ДВИЖОК EXCEL-ТАБЛИЦ
// Версия 1.4 — выделение доступно всегда, зебра, перенос текста
// ================================================================

// ================================================================
// КОНФИГУРАЦИЯ ПО УМОЛЧАНИЮ
// ================================================================

const EXCEL_CORE = {
  selectedRange: { startRow: null, startCol: null, endRow: null, endCol: null },
  activeCell: { row: null, col: null },
  isDragging: false,
  dragStartRow: null,
  dragStartCol: null,
  sortColumn: null,
  sortDirection: null,
  filterColor: 'all',
  searchTerm: '',
  editMode: false,
  tables: {}
};

// ================================================================
// РЕГИСТРАЦИЯ ТАБЛИЦЫ
// ================================================================

function excelRegisterTable(tableId, config) {
  if (!EXCEL_CORE.tables) EXCEL_CORE.tables = {};
  
  EXCEL_CORE.tables[tableId] = {
    data: config.data || [],
    headers: config.headers || null,
    colCount: config.colCount || null,
    editMode: config.editMode || false,
    visibleColumns: config.visibleColumns || null,
    onRowClick: config.onRowClick || null,
    formulas: config.formulas || {},
    rowColors: config.rowColors || null,
    cellColors: config.cellColors || null,
    containerId: config.containerId || tableId,
    searchInputId: config.searchInputId || null,
    title: config.title || 'Таблица',
    searchTerm: '',
    // ВСЕГДА РАЗРЕШАЕМ ВЫДЕЛЕНИЕ (даже в режиме просмотра)
    allowSelection: true
  };
  
  return EXCEL_CORE.tables[tableId];
}

// ================================================================
// УНИВЕРСАЛЬНЫЙ РЕНДЕРИНГ
// ================================================================

function excelRenderTable(tableId) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) {
    console.error('Таблица не зарегистрирована:', tableId);
    return;
  }
  
  const data = table.data;
  if (!data || data.length === 0) {
    const bodyContainer = document.getElementById(table.containerId + '-body');
    if (bodyContainer) {
      bodyContainer.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:#999;">Нет данных</td></tr>';
    }
    return;
  }
  
  const headers = data[0] || [];
  const startRow = 1;
  const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const numCols = table.colCount || Math.max(headers.length, data[1] ? data[1].length : 1);
  
  const headContainer = document.getElementById(table.containerId + '-head');
  const bodyContainer = document.getElementById(table.containerId + '-body');
  if (!headContainer || !bodyContainer) {
    console.error('Контейнеры не найдены для таблицы:', tableId);
    return;
  }
  
  // ============================================================
  // ШАПКА (БУКВЫ, БЕЗ НОМЕРА)
  // ============================================================
  let headHtml = '';
  headHtml += '<tr>';
  headHtml += '<th class="excel-corner" onclick="excelSelectAll(\''+tableId+'\')" title="Выделить всё" style="min-width:40px;max-width:40px;width:40px;background:#e8e8e8!important;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;text-align:center;">⬚</th>';
  for (let c = 0; c < numCols; c++) {
    const letter = colLetters[c] || String.fromCharCode(65 + c);
    const sortIndicator = (EXCEL_CORE.sortColumn === c) ? (EXCEL_CORE.sortDirection === 'asc' ? ' ↑' : ' ↓') : '';
    headHtml += '<th id="col-hdr-'+c+'" onclick="excelSelectWholeColumn(\''+tableId+'\','+c+')" title="Сортировка по столбцу '+letter+'" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;white-space:normal;word-wrap:break-word;">'+letter+sortIndicator+'</th>';
  }
  headHtml += '</tr>';
  headContainer.innerHTML = headHtml;

  // ============================================================
  // СБОР ДАННЫХ
  // ============================================================
  let rowsData = [];
  for (let rIdx = startRow; rIdx < data.length; rIdx++) {
    const row = data[rIdx];
    if (!row || row.length === 0) continue;
    const searchTerm = table.searchTerm || '';
    if (searchTerm !== '') {
      const isMatch = row.some(function(cell) { return String(cell).toLowerCase().includes(searchTerm.toLowerCase()); });
      if (!isMatch) continue;
    }
    rowsData.push({ index: rIdx, data: row });
  }

  // Сортировка
  if (EXCEL_CORE.sortColumn !== null) {
    rowsData.sort(function(a, b) {
      var valA = String(a.data[EXCEL_CORE.sortColumn] || '').toLowerCase();
      var valB = String(b.data[EXCEL_CORE.sortColumn] || '').toLowerCase();
      var numA = parseFloat(valA.replace(/[^0-9.-]/g, ''));
      var numB = parseFloat(valB.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return EXCEL_CORE.sortDirection === 'asc' ? numA - numB : numB - numA;
      }
      if (valA < valB) return EXCEL_CORE.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return EXCEL_CORE.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // ============================================================
  // ТЕЛО ТАБЛИЦЫ
  // ============================================================
  let bodyHtml = "";
  
  // СТРОКА 1: НАЗВАНИЯ СТОЛБЦОВ (НОМЕР 1)
  bodyHtml += '<tr style="font-weight:600;background:#f0f0f0;">';
  bodyHtml += '<td class="row-header-num" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:default;min-width:40px;max-width:40px;width:40px;padding:4px 2px;">1</td>';
  for (let c = 0; c < numCols; c++) {
    const headerName = headers[c] !== undefined && headers[c] !== '' ? headers[c] : colLetters[c] || String.fromCharCode(65 + c);
    bodyHtml += '<td style="border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:40px;background:#f0f0f0;color:#333;font-weight:600;white-space:normal;word-wrap:break-word;word-break:break-word;">'+headerName+'</td>';
  }
  bodyHtml += '</tr>';

  // СТРОКИ 2...N: ДАННЫЕ (с зеброй)
  for (var ri = 0; ri < rowsData.length; ri++) {
    var rIdx = rowsData[ri].index;
    var row = rowsData[ri].data;
    var rowNum = ri + 2;

    // Цвет строки для таблицы отличий
    let rowColor = '';
    if (table.rowColors) {
      for (var colorKey in table.rowColors) {
        if (table.rowColors[colorKey](row)) {
          rowColor = colorKey;
          break;
        }
      }
    }

    var rowClickAttr = '';
    if (!table.editMode && table.onRowClick) {
      rowClickAttr = ' onclick="'+table.onRowClick+'('+rIdx+')" style="cursor:pointer;"';
    }

    // Зебра: чётные строки — белые, нечётные — зелёные (но только если нет rowColor)
    var zebraBg = '';
    if (!rowColor) {
      // ri — индекс в отфильтрованном массиве, начинается с 0
      // Строка 2 (ri=0) — зелёная, строка 3 (ri=1) — белая, строка 4 (ri=2) — зелёная...
      zebraBg = (ri % 2 === 0) ? 'background:#e8f5e9;' : 'background:#ffffff;';
    }

    bodyHtml += '<tr id="ex-row-'+rIdx+'"'+rowClickAttr+' style="'+(rowColor ? 'background:'+rowColor+';' : '')+'">';
    bodyHtml += '<td class="row-header-num" id="row-hdr-'+rIdx+'" onclick="excelSelectWholeRow(\''+tableId+'\',event,'+rIdx+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;width:40px;padding:4px 2px;">'+rowNum+'</td>';

    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      let displayValue = row[cIdx] !== undefined ? row[cIdx] : '';
      
      if (table.formulas && table.formulas[cIdx]) {
        displayValue = table.formulas[cIdx](row);
      }
      
      let cellBg = rowColor || zebraBg;
      if (table.cellColors) {
        for (var colorKey in table.cellColors) {
          if (table.cellColors[colorKey](row, cIdx, displayValue)) {
            cellBg = 'background-color:'+colorKey+';';
            break;
          }
        }
      }

      // Проверяем выделение (ВСЕГДА, даже в режиме просмотра)
      let isSelected = false;
      if (EXCEL_CORE.selectedRange.startRow !== null) {
        isSelected = (rIdx >= EXCEL_CORE.selectedRange.startRow && rIdx <= EXCEL_CORE.selectedRange.endRow &&
                      cIdx >= EXCEL_CORE.selectedRange.startCol && cIdx <= EXCEL_CORE.selectedRange.endCol);
      }

      const selectClass = isSelected ? 'cell-selected' : '';
      const bgStyle = cellBg ? cellBg : '';
      
      // В режиме редактирования — contenteditable, в режиме просмотра — обычный текст
      if (table.editMode) {
        bodyHtml += '<td id="ex-cell-'+rIdx+'-'+cIdx+'" class="'+selectClass+'" style="'+bgStyle+' border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:40px;white-space:normal;word-wrap:break-word;word-break:break-word;outline:none;" contenteditable="true" onclick="excelHandleCellClick(\''+tableId+'\',event,'+rIdx+','+cIdx+')" onblur="excelHandleCellBlur(\''+tableId+'\',this,'+rIdx+','+cIdx+')" onkeydown="excelHandleCellKeyDown(\''+tableId+'\',event,'+rIdx+','+cIdx+')" onmousedown="excelHandleMouseDown(\''+tableId+'\',event,'+rIdx+','+cIdx+')" onmouseover="excelHandleMouseOver(\''+tableId+'\',event,'+rIdx+','+cIdx+')">'+displayValue+'</td>';
      } else {
        bodyHtml += '<td id="ex-cell-'+rIdx+'-'+cIdx+'" class="'+selectClass+'" style="'+bgStyle+' border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:40px;white-space:normal;word-wrap:break-word;word-break:break-word;cursor:pointer;" onclick="excelHandleCellClick(\''+tableId+'\',event,'+rIdx+','+cIdx+')" onmousedown="excelHandleMouseDown(\''+tableId+'\',event,'+rIdx+','+cIdx+')" onmouseover="excelHandleMouseOver(\''+tableId+'\',event,'+rIdx+','+cIdx+')">'+displayValue+'</td>';
      }
    }
    bodyHtml += '</tr>';
  }
  
  bodyContainer.innerHTML = bodyHtml || '<tr><td colspan="'+(numCols+1)+'" style="text-align:center;padding:20px;color:#999;">Ничего не найдено</td></tr>';

  // Обновляем выделение (ВСЕГДА, даже в режиме просмотра)
  excelRefreshSelectionVisuals(tableId);
  
  // Drag-слушатели (ВСЕГДА, даже в режиме просмотра)
  excelAttachDragListeners(tableId);
}

// ================================================================
// ВЫДЕЛЕНИЕ ВСЕЙ ТАБЛИЦЫ
// ================================================================

function excelSelectAll(tableId) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  
  const data = table.data;
  if (!data || data.length <= 1) return;
  
  EXCEL_CORE.selectedRange.startRow = 1;
  EXCEL_CORE.selectedRange.endRow = data.length - 1;
  EXCEL_CORE.selectedRange.startCol = 0;
  EXCEL_CORE.selectedRange.endCol = (table.colCount || data[1].length) - 1;
  
  EXCEL_CORE.activeCell.row = 1;
  EXCEL_CORE.activeCell.col = 0;
  
  excelRefreshSelectionVisuals(tableId);
}

// ================================================================
// ВЫДЕЛЕНИЕ СТРОКИ
// ================================================================

function excelSelectWholeRow(tableId, event, rIdx) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  event.stopPropagation();
  
  const numCols = table.colCount || table.data[0].length;
  EXCEL_CORE.activeCell.row = rIdx;
  EXCEL_CORE.activeCell.col = 0;
  EXCEL_CORE.selectedRange.startRow = rIdx;
  EXCEL_CORE.selectedRange.endRow = rIdx;
  EXCEL_CORE.selectedRange.startCol = 0;
  EXCEL_CORE.selectedRange.endCol = numCols - 1;
  excelRefreshSelectionVisuals(tableId);
}

// ================================================================
// ВЫДЕЛЕНИЕ СТОЛБЦА
// ================================================================

function excelSelectWholeColumn(tableId, cIdx) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  
  const data = table.data;
  if (!data || data.length <= 1) return;
  
  EXCEL_CORE.activeCell.row = 1;
  EXCEL_CORE.activeCell.col = cIdx;
  EXCEL_CORE.selectedRange.startRow = 1;
  EXCEL_CORE.selectedRange.endRow = data.length - 1;
  EXCEL_CORE.selectedRange.startCol = cIdx;
  EXCEL_CORE.selectedRange.endCol = cIdx;
  
  excelRefreshSelectionVisuals(tableId);
}

// ================================================================
// ОБНОВЛЕНИЕ ВИЗУАЛЬНЫХ ВЫДЕЛЕНИЙ
// ================================================================

function excelRefreshSelectionVisuals(tableId) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  
  const container = document.getElementById(table.containerId);
  if (!container) return;
  
  // Снимаем старые выделения
  container.querySelectorAll('.cell-selected, .cell-active-focus, .row-selected, .col-selected')
    .forEach(function(el) {
      el.classList.remove('cell-selected', 'cell-active-focus', 'row-selected', 'col-selected');
    });
  
  // Снимаем подсветку заголовков столбцов
  const firstRow = container.querySelector('tr');
  if (firstRow) {
    const cells = firstRow.querySelectorAll('th');
    cells.forEach(function(el) {
      el.classList.remove('col-selected');
      el.style.background = '';
      el.style.borderBottom = '';
    });
  }
  
  if (EXCEL_CORE.selectedRange.startRow === null) return;
  
  // Подсвечиваем ячейки
  for (let r = EXCEL_CORE.selectedRange.startRow; r <= EXCEL_CORE.selectedRange.endRow; r++) {
    const rowHdr = document.getElementById('row-hdr-'+r);
    if (rowHdr) rowHdr.classList.add('row-selected');
    for (let c = EXCEL_CORE.selectedRange.startCol; c <= EXCEL_CORE.selectedRange.endCol; c++) {
      const cellEl = document.getElementById('ex-cell-'+r+'-'+c);
      if (cellEl) {
        cellEl.classList.add('cell-selected');
        if (r === EXCEL_CORE.activeCell.row && c === EXCEL_CORE.activeCell.col) {
          cellEl.classList.add('cell-active-focus');
        }
      }
    }
  }
  
  // Подсвечиваем заголовок активного столбца
  if (EXCEL_CORE.activeCell.col !== null) {
    const colIdx = EXCEL_CORE.activeCell.col;
    if (firstRow) {
      const cells = firstRow.querySelectorAll('th');
      if (cells[colIdx + 1]) {
        cells[colIdx + 1].classList.add('col-selected');
        cells[colIdx + 1].style.background = '#c7e0f4';
        cells[colIdx + 1].style.borderBottom = '3px solid #2b5797';
      }
    }
  }
}

// ================================================================
// DRAG SELECTION
// ================================================================

function excelAttachDragListeners(tableId) {
  const container = document.getElementById(EXCEL_CORE.tables[tableId].containerId);
  const table = container ? container.querySelector('table') : null;
  if (!table) return;
  
  table.removeEventListener('mousedown', excelGlobalMouseDown);
  table.removeEventListener('mousemove', excelGlobalMouseMove);
  table.removeEventListener('mouseup', excelGlobalMouseUp);
  table.removeEventListener('mouseleave', excelGlobalMouseLeave);
  document.removeEventListener('mouseup', excelGlobalMouseUp);
  
  table.addEventListener('mousedown', function(e) { excelGlobalMouseDown(e, tableId); });
  table.addEventListener('mousemove', function(e) { excelGlobalMouseMove(e, tableId); });
  table.addEventListener('mouseup', function(e) { excelGlobalMouseUp(e, tableId); });
  table.addEventListener('mouseleave', function(e) { excelGlobalMouseLeave(e, tableId); });
  document.addEventListener('mouseup', function(e) { excelGlobalMouseUp(e, tableId); });
}

function excelGlobalMouseDown(e, tableId) {
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('ex-cell-')) return;
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  
  const parts = cellEl.id.replace('ex-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  EXCEL_CORE.isDragging = true;
  EXCEL_CORE.dragStartRow = rIdx;
  EXCEL_CORE.dragStartCol = cIdx;
  EXCEL_CORE.activeCell.row = rIdx;
  EXCEL_CORE.activeCell.col = cIdx;
  EXCEL_CORE.selectedRange.startRow = rIdx;
  EXCEL_CORE.selectedRange.endRow = rIdx;
  EXCEL_CORE.selectedRange.startCol = cIdx;
  EXCEL_CORE.selectedRange.endCol = cIdx;
  excelRefreshSelectionVisuals(tableId);
}

function excelGlobalMouseMove(e, tableId) {
  if (!EXCEL_CORE.isDragging) return;
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('ex-cell-')) return;
  
  const parts = cellEl.id.replace('ex-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  EXCEL_CORE.selectedRange.startRow = Math.min(EXCEL_CORE.dragStartRow, rIdx);
  EXCEL_CORE.selectedRange.endRow = Math.max(EXCEL_CORE.dragStartRow, rIdx);
  EXCEL_CORE.selectedRange.startCol = Math.min(EXCEL_CORE.dragStartCol, cIdx);
  EXCEL_CORE.selectedRange.endCol = Math.max(EXCEL_CORE.dragStartCol, cIdx);
  excelRefreshSelectionVisuals(tableId);
}

function excelGlobalMouseUp(e, tableId) {
  if (EXCEL_CORE.isDragging) {
    EXCEL_CORE.isDragging = false;
    if (EXCEL_CORE.selectedRange.startRow === EXCEL_CORE.selectedRange.endRow &&
        EXCEL_CORE.selectedRange.startCol === EXCEL_CORE.selectedRange.endCol) {
      EXCEL_CORE.activeCell.row = EXCEL_CORE.selectedRange.startRow;
      EXCEL_CORE.activeCell.col = EXCEL_CORE.selectedRange.startCol;
    }
    excelRefreshSelectionVisuals(tableId);
  }
}

function excelGlobalMouseLeave(e, tableId) {
  if (EXCEL_CORE.isDragging) {
    EXCEL_CORE.isDragging = false;
    excelRefreshSelectionVisuals(tableId);
  }
}

// ================================================================
// КЛИК ПО ЯЧЕЙКЕ (ВЫДЕЛЕНИЕ)
// ================================================================

function excelHandleCellClick(tableId, event, rIdx, cIdx) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  if (EXCEL_CORE.isDragging) return;
  
  if (event.shiftKey && EXCEL_CORE.activeCell.row !== null && EXCEL_CORE.activeCell.col !== null) {
    EXCEL_CORE.selectedRange.startRow = Math.min(EXCEL_CORE.activeCell.row, rIdx);
    EXCEL_CORE.selectedRange.endRow = Math.max(EXCEL_CORE.activeCell.row, rIdx);
    EXCEL_CORE.selectedRange.startCol = Math.min(EXCEL_CORE.activeCell.col, cIdx);
    EXCEL_CORE.selectedRange.endCol = Math.max(EXCEL_CORE.activeCell.col, cIdx);
  } else {
    EXCEL_CORE.activeCell.row = rIdx;
    EXCEL_CORE.activeCell.col = cIdx;
    EXCEL_CORE.selectedRange.startRow = rIdx;
    EXCEL_CORE.selectedRange.endRow = rIdx;
    EXCEL_CORE.selectedRange.startCol = cIdx;
    EXCEL_CORE.selectedRange.endCol = cIdx;
  }
  excelRefreshSelectionVisuals(tableId);
  const cellEl = document.getElementById('ex-cell-'+rIdx+'-'+cIdx);
  if (cellEl) {
    cellEl.classList.add('cell-active-focus');
    if (table.editMode) {
      cellEl.focus();
    }
  }
}

// ================================================================
// ОСТАЛЬНЫЕ ФУНКЦИИ
// ================================================================

function excelHandleMouseDown(tableId, event, rIdx, cIdx) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  const cellEl = document.getElementById('ex-cell-'+rIdx+'-'+cIdx);
  if (cellEl && table.editMode) {
    cellEl.focus();
  }
}

function excelHandleMouseOver(tableId, event, rIdx, cIdx) {}

function excelHandleCellBlur(tableId, cellElement, rIdx, cIdx) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table || !table.editMode) return;
  cellElement.classList.remove('cell-active-focus');
  
  const newValue = cellElement.innerText.trim();
  const originalValue = String(table.data[rIdx][cIdx] || '').trim();
  
  if (table.formulas && table.formulas[cIdx]) {
    const computedValue = table.formulas[cIdx](table.data[rIdx]);
    cellElement.innerText = computedValue;
    return;
  }
  
  if (newValue !== originalValue) {
    table.data[rIdx][cIdx] = newValue;
    cellElement.classList.add('cell-stock-dirty');
    if (!window.stockChangesQueue) window.stockChangesQueue = {};
    const cellKey = rIdx+'_'+cIdx;
    window.stockChangesQueue[cellKey] = { row: rIdx, col: cIdx, value: newValue };
  } else {
    cellElement.classList.remove('cell-stock-dirty');
    const cellKey = rIdx+'_'+cIdx;
    if (window.stockChangesQueue) delete window.stockChangesQueue[cellKey];
  }
  
  if (table.formulas) {
    for (var fIdx in table.formulas) {
      if (parseInt(fIdx) !== cIdx) {
        const cellEl = document.getElementById('ex-cell-'+rIdx+'-'+fIdx);
        if (cellEl) {
          const computedValue = table.formulas[fIdx](table.data[rIdx]);
          cellEl.innerText = computedValue;
        }
      }
    }
  }
}

function excelHandleCellKeyDown(tableId, event, rIdx, cIdx) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table || !table.editMode) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    const nextCell = document.getElementById('ex-cell-'+(rIdx+1)+'-'+cIdx);
    if (nextCell) {
      nextCell.focus();
      excelHandleCellClick(tableId, event, rIdx + 1, cIdx);
    }
  }
}

function excelSortByColumn(tableId, cIdx) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  
  if (EXCEL_CORE.sortColumn === cIdx) {
    if (EXCEL_CORE.sortDirection === 'asc') {
      EXCEL_CORE.sortDirection = 'desc';
    } else if (EXCEL_CORE.sortDirection === 'desc') {
      EXCEL_CORE.sortColumn = null;
      EXCEL_CORE.sortDirection = null;
    }
  } else {
    EXCEL_CORE.sortColumn = cIdx;
    EXCEL_CORE.sortDirection = 'asc';
  }
  
  excelRenderTable(tableId);
}

function excelResetFilters(tableId) {
  EXCEL_CORE.sortColumn = null;
  EXCEL_CORE.sortDirection = null;
  EXCEL_CORE.filterColor = 'all';
  if (EXCEL_CORE.tables[tableId]) {
    EXCEL_CORE.tables[tableId].searchTerm = '';
    const searchInput = document.getElementById(EXCEL_CORE.tables[tableId].searchInputId);
    if (searchInput) searchInput.value = '';
  }
  excelRenderTable(tableId);
}

function excelSearch(tableId, term) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  table.searchTerm = term || '';
  excelRenderTable(tableId);
}

function excelToggleEditMode(tableId) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  table.editMode = !table.editMode;
  EXCEL_CORE.selectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  EXCEL_CORE.activeCell = { row: null, col: null };
  excelRenderTable(tableId);
}

function excelUpdateData(tableId, newData) {
  const table = EXCEL_CORE.tables[tableId];
  if (!table) return;
  table.data = newData;
  excelRenderTable(tableId);
}

// ================================================================
// КОПИРОВАНИЕ (Ctrl+C)
// ================================================================

document.addEventListener('copy', function(e) {
  let activeTableId = null;
  for (var tid in EXCEL_CORE.tables) {
    const container = document.getElementById(EXCEL_CORE.tables[tid].containerId);
    if (container && container.contains(document.activeElement)) {
      activeTableId = tid;
      break;
    }
  }
  if (!activeTableId) return;
  
  const table = EXCEL_CORE.tables[activeTableId];
  if (!table) return;
  if (EXCEL_CORE.selectedRange.startRow === null) return;
  
  const { startRow, endRow, startCol, endCol } = EXCEL_CORE.selectedRange;
  let copyData = [];
  for (let r = startRow; r <= endRow && r < table.data.length; r++) {
    let rowCopy = [];
    for (let c = startCol; c <= endCol && c < (table.data[r] || []).length; c++) {
      rowCopy.push(table.data[r][c] !== undefined ? table.data[r][c] : '');
    }
    copyData.push(rowCopy);
  }
  const tsvText = copyData.map(function(row) { return row.join('\t'); }).join('\n');
  e.clipboardData.setData('text/plain', tsvText);
  e.preventDefault();
});

// ================================================================
// ВСТАВКА (Ctrl+V)
// ================================================================

document.addEventListener('paste', function(e) {
  let activeTableId = null;
  for (var tid in EXCEL_CORE.tables) {
    const container = document.getElementById(EXCEL_CORE.tables[tid].containerId);
    if (container && container.contains(document.activeElement)) {
      activeTableId = tid;
      break;
    }
  }
  if (!activeTableId) return;
  
  const table = EXCEL_CORE.tables[activeTableId];
  if (!table || !table.editMode) return;
  if (EXCEL_CORE.selectedRange.startRow === null) return;
  
  const pasteData = e.clipboardData.getData('text/plain');
  if (!pasteData) return;
  e.preventDefault();
  
  const rows = pasteData.split('\n').filter(function(line) { return line.trim() !== ''; });
  const startR = EXCEL_CORE.selectedRange.startRow;
  const startC = EXCEL_CORE.selectedRange.startCol;
  
  rows.forEach(function(rowText, rIdx) {
    const cells = rowText.split('\t');
    const targetR = startR + rIdx;
    if (targetR >= table.data.length) return;
    cells.forEach(function(cellValue, cIdx) {
      const targetC = startC + cIdx;
      if (targetC >= (table.data[targetR] || []).length) return;
      if (table.formulas && table.formulas[targetC]) return;
      const trimmedVal = cellValue.trim();
      table.data[targetR][targetC] = trimmedVal;
      if (!window.stockChangesQueue) window.stockChangesQueue = {};
      const cellKey = targetR+'_'+targetC;
      window.stockChangesQueue[cellKey] = { row: targetR, col: targetC, value: trimmedVal };
    });
  });
  excelRenderTable(activeTableId);
});

console.log('✅ excel_core.js — загружен (версия 1.4)');
