// ================================================================
// stock.js — МОДУЛЬ ТАБЛИЦЫ ОСТАТКОВ (ПРАВИЛЬНАЯ НУМЕРАЦИЯ)
// Версия 4.2 — УБРАНА ДВОЙНАЯ ШАПКА
// ================================================================

// ================================================================
// СОСТОЯНИЕ ВЫДЕЛЕНИЯ
// ================================================================

window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.stockIsDragging = false;
window.stockDragStartRow = null;
window.stockDragStartCol = null;
window.isStockEditMode = false;
window.stockFilterColor = "all";
window.stockSortColumn = null;
window.stockSortDirection = null;

// ================================================================
// ОТКРЫТИЕ ТАБЛИЦЫ ОСТАТКОВ
// ================================================================

function showStock() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length === 0) {
    alert("Сначала нажмите кнопку синхронизации ☁");
    return;
  }
  
  window.isStockEditMode = false;
  window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";
  
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
  
  renderStock();
}

// ================================================================
// РЕНДЕРИНГ ТАБЛИЦЫ ОСТАТКОВ (ПРАВИЛЬНАЯ НУМЕРАЦИЯ)
// ================================================================

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  const currentData = window.inventoryData;
  if (!currentData || !currentData.length) return;
  
  // ШАПКА (первая строка данных — названия столбцов)
  const headerRow = currentData[0] || [];
  const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const numCols = Math.max(headerRow.length, 21);
  
  // ============================================================
  // ПАНЕЛЬ УПРАВЛЕНИЯ
  // ============================================================
  let controlsWrapper = document.getElementById('stock-edit-controls-wrapper');
  if (!controlsWrapper) {
    controlsWrapper = document.createElement('div');
    controlsWrapper.id = 'stock-edit-controls-wrapper';
    controlsWrapper.style.width = '100%';
    const searchInputEl = document.getElementById('stock-search');
    if (searchInputEl && searchInputEl.parentNode) {
      searchInputEl.parentNode.insertBefore(controlsWrapper, searchInputEl);
    }
  }

  const changesCount = Object.keys(window.stockChangesQueue || {}).length;
  
  if (window.isStockEditMode) {
    controlsWrapper.innerHTML = '<div id="stock-edit-badge" class="stock-mode-badge">📊 РЕЖИМ EXCEL-ГРИДА (вкл)<button onclick="toggleStockEditMode()" style="padding:5px 16px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;margin-left:12px;">✖ ВЫКЛЮЧИТЬ</button></div><div class="stock-edit-actions-row"><button onclick="cancelStockChanges()" class="btn-stock-cancel">✖ Сбросить кэш ('+changesCount+')</button><button onclick="saveStockChangesCloud()" class="btn-stock-save">💾 Сохранить в Google ('+changesCount+')</button><button onclick="resetStockFilters()" class="btn-reset-filters">🔄 Сбросить фильтры</button></div>';
  } else {
    controlsWrapper.innerHTML = '<div id="stock-edit-badge" class="stock-mode-badge" style="background:#f0fdf4;color:#166534;border:1px solid #bbf7d0;">📋 РЕЖИМ ПРОСМОТРА (выкл)<button onclick="toggleStockEditMode()" style="padding:5px 16px;background:#22c55e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;margin-left:12px;">✏️ ВКЛЮЧИТЬ РЕДАКТИРОВАНИЕ</button><button onclick="resetStockFilters()" class="btn-reset-filters" style="margin-left:12px;">🔄 Сбросить фильтры</button></div>';
  }
  
  // ============================================================
  // ШАПКА: СТРОКА 1 — БУКВЫ (БЕЗ НОМЕРА)
  // ============================================================
  let headHtml = '';
  headHtml += '<tr>';
  headHtml += '<th class="excel-corner" onclick="stockSelectAll()" title="Выделить всё" style="min-width:40px;max-width:40px;width:40px;background:#e8e8e8!important;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;text-align:center;user-select:none;">⬚</th>';
  for (let c = 0; c < numCols; c++) {
    const letter = colLetters[c] || String.fromCharCode(65 + c);
    headHtml += '<th id="stock-col-hdr-'+c+'" onclick="stockSelectWholeColumn('+c+')" title="Выделить столбец '+letter+'" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;white-space:normal;word-wrap:break-word;">'+letter+'</th>';
  }
  headHtml += '</tr>';
  
  // ============================================================
  // ШАПКА: СТРОКА 2 — НАЗВАНИЯ (ЭТО СТРОКА 1 В ДАННЫХ)
  // ============================================================
  headHtml += '<tr style="font-weight:600;background:#f0f0f0;">';
  headHtml += '<th class="row-header-num" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:default;user-select:none;min-width:40px;max-width:40px;width:40px;padding:4px 2px;">1</th>';
  for (let c = 0; c < numCols; c++) {
    const headerName = headerRow[c] !== undefined && headerRow[c] !== '' ? headerRow[c] : colLetters[c] || String.fromCharCode(65 + c);
    headHtml += '<th style="background:#f0f0f0;color:#333;font-weight:600;font-size:11px;padding:4px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:default;user-select:none;min-width:60px;white-space:normal;word-wrap:break-word;word-break:break-word;">'+headerName+'</th>';
  }
  headHtml += '</tr>';
  head.innerHTML = headHtml;

  // ============================================================
  // СБОР ДАННЫХ (индексы: 1 — названия (уже в шапке), 2...N — данные)
  // ============================================================
  let rowsData = [];
  for (let rIdx = 1; rIdx < currentData.length; rIdx++) {
    const row = currentData[rIdx];
    if (!row || row.length === 0) continue;
    const isMatch = row.some(function(cell) { return String(cell).toLowerCase().includes(term); });
    if (!isMatch && term !== "") continue;
    rowsData.push({ index: rIdx, data: row });
  }

  // ============================================================
  // ТЕЛО ТАБЛИЦЫ (ДАННЫЕ НАЧИНАЮТСЯ СО СТРОКИ 2)
  // ============================================================
  let bodyHtml = "";
  
  for (var ri = 0; ri < rowsData.length; ri++) {
    var rIdx = rowsData[ri].index;
    var row = rowsData[ri].data;
    var rowNum = rIdx; // Индекс в массиве (2, 3, 4...)

    var rowClickAttr = '';
    if (!window.isStockEditMode) {
      rowClickAttr = ' onclick="handleStockRowClick('+rIdx+')" style="cursor:pointer;"';
    }

    var zebraBg = (ri % 2 === 0) ? 'background:#e8f5e9;' : 'background:#ffffff;';

    bodyHtml += '<tr id="stock-row-'+rIdx+'"'+rowClickAttr+' style="'+zebraBg+'">';
    bodyHtml += '<td class="row-header-num" id="stock-row-hdr-'+rIdx+'" onclick="stockSelectWholeRow('+rIdx+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;width:40px;padding:4px 2px;">'+rowNum+'</td>';

    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      let displayValue = row[cIdx] !== undefined ? row[cIdx] : '';
      
      // Формула E = G + I (индекс 4 = индекс 6 + индекс 8)
      if (cIdx === 4 && window.isStockEditMode) {
        const gVal = parseFloat(row[6]) || 0;
        const iVal = parseFloat(row[8]) || 0;
        displayValue = gVal + iVal;
      }

      // Проверяем выделение
      let isSelected = false;
      if (window.stockSelectedRange.startRow !== null) {
        isSelected = (rIdx >= window.stockSelectedRange.startRow && rIdx <= window.stockSelectedRange.endRow &&
                      cIdx >= window.stockSelectedRange.startCol && cIdx <= window.stockSelectedRange.endCol);
      }

      const selectClass = isSelected ? 'cell-selected' : '';
      const bgStyle = zebraBg;
      
      if (window.isStockEditMode) {
        bodyHtml += '<td id="stock-cell-'+rIdx+'-'+cIdx+'" class="'+selectClass+'" style="'+bgStyle+' border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:60px;white-space:normal;word-wrap:break-word;word-break:break-word;outline:none;user-select:none;" contenteditable="true" onclick="stockHandleCellClick(event,'+rIdx+','+cIdx+')" onblur="stockHandleCellBlur(this,'+rIdx+','+cIdx+')" onkeydown="stockHandleCellKeyDown(event,'+rIdx+','+cIdx+')" onmousedown="stockHandleMouseDown(event,'+rIdx+','+cIdx+')" onmouseover="stockHandleMouseOver(event,'+rIdx+','+cIdx+')">'+displayValue+'</td>';
      } else {
        bodyHtml += '<td id="stock-cell-'+rIdx+'-'+cIdx+'" class="'+selectClass+'" style="'+bgStyle+' border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:60px;white-space:normal;word-wrap:break-word;word-break:break-word;cursor:pointer;user-select:none;" onclick="stockHandleCellClick(event,'+rIdx+','+cIdx+')" onmousedown="stockHandleMouseDown(event,'+rIdx+','+cIdx+')" onmouseover="stockHandleMouseOver(event,'+rIdx+','+cIdx+')">'+displayValue+'</td>';
      }
    }
    bodyHtml += '</tr>';
  }
  
  body.innerHTML = bodyHtml || '<tr><td colspan="'+(numCols+1)+'" style="text-align:center;padding:20px;color:#999;">Ничего не найдено</td></tr>';

  // Обновляем выделение
  stockRefreshSelection();
  stockAttachDragListeners();
}

// ================================================================
// ВЫДЕЛЕНИЕ (КАК В ТАБЛИЦЕ САЛЬДО)
// ================================================================

function stockSelectAll() {
  const data = window.inventoryData;
  if (!data || data.length <= 1) return;
  
  window.stockSelectedRange.startRow = 1; // Начинаем со строки 1 (названия)
  window.stockSelectedRange.endRow = data.length - 1;
  window.stockSelectedRange.startCol = 0;
  window.stockSelectedRange.endCol = 20;
  stockRefreshSelection();
}

function stockSelectWholeRow(rIdx) {
  const data = window.inventoryData;
  if (!data || !data[rIdx]) return;
  
  const numCols = Math.max(data[rIdx].length, 21);
  window.stockSelectedRange.startRow = rIdx;
  window.stockSelectedRange.endRow = rIdx;
  window.stockSelectedRange.startCol = 0;
  window.stockSelectedRange.endCol = numCols - 1;
  stockRefreshSelection();
}

function stockSelectWholeColumn(cIdx) {
  const data = window.inventoryData;
  if (!data || data.length <= 1) return;
  
  window.stockSelectedRange.startRow = 1;
  window.stockSelectedRange.endRow = data.length - 1;
  window.stockSelectedRange.startCol = cIdx;
  window.stockSelectedRange.endCol = cIdx;
  stockRefreshSelection();
}

function stockHandleCellClick(event, rIdx, cIdx) {
  if (window.stockIsDragging) return;
  
  if (event.shiftKey && window.stockSelectedRange.startRow !== null) {
    window.stockSelectedRange.startRow = Math.min(window.stockSelectedRange.startRow, rIdx);
    window.stockSelectedRange.endRow = Math.max(window.stockSelectedRange.endRow, rIdx);
    window.stockSelectedRange.startCol = Math.min(window.stockSelectedRange.startCol, cIdx);
    window.stockSelectedRange.endCol = Math.max(window.stockSelectedRange.endCol, cIdx);
  } else {
    window.stockSelectedRange.startRow = rIdx;
    window.stockSelectedRange.endRow = rIdx;
    window.stockSelectedRange.startCol = cIdx;
    window.stockSelectedRange.endCol = cIdx;
  }
  
  stockRefreshSelection();
}

function stockHandleMouseDown(event, rIdx, cIdx) {
  event.preventDefault();
  window.stockIsDragging = true;
  window.stockDragStartRow = rIdx;
  window.stockDragStartCol = cIdx;
  window.stockSelectedRange.startRow = rIdx;
  window.stockSelectedRange.endRow = rIdx;
  window.stockSelectedRange.startCol = cIdx;
  window.stockSelectedRange.endCol = cIdx;
  stockRefreshSelection();
}

function stockHandleMouseOver(event, rIdx, cIdx) {
  if (!window.stockIsDragging) return;
  
  window.stockSelectedRange.startRow = Math.min(window.stockDragStartRow, rIdx);
  window.stockSelectedRange.endRow = Math.max(window.stockDragStartRow, rIdx);
  window.stockSelectedRange.startCol = Math.min(window.stockDragStartCol, cIdx);
  window.stockSelectedRange.endCol = Math.max(window.stockDragStartCol, cIdx);
  stockRefreshSelection();
}

function stockAttachDragListeners() {
  const container = document.querySelector('#stock-view .table-wrapper');
  const table = container ? container.querySelector('table') : null;
  if (!table) return;
  
  table.removeEventListener('mousedown', stockGlobalMouseDown);
  table.removeEventListener('mousemove', stockGlobalMouseMove);
  table.removeEventListener('mouseup', stockGlobalMouseUp);
  document.removeEventListener('mouseup', stockGlobalMouseUp);
  
  table.addEventListener('mousedown', stockGlobalMouseDown);
  table.addEventListener('mousemove', stockGlobalMouseMove);
  table.addEventListener('mouseup', stockGlobalMouseUp);
  document.addEventListener('mouseup', stockGlobalMouseUp);
}

function stockGlobalMouseDown(e) {
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('stock-cell-')) return;
  
  const parts = cellEl.id.replace('stock-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  
  e.preventDefault();
  window.stockIsDragging = true;
  window.stockDragStartRow = rIdx;
  window.stockDragStartCol = cIdx;
  window.stockSelectedRange.startRow = rIdx;
  window.stockSelectedRange.endRow = rIdx;
  window.stockSelectedRange.startCol = cIdx;
  window.stockSelectedRange.endCol = cIdx;
  stockRefreshSelection();
}

function stockGlobalMouseMove(e) {
  if (!window.stockIsDragging) return;
  
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('stock-cell-')) return;
  
  const parts = cellEl.id.replace('stock-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  
  e.preventDefault();
  window.stockSelectedRange.startRow = Math.min(window.stockDragStartRow, rIdx);
  window.stockSelectedRange.endRow = Math.max(window.stockDragStartRow, rIdx);
  window.stockSelectedRange.startCol = Math.min(window.stockDragStartCol, cIdx);
  window.stockSelectedRange.endCol = Math.max(window.stockDragStartCol, cIdx);
  stockRefreshSelection();
}

function stockGlobalMouseUp(e) {
  if (window.stockIsDragging) {
    window.stockIsDragging = false;
    stockRefreshSelection();
  }
}

// ================================================================
// ОБНОВЛЕНИЕ ВИЗУАЛЬНЫХ ВЫДЕЛЕНИЙ
// ================================================================

function stockRefreshSelection() {
  // Снимаем старые выделения
  document.querySelectorAll('#stock-body .cell-selected, #stock-body .row-selected, #stock-head .col-selected')
    .forEach(function(el) {
      el.classList.remove('cell-selected', 'row-selected', 'col-selected');
      el.style.background = '';
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.borderBottom = '';
    });
  
  // Снимаем подсветку заголовков
  const headRow = document.querySelector('#stock-head tr:first-child');
  if (headRow) {
    const cells = headRow.querySelectorAll('th');
    cells.forEach(function(el) {
      el.style.background = '';
      el.style.borderBottom = '';
    });
  }
  
  if (window.stockSelectedRange.startRow === null) return;
  
  // Подсвечиваем ячейки
  for (let r = window.stockSelectedRange.startRow; r <= window.stockSelectedRange.endRow; r++) {
    const rowHdr = document.getElementById('stock-row-hdr-'+r);
    if (rowHdr) {
      rowHdr.classList.add('row-selected');
      rowHdr.style.background = '#c7e0f4';
    }
    for (let c = window.stockSelectedRange.startCol; c <= window.stockSelectedRange.endCol; c++) {
      const cellEl = document.getElementById('stock-cell-'+r+'-'+c);
      if (cellEl) {
        cellEl.classList.add('cell-selected');
        cellEl.style.background = '#c7e0f4';
        cellEl.style.outline = '2px solid #2b5797';
        cellEl.style.outlineOffset = '-2px';
      }
    }
  }
  
  // Подсвечиваем заголовок столбца (первая строка шапки)
  if (headRow) {
    const cells = headRow.querySelectorAll('th');
    if (cells[window.stockSelectedRange.startCol + 1]) {
      cells[window.stockSelectedRange.startCol + 1].style.background = '#c7e0f4';
      cells[window.stockSelectedRange.startCol + 1].style.borderBottom = '3px solid #2b5797';
    }
  }
}

// ================================================================
// ПЕРЕКЛЮЧЕНИЕ РЕЖИМА
// ================================================================

function toggleStockEditMode() {
  window.isStockEditMode = !window.isStockEditMode;
  window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  renderStock();
}

function resetStockFilters() {
  window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = '';
  renderStock();
}

// ================================================================
// РЕДАКТИРОВАНИЕ (BLUR, KEYDOWN)
// ================================================================

function stockHandleCellBlur(cellElement, rIdx, cIdx) {
  if (!window.isStockEditMode) return;
  
  if (cIdx === 4) {
    const row = window.inventoryData[rIdx];
    if (row) {
      const gVal = parseFloat(row[6]) || 0;
      const iVal = parseFloat(row[8]) || 0;
      cellElement.innerText = gVal + iVal;
    }
    return;
  }
  
  const newValue = cellElement.innerText.trim();
  const originalValue = String(window.inventoryData[rIdx][cIdx] || '').trim();
  
  if (newValue !== originalValue) {
    window.inventoryData[rIdx][cIdx] = newValue;
    cellElement.classList.add('cell-stock-dirty');
    if (!window.stockChangesQueue) window.stockChangesQueue = {};
    const cellKey = rIdx+'_'+cIdx;
    window.stockChangesQueue[cellKey] = { row: rIdx, col: cIdx, value: newValue };
  } else {
    cellElement.classList.remove('cell-stock-dirty');
    const cellKey = rIdx+'_'+cIdx;
    if (window.stockChangesQueue) delete window.stockChangesQueue[cellKey];
  }
  
  if (cIdx === 6 || cIdx === 8) {
    const row = window.inventoryData[rIdx];
    if (row) {
      const gVal = parseFloat(row[6]) || 0;
      const iVal = parseFloat(row[8]) || 0;
      const eCell = document.getElementById('stock-cell-'+rIdx+'-4');
      if (eCell) {
        const newSum = gVal + iVal;
        eCell.innerText = newSum;
        row[4] = newSum;
        delete window.stockChangesQueue[rIdx+'_4'];
        eCell.classList.remove('cell-stock-dirty');
      }
    }
  }
  
  const changesCount = Object.keys(window.stockChangesQueue || {}).length;
  const saveBtn = document.querySelector('.btn-stock-save');
  if (saveBtn) saveBtn.innerText = '💾 Сохранить в Google ('+changesCount+')';
  const cancelBtn = document.querySelector('.btn-stock-cancel');
  if (cancelBtn) cancelBtn.innerText = '✖ Сбросить кэш ('+changesCount+')';
}

function stockHandleCellKeyDown(event, rIdx, cIdx) {
  if (!window.isStockEditMode) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    const nextCell = document.getElementById('stock-cell-'+(rIdx+1)+'-'+cIdx);
    if (nextCell && nextCell.id.startsWith('stock-cell-')) {
      nextCell.focus();
      stockHandleCellClick(event, rIdx + 1, cIdx);
    }
  }
}

// ================================================================
// ОБРАБОТЧИК КЛИКА ПО СТРОКЕ (РЕЖИМ ПРОСМОТРА)
// ================================================================

function handleStockRowClick(rIdx) {
  if (window.isStockEditMode) return;
  const currentData = window.inventoryData;
  if (!currentData || !currentData[rIdx]) {
    alert("Ошибка: Данные строки не найдены");
    return;
  }
  window.currentSelectedRowData = [...currentData[rIdx]];
  if (typeof openNumpadView === 'function') {
    openNumpadView();
  } else {
    alert("Ошибка: Модуль нумпада (js/numpad.js) не подключен.");
  }
}

// ================================================================
// СОХРАНЕНИЕ И ОТМЕНА
// ================================================================

function cancelStockChanges() {
  if (!window.isStockEditMode) return;
  if (Object.keys(window.stockChangesQueue || {}).length === 0) {
    alert('Нет изменений для отмены.');
    return;
  }
  if (!confirm('Очистить все несохранённые изменения ячеек?')) return;
  
  window.stockChangesQueue = {};
  window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  renderStock();
}

async function saveStockChangesCloud() {
  if (!window.isStockEditMode) return;
  const changesCount = Object.keys(window.stockChangesQueue || {}).length;
  if (changesCount === 0) {
    alert('Нет изменённых ячеек для отправки.');
    return;
  }
  
  const transactionsList = Object.values(window.stockChangesQueue);
  transactionsList.forEach(function(tx) {
    if (window.inventoryData[tx.row]) {
      window.inventoryData[tx.row][tx.col] = tx.value;
      if (tx.col === 6 || tx.col === 8) {
        const row = window.inventoryData[tx.row];
        if (row) {
          const gVal = parseFloat(row[6]) || 0;
          const iVal = parseFloat(row[8]) || 0;
          row[4] = gVal + iVal;
        }
      }
    }
  });
  
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
  
  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const payloadData = { type: "DELTA_UPDATE", cells: transactionsList };
      const textPayload = "STOCK_UPDATE|" + JSON.stringify(payloadData);
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      const resultText = await response.text();
      
      transactionsList.forEach(function(tx) {
        const cellEl = document.getElementById('stock-cell-'+tx.row+'-'+tx.col);
        if (cellEl) {
          cellEl.classList.remove('cell-stock-dirty');
          cellEl.classList.add('cell-stock-saved-flash');
        }
      });
      
      window.stockChangesQueue = {};
      setTimeout(function() {
        renderStock();
        alert('✅ Данные успешно сохранены в облаке!\n' + resultText);
      }, 800);
    } catch (e) {
      console.error('Ошибка отправки изменений:', e);
      alert('⚠️ Ошибка сети. Изменения сохранены локально на устройстве.');
    }
  } else {
    alert('📱 Устройство офлайн. Изменения сохранены в локальный кэш.');
    renderStock();
  }
}

// ================================================================
// КОПИРОВАНИЕ (Ctrl+C)
// ================================================================

document.addEventListener('copy', function(e) {
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#stock-view')) return;
  if (window.stockSelectedRange.startRow === null) return;
  
  const data = window.inventoryData;
  if (!data || data.length <= 1) return;
  
  const { startRow, endRow, startCol, endCol } = window.stockSelectedRange;
  let copyData = [];
  for (let r = startRow; r <= endRow && r < data.length; r++) {
    if (!data[r]) continue;
    let rowCopy = [];
    for (let c = startCol; c <= endCol && c < data[r].length; c++) {
      const cellKey = r+'_'+c;
      const isDirty = window.stockChangesQueue && window.stockChangesQueue[cellKey];
      const value = isDirty ? isDirty.value : (data[r][c] !== undefined ? data[r][c] : '');
      rowCopy.push(value);
    }
    copyData.push(rowCopy);
  }
  
  const tsvText = copyData.map(function(row) { return row.join('\t'); }).join('\n');
  e.clipboardData.setData('text/plain', tsvText);
  e.preventDefault();
  
  const badge = document.getElementById('stock-edit-badge');
  if (badge) {
    const origText = badge.innerText;
    badge.innerText = '✅ Скопировано! ' + copyData.length + ' строк';
    badge.style.background = '#d4edda';
    setTimeout(function() {
      badge.innerText = origText;
      badge.style.background = '#e8f0fe';
    }, 1500);
  }
});

// ================================================================
// ВСТАВКА (Ctrl+V)
// ================================================================

document.addEventListener('paste', function(e) {
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#stock-view')) return;
  if (!window.isStockEditMode) return;
  if (window.stockSelectedRange.startRow === null) return;
  
  const pasteData = e.clipboardData.getData('text/plain');
  if (!pasteData) return;
  e.preventDefault();
  
  const rows = pasteData.split('\n').filter(function(line) { return line.trim() !== ''; });
  const startR = window.stockSelectedRange.startRow;
  const startC = window.stockSelectedRange.startCol;
  let pasteCount = 0;
  
  rows.forEach(function(rowText, rIdx) {
    const cells = rowText.split('\t');
    const targetR = startR + rIdx;
    if (targetR >= window.inventoryData.length) return;
    if (!window.inventoryData[targetR]) return;
    cells.forEach(function(cellValue, cIdx) {
      const targetC = startC + cIdx;
      if (targetC >= window.inventoryData[targetR].length) return;
      if (targetC === 4) return;
      
      const trimmedVal = cellValue.trim();
      window.inventoryData[targetR][targetC] = trimmedVal;
      if (!window.stockChangesQueue) window.stockChangesQueue = {};
      const cellKey = targetR+'_'+targetC;
      window.stockChangesQueue[cellKey] = { row: targetR, col: targetC, value: trimmedVal };
      pasteCount++;
    });
  });
  
  renderStock();
  
  const badge = document.getElementById('stock-edit-badge');
  if (badge) {
    const origText = badge.innerText;
    badge.innerText = '📋 Вставлено! ' + pasteCount + ' ячеек';
    badge.style.background = '#d4edda';
    setTimeout(function() {
      badge.innerText = origText;
      badge.style.background = '#e8f0fe';
    }, 1500);
  }
});

console.log('✅ stock.js — загружен (версия 4.2, правильная нумерация)');
