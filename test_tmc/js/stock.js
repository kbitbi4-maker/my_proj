// ================================================================
// stock.js — МОДУЛЬ ТАБЛИЦЫ ОСТАТКОВ (ПРАВИЛЬНАЯ СТРУКТУРА)
// Версия 4.3 — ТОЛЬКО БУКВЫ В ШАПКЕ, ВСЕ ДАННЫЕ В ТЕЛЕ
// ================================================================

window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.stockIsDragging = false;
window.stockDragStartRow = null;
window.stockDragStartCol = null;
window.isStockEditMode = false;
window.stockFilterColor = "all";
window.stockSortColumn = null;
window.stockSortDirection = null;

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

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const currentData = window.inventoryData;
  if (!currentData || !currentData.length) return;

  // Шапка (первая строка данных — названия столбцов)
  const headerRow = currentData[0] || [];
  const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U'];
  const numCols = Math.max(headerRow.length, 21);

  // Панель управления (без изменений)
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
  // ШАПКА: ТОЛЬКО БУКВЫ (БЕЗ НОМЕРА)
  // ============================================================
  let headHtml = '<tr>';
  headHtml += '<th class="excel-corner" onclick="stockSelectAll()" title="Выделить всё" style="min-width:40px;max-width:40px;width:40px;background:#e8e8e8!important;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;text-align:center;user-select:none;">⬚</th>';
  for (let c = 0; c < numCols; c++) {
    const letter = colLetters[c] || String.fromCharCode(65 + c);
    headHtml += '<th id="stock-col-hdr-'+c+'" onclick="stockSelectWholeColumn('+c+')" title="Выделить столбец '+letter+'" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;white-space:normal;word-wrap:break-word;">'+letter+'</th>';
  }
  headHtml += '</tr>';
  head.innerHTML = headHtml;

  // ============================================================
  // ТЕЛО: ВСЕ СТРОКИ ДАННЫХ (НАЗВАНИЯ + ТОВАРЫ) С НУМЕРАЦИЕЙ
  // ============================================================
  // Собираем все строки данных, начиная с индекса 0 (названия)
  let rowsData = [];
  for (let rIdx = 0; rIdx < currentData.length; rIdx++) {
    const row = currentData[rIdx];
    if (!row || row.length === 0) continue;
    const isMatch = row.some(function(cell) { return String(cell).toLowerCase().includes(term); });
    if (!isMatch && term !== "") continue;
    rowsData.push({ index: rIdx, data: row });
  }

  let bodyHtml = "";
  // Строка с названиями (индекс 0) — имеет номер 1
  for (var ri = 0; ri < rowsData.length; ri++) {
    var rIdx = rowsData[ri].index;
    var row = rowsData[ri].data;
    var rowNum = rIdx + 1; // 1, 2, 3, ...

    var rowClickAttr = '';
    if (!window.isStockEditMode && rIdx > 0) { // только для товаров, не для названий
      rowClickAttr = ' onclick="handleStockRowClick('+rIdx+')" style="cursor:pointer;"';
    }

    var zebraBg = (ri % 2 === 0) ? 'background:#e8f5e9;' : 'background:#ffffff;';

    bodyHtml += '<tr id="stock-row-'+rIdx+'"'+rowClickAttr+' style="'+zebraBg+'">';
    bodyHtml += '<td class="row-header-num" id="stock-row-hdr-'+rIdx+'" onclick="stockSelectWholeRow('+rIdx+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;width:40px;padding:4px 2px;">'+rowNum+'</td>';

    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      let displayValue = row[cIdx] !== undefined ? row[cIdx] : '';
      
      // Формула E = G + I (только для товаров, не для названий)
      if (cIdx === 4 && window.isStockEditMode && rIdx > 0) {
        const gVal = parseFloat(row[6]) || 0;
        const iVal = parseFloat(row[8]) || 0;
        displayValue = gVal + iVal;
      }

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

  stockRefreshSelection();
  stockAttachDragListeners();
}

// Остальные функции (выделение, drag, копирование, вставка) остаются без изменений из предыдущей версии 4.2
// ... (код функций stockSelectAll, stockSelectWholeRow, stockSelectWholeColumn, stockHandleCellClick, ...)
