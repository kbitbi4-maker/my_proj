// ================================================================
// stock_edit.js — РЕДАКТИРОВАНИЕ ТАБЛИЦЫ ОСТАТКОВ
// Версия 1.1 — выделение, drag, copy/paste, выделение всей таблицы
// ================================================================

window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.stockActiveCell = { row: null, col: null };
window.stockChangesQueue = {};
window.stockIsDragging = false;
window.stockDragStartRow = null;
window.stockDragStartCol = null;

function excelSelectAll() {
  if (!window.isStockEditMode) return;
  const currentData = window.inventoryData;
  if (!currentData || currentData.length <= 1) return;
  window.stockActiveCell.row = 1;
  window.stockActiveCell.col = 0;
  window.stockSelectedRange.startRow = 1;
  window.stockSelectedRange.endRow = currentData.length - 1;
  window.stockSelectedRange.startCol = 0;
  window.stockSelectedRange.endCol = Math.max(currentData[1] ? currentData[1].length - 1 : 20, 20);
  excelRefreshSelectionVisuals();
}

function excelHandleCellClick(event, rIdx, cIdx) {
  if (!window.isStockEditMode) return;
  if (window.stockIsDragging) return;
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
  window.stockSelectedRange.endCol = Math.max(currentData[rIdx].length - 1, 20);
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

function attachDragListeners() {
  const table = document.querySelector('#stock-view table');
  if (!table) return;
  table.removeEventListener('mousedown', excelGlobalMouseDown);
  table.removeEventListener('mousemove', excelGlobalMouseMove);
  table.removeEventListener('mouseup', excelGlobalMouseUp);
  document.removeEventListener('mouseup', excelGlobalMouseUp);
  table.addEventListener('mousedown', excelGlobalMouseDown);
  table.addEventListener('mousemove', excelGlobalMouseMove);
  table.addEventListener('mouseup', excelGlobalMouseUp);
  document.addEventListener('mouseup', excelGlobalMouseUp);
}

function excelGlobalMouseDown(e) {
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('ex-cell-')) return;
  if (!window.isStockEditMode) return;
  const parts = cellEl.id.replace('ex-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  window.stockIsDragging = true;
  window.stockDragStartRow = rIdx;
  window.stockDragStartCol = cIdx;
  window.stockActiveCell.row = rIdx;
  window.stockActiveCell.col = cIdx;
  window.stockSelectedRange.startRow = rIdx;
  window.stockSelectedRange.endRow = rIdx;
  window.stockSelectedRange.startCol = cIdx;
  window.stockSelectedRange.endCol = cIdx;
  excelRefreshSelectionVisuals();
}

function excelGlobalMouseMove(e) {
  if (!window.stockIsDragging || !window.isStockEditMode) return;
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('ex-cell-')) return;
  const parts = cellEl.id.replace('ex-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  window.stockSelectedRange.startRow = Math.min(window.stockDragStartRow, rIdx);
  window.stockSelectedRange.endRow = Math.max(window.stockDragStartRow, rIdx);
  window.stockSelectedRange.startCol = Math.min(window.stockDragStartCol, cIdx);
  window.stockSelectedRange.endCol = Math.max(window.stockDragStartCol, cIdx);
  excelRefreshSelectionVisuals();
}

function excelGlobalMouseUp(e) {
  if (window.stockIsDragging) {
    window.stockIsDragging = false;
    if (window.stockSelectedRange.startRow === window.stockSelectedRange.endRow &&
        window.stockSelectedRange.startCol === window.stockSelectedRange.endCol) {
      window.stockActiveCell.row = window.stockSelectedRange.startRow;
      window.stockActiveCell.col = window.stockSelectedRange.startCol;
    }
    excelRefreshSelectionVisuals();
  }
}

function excelHandleMouseDown(event, rIdx, cIdx) {
  if (!window.isStockEditMode) return;
  const cellEl = document.getElementById('ex-cell-'+rIdx+'-'+cIdx);
  if (cellEl) cellEl.focus();
}

function excelHandleMouseOver(event, rIdx, cIdx) {}

function excelHandleCellBlur(cellElement, rIdx, cIdx) {
  if (!window.isStockEditMode) return;
  cellElement.classList.remove('cell-active-focus');
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
  if (cIdx === 4) return;
  const cellKey = rIdx+'_'+cIdx;
  if (newValue !== originalValue) {
    cellElement.classList.add('cell-stock-dirty');
    window.stockChangesQueue[cellKey] = { row: rIdx, col: cIdx, value: newValue };
  } else {
    cellElement.classList.remove('cell-stock-dirty');
    delete window.stockChangesQueue[cellKey];
  }
  updateStockButtons();
  if (cIdx === 6 || cIdx === 8) {
    const row = window.inventoryData[rIdx];
    if (row) {
      const gVal = parseFloat(row[6]) || 0;
      const iVal = parseFloat(row[8]) || 0;
      const eCell = document.getElementById('ex-cell-'+rIdx+'-4');
      if (eCell) {
        const newSum = gVal + iVal;
        eCell.innerText = newSum;
        row[4] = newSum;
        delete window.stockChangesQueue[rIdx+'_4'];
        eCell.classList.remove('cell-stock-dirty');
      }
    }
  }
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
  if (typeof renderStock === 'function') renderStock();
}

async function saveStockChangesCloud() {
  if (!window.isStockEditMode) return;
  const changesCount = Object.keys(window.stockChangesQueue).length;
  if (changesCount === 0) { alert('Нет изменённых ячеек для отправки.'); return; }
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
      setTimeout(function() { if (typeof renderStock === 'function') renderStock(); alert('✅ Данные успешно сохранены в облаке!\n' + resultText); }, 800);
    } catch (e) {
      console.error('Ошибка отправки изменений:', e);
      alert('⚠️ Ошибка сети. Изменения сохранены локально на устройстве.');
    }
  } else {
    alert('📱 Устройство офлайн. Изменения сохранены в локальный кэш.');
    if (typeof renderStock === 'function') renderStock();
  }
}

// Копирование (Ctrl+C)
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

// Вставка (Ctrl+V)
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
      if (targetC === 4) return;
      const cellKey = targetR+'_'+targetC;
      const trimmedVal = cellValue.trim();
      window.inventoryData[targetR][targetC] = trimmedVal;
      window.stockChangesQueue[cellKey] = { row: targetR, col: targetC, value: trimmedVal };
      pasteCount++;
    });
  });
  if (typeof renderStock === 'function') renderStock();
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

console.log('✅ stock_edit.js — загружен (версия 1.1)');
