// ================================================================
// stock.js — РЕНДЕРИНГ ТАБЛИЦЫ ОСТАТКОВ, ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ
// Версия 3.3 — рендеринг, шапка из данных, сортировка, фильтры
// ================================================================

window.isStockEditMode = false;
window.stockFilterColor = "all";
window.stockSortColumn = null;
window.stockSortDirection = null;

function showStock() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length === 0) { alert("Сначала нажмите кнопку синхронизации ☁"); return; }
  window.isStockEditMode = false;
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";
  window.stockFilterColor = "all";
  window.stockSortColumn = null;
  window.stockSortDirection = null;
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
  renderStock();
}

function toggleStockEditMode() {
  window.isStockEditMode = !window.isStockEditMode;
  window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  window.stockActiveCell = { row: null, col: null };
  renderStock();
}

function resetStockFilters() {
  window.stockFilterColor = "all";
  window.stockSortColumn = null;
  window.stockSortDirection = null;
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";
  renderStock();
}

function stockSortByColumn(cIdx) {
  if (window.stockSortColumn === cIdx) {
    if (window.stockSortDirection === 'asc') {
      window.stockSortDirection = 'desc';
    } else if (window.stockSortDirection === 'desc') {
      window.stockSortColumn = null;
      window.stockSortDirection = null;
    }
  } else {
    window.stockSortColumn = cIdx;
    window.stockSortDirection = 'asc';
  }
  renderStock();
}

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const currentData = window.inventoryData;
  if (!currentData || !currentData.length) return;
  
  const headerRow = currentData[0] || [];
  
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
    controlsWrapper.innerHTML = '<div id="stock-edit-badge" style="background:#e8f0fe;color:#1a3c5e;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #b3c9e6;text-align:center;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;"><span>📊 РЕЖИМ EXCEL-ГРИДА (вкл)</span><button onclick="toggleStockEditMode()" style="padding:5px 16px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;transition:background 0.15s;" onmouseover="this.style.background=\'#dc2626\'" onmouseout="this.style.background=\'#ef4444\'">✖ ВЫКЛЮЧИТЬ</button></div><div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;"><button onclick="window.cancelStockChanges ? cancelStockChanges() : alert(\'Функция не загружена\')" style="background:#f1f3f4;border:1px solid #d0d7de;padding:6px 16px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;color:#555;transition:background 0.15s;" onmouseover="this.style.background=\'#e5e7eb\'" onmouseout="this.style.background=\'#f1f3f4\'">✖ Сбросить кэш ('+changesCount+')</button><button onclick="window.saveStockChangesCloud ? saveStockChangesCloud() : alert(\'Функция не загружена\')" style="background:#1a73e8;border:none;padding:6px 20px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;color:white;transition:background 0.15s;" onmouseover="this.style.background=\'#1557b0\'" onmouseout="this.style.background=\'#1a73e8\'">💾 Сохранить в Google ('+changesCount+')</button><button onclick="resetStockFilters()" class="btn-reset-filters" style="background:#6b7280;border:none;padding:6px 16px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;color:white;transition:background 0.15s;" onmouseover="this.style.background=\'#4b5563\'" onmouseout="this.style.background=\'#6b7280\'">🔄 Сбросить фильтры</button></div>';
  } else {
    controlsWrapper.innerHTML = '<div id="stock-edit-badge" style="background:#f0fdf4;color:#166534;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #bbf7d0;text-align:center;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;"><span>📋 РЕЖИМ ПРОСМОТРА (выкл)</span><button onclick="toggleStockEditMode()" style="padding:5px 16px;background:#22c55e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;transition:background 0.15s;" onmouseover="this.style.background=\'#16a34a\'" onmouseout="this.style.background=\'#22c55e\'">✏️ ВКЛЮЧИТЬ РЕДАКТИРОВАНИЕ</button><button onclick="resetStockFilters()" class="btn-reset-filters" style="background:#6b7280;border:none;padding:6px 16px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;color:white;transition:background 0.15s;" onmouseover="this.style.background=\'#4b5563\'" onmouseout="this.style.background=\'#6b7280\'">🔄 Сбросить фильтры</button></div>';
  }
  
  const colLetters = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'];
  let headHtml = '<tr>';
  
  if (window.isStockEditMode) {
    headHtml += '<th class="excel-corner-header" style="min-width:40px;max-width:40px;background:#e8e8e8;border-right:2px solid #a0a0a0;"></th>';
    for (let c = 0; c < Math.max(headerRow.length, 21); c++) {
      const letter = colLetters[c + 1] || String.fromCharCode(65 + c);
      headHtml += '<th onclick="stockSortByColumn('+c+')" title="Сортировка по столбцу '+letter+'" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;">'+letter+' '+(window.stockSortColumn===c?(window.stockSortDirection==='asc'?'↑':'↓'):'')+'</th>';
    }
  } else {
    headHtml += '<th style="min-width:40px;max-width:40px;background:#e8e8e8;border-right:2px solid #a0a0a0;"></th>';
    for (let c = 0; c < Math.max(headerRow.length, 21); c++) {
      const headerName = headerRow[c] !== undefined && headerRow[c] !== '' ? headerRow[c] : colLetters[c + 1] || String.fromCharCode(65 + c);
      headHtml += '<th onclick="stockSortByColumn('+c+')" title="Сортировка по столбцу '+headerName+'" style="background:#475569;color:white;padding:6px 4px;border:1px solid rgba(255,255,255,0.2);font-size:1.2vh;white-space:normal;word-wrap:break-word;text-align:center;cursor:pointer;">'+headerName+' '+(window.stockSortColumn===c?(window.stockSortDirection==='asc'?'↑':'↓'):'')+'</th>';
    }
  }
  headHtml += '</tr>';
  head.innerHTML = headHtml;

  let rowsData = [];
  for (let rIdx = 1; rIdx < currentData.length; rIdx++) {
    const row = currentData[rIdx];
    if (!row || row.length === 0) continue;
    const isMatch = row.some(function(cell) { return String(cell).toLowerCase().includes(term); });
    if (!isMatch && term !== "") continue;
    rowsData.push({ index: rIdx, data: row });
  }

  // Сортировка
  if (window.stockSortColumn !== null) {
    rowsData.sort(function(a, b) {
      var valA = String(a.data[window.stockSortColumn] || '').toLowerCase();
      var valB = String(b.data[window.stockSortColumn] || '').toLowerCase();
      var numA = parseFloat(valA.replace(/[^0-9.-]/g, ''));
      var numB = parseFloat(valB.replace(/[^0-9.-]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return window.stockSortDirection === 'asc' ? numA - numB : numB - numA;
      }
      if (valA < valB) return window.stockSortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return window.stockSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  let bodyHtml = "";
  for (var ri = 0; ri < rowsData.length; ri++) {
    var rIdx = rowsData[ri].index;
    var row = rowsData[ri].data;

    bodyHtml += '<tr id="ex-row-'+rIdx+'"' + (!window.isStockEditMode ? ' onclick="handleStockRowClick('+rIdx+')" style="cursor:pointer;"' : '') + '>';
    
    if (window.isStockEditMode) {
      bodyHtml += '<td class="row-header-num" id="row-hdr-'+rIdx+'" onclick="window.excelSelectWholeRow ? excelSelectWholeRow(event,'+rIdx+') : alert(\'Функция не загружена\')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;padding:4px 2px;">'+rIdx+'</td>';
    } else {
      bodyHtml += '<td style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;min-width:40px;max-width:40px;padding:4px 2px;">'+rIdx+'</td>';
    }

    for (let cIdx = 0; cIdx < Math.max(row.length, 21); cIdx++) {
      const cellKey = rIdx+'_'+cIdx;
      const isDirty = window.stockChangesQueue && window.stockChangesQueue[cellKey];
      let displayValue = isDirty ? isDirty.value : (row[cIdx] !== undefined ? row[cIdx] : '');
      
      if (cIdx === 4 && !isDirty && window.isStockEditMode) {
        const gVal = parseFloat(row[6]) || 0;
        const iVal = parseFloat(row[8]) || 0;
        displayValue = gVal + iVal;
      }

      var rowBg = '';
      if (!window.isStockEditMode) {
        rowBg = ri % 2 === 0 ? 'background:#e8f5e9;' : 'background:#f1f8e9;';
      }

      if (window.isStockEditMode) {
        const dirtyClass = isDirty ? 'cell-stock-dirty' : '';
        const bgStyle = isDirty && isDirty.bg ? 'background-color:'+isDirty.bg+';' : '';
        const colorStyle = isDirty && isDirty.fontColor ? 'color:'+isDirty.fontColor+';' : '';
        const weightStyle = isDirty && isDirty.fontWeight ? 'font-weight:'+isDirty.fontWeight+';' : '';
        bodyHtml += '<td id="ex-cell-'+rIdx+'-'+cIdx+'" class="'+dirtyClass+'" style="'+bgStyle+' '+colorStyle+' '+weightStyle+' border:1px solid #d0d7de;padding:4px 6px;text-align:left;font-size:13px;min-width:60px;height:24px;outline:none;" contenteditable="true" onclick="window.excelHandleCellClick ? excelHandleCellClick(event,'+rIdx+','+cIdx+') : alert(\'Функция не загружена\')" onblur="window.excelHandleCellBlur ? excelHandleCellBlur(this,'+rIdx+','+cIdx+') : null" onkeydown="window.excelHandleCellKeyDown ? excelHandleCellKeyDown(event,'+rIdx+','+cIdx+') : null" onmousedown="window.excelHandleMouseDown ? excelHandleMouseDown(event,'+rIdx+','+cIdx+') : null" onmouseover="window.excelHandleMouseOver ? excelHandleMouseOver(event,'+rIdx+','+cIdx+') : null">'+displayValue+'</td>';
      } else {
        bodyHtml += '<td style="border:1px solid #d0d7de;padding:4px 6px;text-align:left;font-size:13px;min-width:60px;'+rowBg+'color:#000;">'+displayValue+'</td>';
      }
    }
    bodyHtml += '</tr>';
  }
  
  body.innerHTML = bodyHtml || '<tr><td colspan="22" style="text-align:center;padding:20px;color:#999;">Ничего не найдено</td></tr>';

  if (window.isStockEditMode && typeof window.excelRefreshSelectionVisuals === 'function') {
    window.excelRefreshSelectionVisuals();
  }
}

function handleStockRowClick(rIdx) {
  if (window.isStockEditMode) return;
  const currentData = window.inventoryData;
  if (!currentData || !currentData[rIdx]) { alert("Ошибка: Данные строки не найдены"); return; }
  window.currentSelectedRowData = [...currentData[rIdx]];
  if (typeof openNumpadView === 'function') {
    openNumpadView();
  } else {
    alert("Ошибка: Модуль нумпада (js/numpad.js) не подключен.");
  }
}
