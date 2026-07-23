// ================================================================
// excel_engine.js — ЕДИНЫЙ УНИВЕРСАЛЬНЫЙ ДВИЖОК EXCEL-ТАБЛИЦ
// Версия 1.0 — рендеринг, выделение, drag, copy/paste, сортировка, фильтрация
// ================================================================

// ================================================================
// КОНФИГУРАЦИЯ ПО УМОЛЧАНИЮ
// ================================================================

const EXCEL_ENGINE = {
  // Зарегистрированные таблицы
  tables: {},
  
  // Состояние выделения для каждой таблицы
  selections: {},
  
  // Состояние сортировки для каждой таблицы
  sorts: {},
  
  // Состояние фильтрации для каждой таблицы
  filters: {},
  
  // Текущий режим редактирования для каждой таблицы
  editModes: {},
  
  // Очереди изменений для каждой таблицы
  changesQueues: {},
  
  // Активные ячейки для каждой таблицы
  activeCells: {},
  
  // Флаг перетаскивания
  isDragging: false,
  dragStart: null,
};

// ================================================================
// РЕГИСТРАЦИЯ ТАБЛИЦЫ
// ================================================================

function excelRegisterTable(tableId, config) {
  // Конфигурация по умолчанию
  const defaultConfig = {
    data: [],               // Массив данных (первая строка — названия, остальные — данные)
    headers: null,          // Если указаны — используются как названия, иначе берутся из data[0]
    colCount: null,         // Количество столбцов (если null — вычисляется)
    containerId: tableId,   // ID контейнера для рендеринга (tableId + '-head' и tableId + '-body')
    searchInputId: null,    // ID поля поиска
    title: 'Таблица',       // Название
    editMode: false,        // Режим редактирования (по умолчанию выключен)
    onRowClick: null,       // Функция при клике на строку (в режиме просмотра)
    rowColors: null,        // Цвета строк: { '#dcfce7': function(row) { return ... } }
    formulas: {},           // Формулы: { colIndex: function(row) { return value; } }
    cellColors: null,       // Цвета ячеек: { 'color': function(row, col, value) { return ... } }
    isBalanceTable: false,  // Флаг для специальной обработки
  };

  // Сливаем конфигурации
  const mergedConfig = Object.assign({}, defaultConfig, config);
  
  // Сохраняем данные отдельно (для быстрого доступа)
  EXCEL_ENGINE.tables[tableId] = mergedConfig;
  
  // Инициализируем состояния
  EXCEL_ENGINE.selections[tableId] = { startRow: null, startCol: null, endRow: null, endCol: null };
  EXCEL_ENGINE.sorts[tableId] = { column: null, direction: null };
  EXCEL_ENGINE.filters[tableId] = { color: 'all', search: '' };
  EXCEL_ENGINE.editModes[tableId] = mergedConfig.editMode || false;
  EXCEL_ENGINE.changesQueues[tableId] = {};
  EXCEL_ENGINE.activeCells[tableId] = { row: null, col: null };
  
  console.log('✅ Таблица зарегистрирована:', tableId);
  return mergedConfig;
}

// ================================================================
// ОБНОВЛЕНИЕ ДАННЫХ ТАБЛИЦЫ
// ================================================================

function excelUpdateData(tableId, newData) {
  if (!EXCEL_ENGINE.tables[tableId]) {
    console.error('❌ Таблица не зарегистрирована:', tableId);
    return;
  }
  EXCEL_ENGINE.tables[tableId].data = newData;
  excelRenderTable(tableId);
}

// ================================================================
// УНИВЕРСАЛЬНЫЙ РЕНДЕРИНГ
// ================================================================

function excelRenderTable(tableId) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) {
    console.error('❌ Таблица не зарегистрирована:', tableId);
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

  // Определяем названия столбцов (первая строка данных или из конфига)
  let headers = table.headers || data[0] || [];
  // Если headers не передан, а data[0] есть — используем его как названия
  const hasHeaders = !!(table.headers || data[0]);
  const dataStartIndex = hasHeaders ? 1 : 0;
  
  // Если headers не заданы явно, но data[0] есть — берём их оттуда
  if (!table.headers && data[0]) {
    headers = data[0];
  }

  const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const numCols = table.colCount || Math.max(headers.length, data[dataStartIndex] ? data[dataStartIndex].length : 1);

  // Получаем контейнеры
  const headContainer = document.getElementById(table.containerId + '-head');
  const bodyContainer = document.getElementById(table.containerId + '-body');
  if (!headContainer || !bodyContainer) {
    console.error('❌ Контейнеры не найдены для таблицы:', tableId);
    return;
  }

  // ============================================================
  // ШАПКА: ТОЛЬКО БУКВЫ (БЕЗ НОМЕРА)
  // ============================================================
  let headHtml = '';
  headHtml += '<tr>';
  headHtml += '<th class="excel-corner" onclick="excelSelectAll(\''+tableId+'\')" title="Выделить всё" style="min-width:40px;max-width:40px;width:40px;background:#e8e8e8!important;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;text-align:center;user-select:none;">⬚</th>';
  for (let c = 0; c < numCols; c++) {
    const letter = colLetters[c] || String.fromCharCode(65 + c);
    const sortIndicator = (EXCEL_ENGINE.sorts[tableId].column === c) 
      ? (EXCEL_ENGINE.sorts[tableId].direction === 'asc' ? ' ↑' : ' ↓') : '';
    headHtml += '<th id="col-hdr-'+tableId+'-'+c+'" onclick="excelSortByColumn(\''+tableId+'\','+c+')" title="Сортировка по столбцу '+letter+'" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;white-space:normal;word-wrap:break-word;">'+letter+sortIndicator+'</th>';
  }
  headHtml += '</tr>';
  headContainer.innerHTML = headHtml;

  // ============================================================
  // ТЕЛО: СТРОКА 1 — НАЗВАНИЯ (ЕСЛИ ЕСТЬ), ДАЛЕЕ ДАННЫЕ
  // ============================================================
  
  // Собираем все строки для тела
  let allRows = [];
  
  // Если есть названия — добавляем их как первую строку (номер 1)
  if (hasHeaders) {
    allRows.push({ index: 0, data: headers, isHeader: true });
  }
  
  // Добавляем остальные строки (данные)
  for (let i = dataStartIndex; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;
    // Применяем поиск
    const searchTerm = EXCEL_ENGINE.filters[tableId].search || '';
    if (searchTerm !== '') {
      const isMatch = row.some(function(cell) { return String(cell).toLowerCase().includes(searchTerm.toLowerCase()); });
      if (!isMatch) continue;
    }
    allRows.push({ index: i, data: row, isHeader: false });
  }

  // Применяем сортировку (только к данным, не к заголовкам)
  const sortCol = EXCEL_ENGINE.sorts[tableId].column;
  const sortDir = EXCEL_ENGINE.sorts[tableId].direction;
  if (sortCol !== null && sortDir !== null) {
    // Отделяем заголовки (isHeader === true) от данных
    const headerRows = allRows.filter(r => r.isHeader);
    const dataRows = allRows.filter(r => !r.isHeader);
    
    dataRows.sort(function(a, b) {
      var valA = String(a.data[sortCol] || '').toLowerCase();
      var valB = String(b.data[sortCol] || '').toLowerCase();
      var numA = parseFloat(valA.replace(/[^0-9.-]/g, ''));
      var numB = parseFloat(valB.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDir === 'asc' ? numA - numB : numB - numA;
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    
    // Собираем обратно: заголовки + отсортированные данные
    allRows = headerRows.concat(dataRows);
  }

  let bodyHtml = "";
  
  for (var ri = 0; ri < allRows.length; ri++) {
    var rowData = allRows[ri];
    var rIdx = rowData.index; // Индекс в массиве данных (для идентификации ячеек)
    var row = rowData.data;
    var isHeader = rowData.isHeader || false;
    // Номер строки: для первой строки (заголовки) номер = 1, для остальных = ri (индекс в отфильтрованном массиве)
    var rowNum = ri + 1;

    // Определяем цвет строки (только для данных, не для заголовков)
    let rowColor = '';
    if (!isHeader && table.rowColors) {
      for (var colorKey in table.rowColors) {
        if (table.rowColors[colorKey](row)) {
          rowColor = colorKey;
          break;
        }
      }
    }

    // Зебра: для заголовков — серый фон, для данных — зебра (если нет rowColor)
    var bgStyle = '';
    if (isHeader) {
      bgStyle = 'background:#f0f0f0;';
    } else if (rowColor) {
      bgStyle = 'background:'+rowColor+';';
    } else {
      // Зебра: чётные строки (начиная с 0) — зелёные, нечётные — белые
      // Но первая строка данных — это индекс ri=1 (заголовки занимают ri=0)
      // Поэтому для данных: ri=1 (первая запись) — зелёная, ri=2 — белая, ri=3 — зелёная...
      bgStyle = (ri % 2 === 1) ? 'background:#e8f5e9;' : 'background:#ffffff;';
    }

    // Проверяем выделение строки
    const selection = EXCEL_ENGINE.selections[tableId];
    let isRowSelected = false;
    if (selection.startRow !== null) {
      // Используем rIdx для сравнения (индекс в массиве данных)
      isRowSelected = (rIdx >= selection.startRow && rIdx <= selection.endRow);
    }

    // Добавляем обработчик клика по строке (если задан и не в режиме редактирования)
    var rowClickAttr = '';
    if (!EXCEL_ENGINE.editModes[tableId] && table.onRowClick) {
      rowClickAttr = ' onclick="'+table.onRowClick+'('+rIdx+')" style="cursor:pointer;"';
    }

    bodyHtml += '<tr id="ex-row-'+tableId+'-'+rIdx+'"'+rowClickAttr+' style="'+bgStyle+'">';
    bodyHtml += '<td class="row-header-num" id="row-hdr-'+tableId+'-'+rIdx+'" onclick="excelSelectWholeRow(\''+tableId+'\','+rIdx+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;width:40px;padding:4px 2px;'+(isRowSelected ? 'background:#c7e0f4;' : '')+'">'+rowNum+'</td>';

    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      let displayValue = row[cIdx] !== undefined ? row[cIdx] : '';
      
      // Применяем формулы (только для данных, не для заголовков)
      if (!isHeader && table.formulas && table.formulas[cIdx]) {
        displayValue = table.formulas[cIdx](row);
      }
      
      // Проверяем выделение ячейки
      let isSelected = false;
      if (selection.startRow !== null) {
        isSelected = (rIdx >= selection.startRow && rIdx <= selection.endRow &&
                      cIdx >= selection.startCol && cIdx <= selection.endCol);
      }

      const selectClass = isSelected ? 'cell-selected' : '';
      const isActive = (EXCEL_ENGINE.activeCells[tableId].row === rIdx && 
                        EXCEL_ENGINE.activeCells[tableId].col === cIdx);
      const activeClass = isActive ? 'cell-active-focus' : '';
      
      // Для заголовков — не редактируем
      const isEditable = EXCEL_ENGINE.editModes[tableId] && !isHeader;
      
      // Добавляем обработчики событий
      const clickHandler = 'onclick="excelHandleCellClick(\''+tableId+'\',event,'+rIdx+','+cIdx+')"';
      const mouseDownHandler = 'onmousedown="excelHandleMouseDown(\''+tableId+'\',event,'+rIdx+','+cIdx+')"';
      const mouseOverHandler = 'onmouseover="excelHandleMouseOver(\''+tableId+'\',event,'+rIdx+','+cIdx+')"';
      const blurHandler = isEditable ? 'onblur="excelHandleCellBlur(\''+tableId+'\',this,'+rIdx+','+cIdx+')"' : '';
      const keyDownHandler = isEditable ? 'onkeydown="excelHandleCellKeyDown(\''+tableId+'\',event,'+rIdx+','+cIdx+')"' : '';
      const contentEditableAttr = isEditable ? 'contenteditable="true"' : '';
      
      // Стиль ячейки
      let cellStyle = bgStyle + ' border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:60px;white-space:normal;word-wrap:break-word;word-break:break-word;' + (isEditable ? 'outline:none;' : '') + 'user-select:none;';
      if (isHeader) {
        cellStyle += 'font-weight:600;background:#f0f0f0;color:#333;';
      }
      if (rowColor && !isHeader) {
        // цвет уже задан через bgStyle
      }

      bodyHtml += '<td id="ex-cell-'+tableId+'-'+rIdx+'-'+cIdx+'" class="'+selectClass+' '+activeClass+'" style="'+cellStyle+'" '+contentEditableAttr+' '+clickHandler+' '+mouseDownHandler+' '+mouseOverHandler+' '+blurHandler+' '+keyDownHandler+'>'+displayValue+'</td>';
    }
    bodyHtml += '</tr>';
  }
  
  bodyContainer.innerHTML = bodyHtml || '<tr><td colspan="'+(numCols+1)+'" style="text-align:center;padding:20px;color:#999;">Ничего не найдено</td></tr>';

  // Обновляем выделение
  excelRefreshSelectionVisuals(tableId);
  excelAttachDragListeners(tableId);
}

// ================================================================
// ВЫДЕЛЕНИЕ (УНИВЕРСАЛЬНОЕ)
// ================================================================

function excelSelectAll(tableId) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  
  const data = table.data;
  if (!data || data.length === 0) return;
  
  const lastRow = data.length - 1;
  const numCols = table.colCount || data[0].length;
  
  EXCEL_ENGINE.selections[tableId].startRow = 0;
  EXCEL_ENGINE.selections[tableId].endRow = lastRow;
  EXCEL_ENGINE.selections[tableId].startCol = 0;
  EXCEL_ENGINE.selections[tableId].endCol = numCols - 1;
  
  EXCEL_ENGINE.activeCells[tableId].row = 0;
  EXCEL_ENGINE.activeCells[tableId].col = 0;
  
  excelRefreshSelectionVisuals(tableId);
}

function excelSelectWholeRow(tableId, rIdx) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  
  const numCols = table.colCount || table.data[0].length;
  EXCEL_ENGINE.selections[tableId].startRow = rIdx;
  EXCEL_ENGINE.selections[tableId].endRow = rIdx;
  EXCEL_ENGINE.selections[tableId].startCol = 0;
  EXCEL_ENGINE.selections[tableId].endCol = numCols - 1;
  
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
  EXCEL_ENGINE.selections[tableId].startRow = 0;
  EXCEL_ENGINE.selections[tableId].endRow = lastRow;
  EXCEL_ENGINE.selections[tableId].startCol = cIdx;
  EXCEL_ENGINE.selections[tableId].endCol = cIdx;
  
  EXCEL_ENGINE.activeCells[tableId].row = 0;
  EXCEL_ENGINE.activeCells[tableId].col = cIdx;
  
  excelRefreshSelectionVisuals(tableId);
}

function excelHandleCellClick(tableId, event, rIdx, cIdx) {
  if (EXCEL_ENGINE.isDragging) return;
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  
  const selection = EXCEL_ENGINE.selections[tableId];
  
  if (event.shiftKey && selection.startRow !== null) {
    selection.startRow = Math.min(selection.startRow, rIdx);
    selection.endRow = Math.max(selection.endRow, rIdx);
    selection.startCol = Math.min(selection.startCol, cIdx);
    selection.endCol = Math.max(selection.endCol, cIdx);
  } else {
    selection.startRow = rIdx;
    selection.endRow = rIdx;
    selection.startCol = cIdx;
    selection.endCol = cIdx;
  }
  
  EXCEL_ENGINE.activeCells[tableId].row = rIdx;
  EXCEL_ENGINE.activeCells[tableId].col = cIdx;
  
  excelRefreshSelectionVisuals(tableId);
  
  if (EXCEL_ENGINE.editModes[tableId]) {
    const cellEl = document.getElementById('ex-cell-'+tableId+'-'+rIdx+'-'+cIdx);
    if (cellEl) cellEl.focus();
  }
}

function excelHandleMouseDown(tableId, event, rIdx, cIdx) {
  event.preventDefault();
  EXCEL_ENGINE.isDragging = true;
  EXCEL_ENGINE.dragStart = { tableId: tableId, row: rIdx, col: cIdx };
  EXCEL_ENGINE.selections[tableId].startRow = rIdx;
  EXCEL_ENGINE.selections[tableId].endRow = rIdx;
  EXCEL_ENGINE.selections[tableId].startCol = cIdx;
  EXCEL_ENGINE.selections[tableId].endCol = cIdx;
  EXCEL_ENGINE.activeCells[tableId].row = rIdx;
  EXCEL_ENGINE.activeCells[tableId].col = cIdx;
  excelRefreshSelectionVisuals(tableId);
}

function excelHandleMouseOver(tableId, event, rIdx, cIdx) {
  if (!EXCEL_ENGINE.isDragging) return;
  if (EXCEL_ENGINE.dragStart.tableId !== tableId) return;
  
  const startRow = EXCEL_ENGINE.dragStart.row;
  const startCol = EXCEL_ENGINE.dragStart.col;
  EXCEL_ENGINE.selections[tableId].startRow = Math.min(startRow, rIdx);
  EXCEL_ENGINE.selections[tableId].endRow = Math.max(startRow, rIdx);
  EXCEL_ENGINE.selections[tableId].startCol = Math.min(startCol, cIdx);
  EXCEL_ENGINE.selections[tableId].endCol = Math.max(startCol, cIdx);
  excelRefreshSelectionVisuals(tableId);
}

// ================================================================
// ОБНОВЛЕНИЕ ВИЗУАЛЬНЫХ ВЫДЕЛЕНИЙ
// ================================================================

function excelRefreshSelectionVisuals(tableId) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  
  const container = document.getElementById(table.containerId);
  if (!container) return;
  
  // Снимаем старые выделения
  container.querySelectorAll('.cell-selected, .cell-active-focus, .row-selected, .col-selected')
    .forEach(function(el) {
      el.classList.remove('cell-selected', 'cell-active-focus', 'row-selected', 'col-selected');
      el.style.background = '';
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.borderBottom = '';
    });
  
  // Снимаем подсветку заголовков (первая строка шапки — буквы)
  const headRow = document.querySelector('#'+table.containerId+'-head tr:first-child');
  if (headRow) {
    const cells = headRow.querySelectorAll('th');
    cells.forEach(function(el) {
      el.style.background = '';
      el.style.borderBottom = '';
    });
  }
  
  const selection = EXCEL_ENGINE.selections[tableId];
  if (selection.startRow === null) return;
  
  // Подсвечиваем ячейки
  for (let r = selection.startRow; r <= selection.endRow; r++) {
    const rowHdr = document.getElementById('row-hdr-'+tableId+'-'+r);
    if (rowHdr) {
      rowHdr.classList.add('row-selected');
      rowHdr.style.background = '#c7e0f4';
    }
    for (let c = selection.startCol; c <= selection.endCol; c++) {
      const cellEl = document.getElementById('ex-cell-'+tableId+'-'+r+'-'+c);
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
  
  // Подсвечиваем заголовок столбца (первая строка шапки — буквы)
  if (headRow) {
    const cells = headRow.querySelectorAll('th');
    if (cells[selection.startCol + 1]) {
      cells[selection.startCol + 1].style.background = '#c7e0f4';
      cells[selection.startCol + 1].style.borderBottom = '3px solid #2b5797';
    }
  }
}

// ================================================================
// DRAG LISTENERS (ГЛОБАЛЬНЫЕ)
// ================================================================

function excelAttachDragListeners(tableId) {
  const container = document.getElementById(EXCEL_ENGINE.tables[tableId].containerId);
  const table = container ? container.querySelector('table') : null;
  if (!table) return;
  
  // Удаляем старые слушатели, чтобы не накапливались
  table.removeEventListener('mousedown', excelGlobalMouseDown);
  table.removeEventListener('mousemove', excelGlobalMouseMove);
  table.removeEventListener('mouseup', excelGlobalMouseUp);
  document.removeEventListener('mouseup', excelGlobalMouseUp);
  
  // Добавляем новые
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
  EXCEL_ENGINE.dragStart = { tableId: tableId, row: rIdx, col: cIdx };
  EXCEL_ENGINE.selections[tableId].startRow = rIdx;
  EXCEL_ENGINE.selections[tableId].endRow = rIdx;
  EXCEL_ENGINE.selections[tableId].startCol = cIdx;
  EXCEL_ENGINE.selections[tableId].endCol = cIdx;
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
  EXCEL_ENGINE.selections[tableId].startRow = Math.min(startRow, rIdx);
  EXCEL_ENGINE.selections[tableId].endRow = Math.max(startRow, rIdx);
  EXCEL_ENGINE.selections[tableId].startCol = Math.min(startCol, cIdx);
  EXCEL_ENGINE.selections[tableId].endCol = Math.max(startCol, cIdx);
  excelRefreshSelectionVisuals(tableId);
}

function excelGlobalMouseUp(e) {
  if (EXCEL_ENGINE.isDragging) {
    EXCEL_ENGINE.isDragging = false;
    // Не сбрасываем выделение, оставляем последний диапазон
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
  
  // Если есть формула для этого столбца — не сохраняем, пересчитываем
  if (table.formulas && table.formulas[cIdx]) {
    const computedValue = table.formulas[cIdx](table.data[rIdx]);
    cellElement.innerText = computedValue;
    return;
  }
  
  if (newValue !== originalValue) {
    table.data[rIdx][cIdx] = newValue;
    // Добавляем в очередь изменений
    if (!EXCEL_ENGINE.changesQueues[tableId]) EXCEL_ENGINE.changesQueues[tableId] = {};
    const cellKey = rIdx+'_'+cIdx;
    EXCEL_ENGINE.changesQueues[tableId][cellKey] = { row: rIdx, col: cIdx, value: newValue };
    cellElement.classList.add('cell-stock-dirty');
  } else {
    const cellKey = rIdx+'_'+cIdx;
    if (EXCEL_ENGINE.changesQueues[tableId]) {
      delete EXCEL_ENGINE.changesQueues[tableId][cellKey];
    }
    cellElement.classList.remove('cell-stock-dirty');
  }
}

function excelHandleCellKeyDown(tableId, event, rIdx, cIdx) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table || !EXCEL_ENGINE.editModes[tableId]) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    const nextCell = document.getElementById('ex-cell-'+tableId+'-'+(rIdx+1)+'-'+cIdx);
    if (nextCell) {
      nextCell.focus();
      excelHandleCellClick(tableId, event, rIdx + 1, cIdx);
    }
  }
}

// ================================================================
// СОРТИРОВКА
// ================================================================

function excelSortByColumn(tableId, cIdx) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  
  const sort = EXCEL_ENGINE.sorts[tableId];
  if (sort.column === cIdx) {
    if (sort.direction === 'asc') {
      sort.direction = 'desc';
    } else if (sort.direction === 'desc') {
      sort.column = null;
      sort.direction = null;
    }
  } else {
    sort.column = cIdx;
    sort.direction = 'asc';
  }
  
  excelRenderTable(tableId);
}

// ================================================================
// ФИЛЬТРАЦИЯ (ПОИСК)
// ================================================================

function excelSearch(tableId, term) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  EXCEL_ENGINE.filters[tableId].search = term || '';
  excelRenderTable(tableId);
}

// ================================================================
// СБРОС ФИЛЬТРОВ
// ================================================================

function excelResetFilters(tableId) {
  EXCEL_ENGINE.filters[tableId].search = '';
  EXCEL_ENGINE.sorts[tableId].column = null;
  EXCEL_ENGINE.sorts[tableId].direction = null;
  const searchInput = document.getElementById(EXCEL_ENGINE.tables[tableId].searchInputId);
  if (searchInput) searchInput.value = '';
  excelRenderTable(tableId);
}

// ================================================================
// ПЕРЕКЛЮЧЕНИЕ РЕЖИМА РЕДАКТИРОВАНИЯ
// ================================================================

function excelToggleEditMode(tableId) {
  const table = EXCEL_ENGINE.tables[tableId];
  if (!table) return;
  EXCEL_ENGINE.editModes[tableId] = !EXCEL_ENGINE.editModes[tableId];
  EXCEL_ENGINE.selections[tableId] = { startRow: null, startCol: null, endRow: null, endCol: null };
  EXCEL_ENGINE.activeCells[tableId] = { row: null, col: null };
  excelRenderTable(tableId);
}

// ================================================================
// СОХРАНЕНИЕ ИЗМЕНЕНИЙ (ДЛЯ КОНКРЕТНОЙ ТАБЛИЦЫ)
// ================================================================

function excelSaveChanges(tableId, saveCallback) {
  const changes = EXCEL_ENGINE.changesQueues[tableId] || {};
  const changesCount = Object.keys(changes).length;
  if (changesCount === 0) {
    alert('Нет изменений для сохранения.');
    return;
  }
  
  const transactionsList = Object.values(changes);
  // Применяем изменения к данным
  transactionsList.forEach(function(tx) {
    if (EXCEL_ENGINE.tables[tableId].data[tx.row]) {
      EXCEL_ENGINE.tables[tableId].data[tx.row][tx.col] = tx.value;
    }
  });
  
  // Сохраняем в localStorage (если есть функция сохранения)
  if (saveCallback) {
    saveCallback(tableId, transactionsList);
  }
  
  // Очищаем очередь
  EXCEL_ENGINE.changesQueues[tableId] = {};
  excelRenderTable(tableId);
}

// ================================================================
// КОПИРОВАНИЕ (Ctrl+C) — УНИВЕРСАЛЬНОЕ
// ================================================================

document.addEventListener('copy', function(e) {
  // Определяем активную таблицу по фокусу
  let activeTableId = null;
  for (var tid in EXCEL_ENGINE.tables) {
    const container = document.getElementById(EXCEL_ENGINE.tables[tid].containerId);
    if (container && container.contains(document.activeElement)) {
      activeTableId = tid;
      break;
    }
  }
  if (!activeTableId) return;
  
  const table = EXCEL_ENGINE.tables[activeTableId];
  if (!table) return;
  
  const selection = EXCEL_ENGINE.selections[activeTableId];
  if (selection.startRow === null) return;
  
  const data = table.data;
  const { startRow, endRow, startCol, endCol } = selection;
  let copyData = [];
  for (let r = startRow; r <= endRow && r < data.length; r++) {
    if (!data[r]) continue;
    let rowCopy = [];
    for (let c = startCol; c <= endCol && c < data[r].length; c++) {
      rowCopy.push(data[r][c] !== undefined ? data[r][c] : '');
    }
    copyData.push(rowCopy);
  }
  
  const tsvText = copyData.map(function(row) { return row.join('\t'); }).join('\n');
  e.clipboardData.setData('text/plain', tsvText);
  e.preventDefault();
});

// ================================================================
// ВСТАВКА (Ctrl+V) — УНИВЕРСАЛЬНАЯ (ТОЛЬКО В РЕЖИМЕ РЕДАКТИРОВАНИЯ)
// ================================================================

document.addEventListener('paste', function(e) {
  // Определяем активную таблицу
  let activeTableId = null;
  for (var tid in EXCEL_ENGINE.tables) {
    const container = document.getElementById(EXCEL_ENGINE.tables[tid].containerId);
    if (container && container.contains(document.activeElement)) {
      activeTableId = tid;
      break;
    }
  }
  if (!activeTableId) return;
  
  const table = EXCEL_ENGINE.tables[activeTableId];
  if (!table || !EXCEL_ENGINE.editModes[activeTableId]) return;
  
  const selection = EXCEL_ENGINE.selections[activeTableId];
  if (selection.startRow === null) return;
  
  const pasteData = e.clipboardData.getData('text/plain');
  if (!pasteData) return;
  e.preventDefault();
  
  const rows = pasteData.split('\n').filter(function(line) { return line.trim() !== ''; });
  const startR = selection.startRow;
  const startC = selection.startCol;
  let pasteCount = 0;
  
  rows.forEach(function(rowText, rIdx) {
    const cells = rowText.split('\t');
    const targetR = startR + rIdx;
    if (targetR >= table.data.length) return;
    if (!table.data[targetR]) return;
    cells.forEach(function(cellValue, cIdx) {
      const targetC = startC + cIdx;
      if (targetC >= table.data[targetR].length) return;
      // Не вставляем в столбцы с формулами
      if (table.formulas && table.formulas[targetC]) return;
      const trimmedVal = cellValue.trim();
      table.data[targetR][targetC] = trimmedVal;
      if (!EXCEL_ENGINE.changesQueues[activeTableId]) EXCEL_ENGINE.changesQueues[activeTableId] = {};
      const cellKey = targetR+'_'+targetC;
      EXCEL_ENGINE.changesQueues[activeTableId][cellKey] = { row: targetR, col: targetC, value: trimmedVal };
      pasteCount++;
    });
  });
  
  excelRenderTable(activeTableId);
});

console.log('✅ excel_engine.js — загружен (универсальный движок)');
