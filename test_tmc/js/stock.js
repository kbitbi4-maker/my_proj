// ================================================================
// js/stock.js — ПОЛНЫЙ МОДУЛЬ УПРАВЛЕНИЯ ОСТАТКАМИ
// Версия 3.1 — разделение режимов, без мигания, локальное списание
// ================================================================

window.isStockEditMode = false;
window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.stockActiveCell = { row: null, col: null };
window.stockChangesQueue = {};

function showStock() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length === 0) { alert("Сначала нажмите кнопку синхронизации ☁"); return; }
  window.isStockEditMode = false;
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";
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

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const currentData = window.inventoryData;
  if (!currentData || !currentData.length) return;
  
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

  const changesCount = Object.keys(window.stockChangesQueue).length;
  
  if (window.isStockEditMode) {
    controlsWrapper.innerHTML = '<div id="stock-edit-badge" style="background:#e8f0fe;color:#1a3c5e;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #b3c9e6;text-align:center;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;"><span>📊 РЕЖИМ EXCEL-ГРИДА (вкл)</span><button onclick="toggleStockEditMode()" style="padding:5px 16px;background:#ef4444;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;transition:background 0.15s;" onmouseover="this.style.background=\'#dc2626\'" onmouseout="this.style.background=\'#ef4444\'">✖ ВЫКЛЮЧИТЬ</button></div><div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;"><button onclick="cancelStockChanges()" style="background:#f1f3f4;border:1px solid #d0d7de;padding:6px 16px;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;color:#555;transition:background 0.15s;" onmouseover="this.style.background=\'#e5e7eb\'" onmouseout="this.style.background=\'#f1f3f4\'">✖ Сбросить кэш ('+changesCount+')</button><button onclick="saveStockChangesCloud()" style="background:#1a73e8;border:none;padding:6px 20px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;color:white;transition:background 0.15s;" onmouseover="this.style.background=\'#1557b0\'" onmouseout="this.style.background=\'#1a73e8\'">💾 Сохранить в Google ('+changesCount+')</button></div>';
  } else {
    controlsWrapper.innerHTML = '<div id="stock-edit-badge" style="background:#f0fdf4;color:#166534;padding:10px 14px;border-radius:8px;font-size:14px;font-weight:600;border:1px solid #bbf7d0;text-align:center;margin-bottom:10px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;"><span>📋 РЕЖИМ ПРОСМОТРА (выкл)</span><button onclick="toggleStockEditMode()" style="padding:5px 16px;background:#22c55e;color:white;border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;transition:background 0.15s;" onmouseover="this.style.background=\'#16a34a\'" onmouseout="this.style.background=\'#22c55e\'">✏️ ВКЛЮЧИТЬ РЕДАКТИРОВАНИЕ</button></div>';
  }
  
  const colLetters = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'];
  let headHtml = '<tr>';
  
  if (window.isStockEditMode) {
    headHtml += '<th class="excel-corner-header" style="min-width:40px;max-width:40px;background:#e8e8e8;border-right:2px solid #a0a0a0;"></th>';
    for (let c = 0; c < 21; c++) {
      const letter = colLetters[c + 1] || String.fromCharCode(65 + c);
      headHtml += '<th onclick="excelSelectWholeColumn('+c+')" title="Выделить столбец '+letter+'" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;">'+letter+'</th>';
    }
  } else {
    headHtml += '<th></th>';
    const headers = ['Партия','Материал','КрТекстМатериала','Базисная ЕИ','Кол-во запаса','из.SUP','скл.1','не проведено в SUP','скл.2','цена за ед.','полка №','лок.ID','Ст-ть запаса','Завод','Склад','Особый запас','СПП-элемент','Группа материалов','Дата поступления','Золото','Серебро'];
    headers.forEach(function(h) {
      headHtml += '<th style="background:#475569;color:white;padding:6px 4px;border:1px solid rgba(255,255,255,0.2);font-size:1.2vh;white-space:normal;word-wrap:break-word;text-align:center;">'+h+'</th>';
    });
  }
  headHtml += '</tr>';
  head.innerHTML = headHtml;

  let bodyHtml = "";
  for (let rIdx = 1; rIdx < currentData.length; rIdx++) {
    const row = currentData[rIdx];
    if (!row || row.length === 0) continue;
    const isMatch = row.some(function(cell) { return String(cell).toLowerCase().includes(term); });
    if (!isMatch && term !== "") continue;

    bodyHtml += '<tr id="ex-row-'+rIdx+'"' + (!window.isStockEditMode ? ' onclick="handleStockRowClick('+rIdx+')" style="cursor:pointer;"' : '') + '>';
    
    if (window.isStockEditMode) {
      bodyHtml += '<td class="row-header-num" id="row-hdr-'+rIdx+'" onclick="excelSelectWholeRow(event,'+rIdx+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;padding:4px 2px;">'+rIdx+'</td>';
    } else {
      bodyHtml += '<td style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;min-width:40px;max-width:40px;padding:4px 2px;">'+rIdx+'</td>';
    }

    for (let cIdx = 0; cIdx < 21; cIdx++) {
      const cellKey = rIdx+'_'+cIdx;
      const isDirty = window.stockChangesQueue[cellKey];
      let displayValue = isDirty ? isDirty.value : (row[cIdx] !== undefined ? row[cIdx] : '');
      if (cIdx === 9 && !isDirty && displayValue !== '') {
        const parsedPrice = parseFloat(String(displayValue).replace(/,/g, '.').replace(/\s+/g, ''));
        if (!isNaN(parsedPrice)) displayValue = parsedPrice.toFixed(3);
      }

      if (window.isStockEditMode) {
        const dirtyClass = isDirty ? 'cell-stock-dirty' : '';
        const bgStyle = isDirty && isDirty.bg ? 'background-color:'+isDirty.bg+';' : '';
        const colorStyle = isDirty && isDirty.fontColor ? 'color:'+isDirty.fontColor+';' : '';
        const weightStyle = isDirty && isDirty.fontWeight ? 'font-weight:'+isDirty.fontWeight+';' : '';
        bodyHtml += '<td id="ex-cell-'+rIdx+'-'+cIdx+'" class="'+dirtyClass+'" style="'+bgStyle+' '+colorStyle+' '+weightStyle+' border:1px solid #d0d7de;padding:4px 6px;text-align:left;font-size:13px;min-width:60px;height:24px;outline:none;" contenteditable="true" onclick="excelHandleCellClick(event,'+rIdx+','+cIdx+')" onblur="excelHandleCellBlur(this,'+rIdx+','+cIdx+')" onkeydown="excelHandleCellKeyDown(event,'+rIdx+','+cIdx+')">'+displayValue+'</td>';
      } else {
        bodyHtml += '<td style="border:1px solid #d0d7de;padding:4px 6px;text-align:left;font-size:13px;min-width:60px;background:#ffffff;color:#000;">'+displayValue+'</td>';
      }
    }
    bodyHtml += '</tr>';
  }
  
  body.innerHTML = bodyHtml || '<tr><td colspan="22" style="text-align:center;padding:20px;color:#999;">Ничего не найдено</td></tr>';

  if (window.isStockEditMode) {
    excelRefreshSelectionVisuals();
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

function excelHandleCellClick(event, rIdx, cIdx) {
  if (!window.isStockEditMode) return;
  const currentData = window.inventoryData;
  if (!currentData || !currentData[rIdx]) return;
  if (event.shiftKey && window.stockActiveCell.row !== null && window.stockActiveCell.col !== null) {
    window.stockSelectedRange.startRow = Math.min(window.stockActiveCell.row, rIdx);
    window.stockSelectedRange.endRow = Math.max(window.stockActiveCell.row, rIdx);
    window.stockSelectedRange.startCol = Math.min(window.stockActiveCell.col, cIdx);
    window.stockSelectedRange.endCol = Math.max(window.stockActiveCell.col, cIdx);
  } else {
    window.stockActiveCell.row = rIdx;
    window.stockActiveCell.col = cIdx;
    window.stockSelectedRange.startRow = rIdx;
    window.stockSelectedRange.endRow = rIdx;
    window.stockSelectedRange.startCol = cIdx;
    window.stockSelectedRange.endCol = cIdx;
  }
  excelRefreshSelectionVisuals();
  const cellEl = document.getElementById('ex-cell-'+rIdx+'-'+cIdx);
  if (cellEl) {
    cellEl.classList.add('cell-active-focus');
    cellEl.focus();
  }
}

function excelSelectWholeRow(event, rIdx) {
  if (!window.isStockEditMode) return;
  event.stopPropagation();
  const currentData = window.inventoryData;
  if (!currentData || !currentData[rIdx]) return;
  window.stockActiveCell.row = rIdx;
  window.stockActiveCell.col = 0;
  window.stockSelectedRange.startRow = rIdx;
  window.stockSelectedRange.endRow = rIdx;
  window.stockSelectedRange.startCol = 0;
  window.stockSelectedRange.endCol = 20;
  excelRefreshSelectionVisuals();
}

function excelSelectWholeColumn(cIdx) {
  if (!window.isStockEditMode) return;
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
  if (!window.isStockEditMode) return;
  document.querySelectorAll('.cell-selected, .cell-active-focus, .row-selected').forEach(function(el) { el.classList.remove('cell-selected', 'cell-active-focus', 'row-selected'); });
  if (window.stockSelectedRange.startRow === null) return;
  for (let r = window.stockSelectedRange.startRow; r <= window.stockSelectedRange.endRow; r++) {
    const rowHdr = document.getElementById('row-hdr-'+r);
    if (rowHdr) rowHdr.classList.add('row-selected');
    for (let c = window.stockSelectedRange.startCol; c <= window.stockSelectedRange.endCol; c++) {
      const cellEl = document.getElementById('ex-cell-'+r+'-'+c);
      if (cellEl) {
        cellEl.classList.add('cell-selected');
        if (r === window.stockActiveCell.row && c === window.stockActiveCell.col) {
          cellEl.classList.add('cell-active-focus');
        }
      }
    }
  }
}

function excelHandleCellBlur(cellElement, rIdx, cIdx) {
  if (!window.isStockEditMode) return;
  cellElement.classList.remove('cell-active-focus');
  const newValue = cellElement.innerText.trim();
  const originalValue = String(window.inventoryData[rIdx][cIdx] || '').trim();
  const currentBg = window.getComputedStyle(cellElement).backgroundColor;
  const currentTextHex = window.getComputedStyle(cellElement).color;
  const currentWeight = window.getComputedStyle(cellElement).fontWeight;
  const cellKey = rIdx+'_'+cIdx;
  if (newValue !== originalValue || currentBg !== 'transparent' || currentWeight !== '400') {
    cellElement.classList.add('cell-stock-dirty');
    window.stockChangesQueue[cellKey] = { row: rIdx, col: cIdx, value: newValue, bg: currentBg, fontColor: currentTextHex, fontWeight: currentWeight };
  } else {
    cellElement.classList.remove('cell-stock-dirty');
    delete window.stockChangesQueue[cellKey];
  }
  updateStockButtons();
}

function excelHandleCellKeyDown(event, rIdx, cIdx) {
  if (!window.isStockEditMode) return;
  if (event.key === 'Enter') {
    event.preventDefault();
    const nextCell = document.getElementById('ex-cell-'+(rIdx+1)+'-'+cIdx);
    if (nextCell) {
      nextCell.focus();
      excelHandleCellClick(event, rIdx + 1, cIdx);
    }
  }
}

function updateStockButtons() {
  const changesCount = Object.keys(window.stockChangesQueue).length;
  const saveBtn = document.querySelector('.btn-stock-save');
  if (saveBtn) { saveBtn.innerText = '💾 Сохранить в Google ('+changesCount+')'; }
  const cancelBtn = document.querySelector('.btn-stock-cancel');
  if (cancelBtn) { cancelBtn.innerText = '✖ Сбросить кэш ('+changesCount+')'; }
}

function cancelStockChanges() {
  if (!window.isStockEditMode) return;
  if (Object.keys(window.stockChangesQueue).length === 0) { alert('Нет изменений для отмены.'); return; }
  if (!confirm('Очистить все несохранённые изменения ячеек?')) return;
  window.stockChangesQueue = {};
  window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  window.stockActiveCell = { row: null, col: null };
  renderStock();
}

async function saveStockChangesCloud() {
  if (!window.isStockEditMode) return;
  const changesCount = Object.keys(window.stockChangesQueue).length;
  if (changesCount === 0) { alert('Нет изменённых ячеек для отправки.'); return; }
  const transactionsList = Object.values(window.stockChangesQueue);
  transactionsList.forEach(function(tx) {
    if (window.inventoryData[tx.row]) {
      window.inventoryData[tx.row][tx.col] = tx.value;
    }
  });
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const payloadData = { type: "DELTA_UPDATE", cells: transactionsList };
      const textPayload = "STOCK_UPDATE|" + JSON.stringify(payloadData);
      const response = await fetch(SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: textPayload });
      const resultText = await response.text();
      transactionsList.forEach(function(tx) {
        const cellEl = document.getElementById('ex-cell-'+tx.row+'-'+tx.col);
        if (cellEl) {
          cellEl.classList.remove('cell-stock-dirty');
          cellEl.classList.add('cell-stock-saved-flash');
        }
      });
      window.stockChangesQueue = {};
      setTimeout(function() { renderStock(); alert('✅ Данные успешно сохранены в облаке!\n' + resultText); }, 800);
    } catch (e) {
      console.error('Ошибка отправки изменений:', e);
      alert('⚠️ Ошибка сети. Изменения сохранены локально на устройстве.');
    }
  } else {
    alert('📱 Устройство офлайн. Изменения сохранены в локальный кэш.');
    renderStock();
  }
}

document.addEventListener('copy', function(e) {
  if (!window.isStockEditMode) return;
  if (window.stockSelectedRange.startRow === null) return;
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#stock-view')) return;
  const currentData = window.inventoryData;
  if (!currentData || currentData.length <= 1) return;
  const { startRow, endRow, startCol, endCol } = window.stockSelectedRange;
  let copyData = [];
  for (let r = startRow; r <= endRow && r < currentData.length; r++) {
    let rowCopy = [];
    for (let c = startCol; c <= endCol && c < (currentData[r] || []).length; c++) {
      const cellKey = r+'_'+c;
      const isDirty = window.stockChangesQueue[cellKey];
      const value = isDirty ? isDirty.value : (currentData[r][c] !== undefined ? currentData[r][c] : '');
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
    setTimeout(function() { badge.innerText = origText; badge.style.background = '#e8f0fe'; }, 1500);
  }
});

document.addEventListener('paste', function(e) {
  if (!window.isStockEditMode) return;
  if (window.stockActiveCell.row === null || window.stockActiveCell.col === null) return;
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#stock-view')) return;
  const pasteData = e.clipboardData.getData('text/plain');
  if (!pasteData) return;
  e.preventDefault();
  const rows = pasteData.split('\n').filter(function(line) { return line.trim() !== ''; });
  const startR = window.stockActiveCell.row;
  const startC = window.stockActiveCell.col;
  let pasteCount = 0;
  rows.forEach(function(rowText, rIdx) {
    const cells = rowText.split('\t');
    const targetR = startR + rIdx;
    if (targetR >= window.inventoryData.length) return;
    cells.forEach(function(cellValue, cIdx) {
      const targetC = startC + cIdx;
      if (targetC >= (window.inventoryData[targetR] || []).length) return;
      const cellKey = targetR+'_'+targetC;
      const trimmedVal = cellValue.trim();
      window.inventoryData[targetR][targetC] = trimmedVal;
      window.stockChangesQueue[cellKey] = { row: targetR, col: targetC, value: trimmedVal, bg: '#ffffff', fontColor: '#000000', fontWeight: '400' };
      pasteCount++;
    });
  });
  renderStock();
  const badge = document.getElementById('stock-edit-badge');
  if (badge) {
    const origText = badge.innerText;
    badge.innerText = '📋 Вставлено! ' + pasteCount + ' ячеек';
    badge.style.background = '#d4edda';
    setTimeout(function() { badge.innerText = origText; badge.style.background = '#e8f0fe'; }, 1500);
  }
});

window.addEventListener('resize', function() {
  if (!document.getElementById('stock-view').classList.contains('hidden') && window.isStockEditMode) {
    excelRefreshSelectionVisuals();
  }
});

console.log('✅ js/stock.js — загружен (версия 3.1)');
