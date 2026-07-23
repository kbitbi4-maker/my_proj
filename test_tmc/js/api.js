// ================================================================
// api.js — Модуль сетевого взаимодействия и синхронизации
// Версия 2.4 — журнал выдачи с собственным выделением (как у сальдо)
// ================================================================

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbww4XB-yCHpL4mC8UWABoRp5-adrXIr7zqQ9RQI586bCgV5CiJOKqklapq018JWaU-JWQ/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

// ================================================================
// СОСТОЯНИЕ ВЫДЕЛЕНИЯ ДЛЯ ЖУРНАЛА (КАК У САЛЬДО)
// ================================================================

window.logsSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.logsIsDragging = false;
window.logsDragStartRow = null;
window.logsDragStartCol = null;

// ================================================================
// РЕНДЕРИНГ ЖУРНАЛА ВЫДАЧИ (С ВЫДЕЛЕНИЕМ)
// ================================================================

function renderLogs() {
  const body = document.getElementById('logs-body');
  const head = document.getElementById('logs-head');
  if (!body) return;
  
  // Проверяем данные
  if (!window.qrLogs || window.qrLogs.length === 0) {
    body.innerHTML = '<tr><td colspan="13" style="text-align:center;padding:20px;color:#999;">Пусто</td></tr>';
    return;
  }

  // Определяем шапку (первая строка с isHeader: true)
  let headers = null;
  let dataStart = 0;
  if (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) {
    headers = window.qrLogs[0].data;
    dataStart = 1;
  }

  // Буквы столбцов
  const colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
  const numCols = 13;

  // ============================================================
  // ШАПКА (БУКВЫ, БЕЗ НОМЕРА)
  // ============================================================
  let headHtml = '';
  headHtml += '<tr>';
  headHtml += '<th class="excel-corner" onclick="logsSelectAll()" title="Выделить всё" style="min-width:40px;max-width:40px;width:40px;background:#e8e8e8!important;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;text-align:center;user-select:none;">⬚</th>';
  for (let c = 0; c < numCols; c++) {
    const letter = colLetters[c] || String.fromCharCode(65 + c);
    headHtml += '<th id="logs-col-hdr-'+c+'" onclick="logsSelectWholeColumn('+c+')" title="Выделить столбец '+letter+'" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;white-space:normal;word-wrap:break-word;">'+letter+'</th>';
  }
  headHtml += '</tr>';
  
  // Строка с названиями столбцов (если есть)
  if (headers) {
    headHtml += '<tr style="font-weight:600;background:#f0f0f0;">';
    headHtml += '<td class="row-header-num" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:default;user-select:none;min-width:40px;max-width:40px;width:40px;padding:4px 2px;">1</td>';
    for (let c = 0; c < numCols; c++) {
      const headerName = headers[c] !== undefined && headers[c] !== '' ? headers[c] : colLetters[c] || String.fromCharCode(65 + c);
      headHtml += '<td style="border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:60px;background:#f0f0f0;color:#333;font-weight:600;white-space:normal;word-wrap:break-word;word-break:break-word;">'+headerName+'</td>';
    }
    headHtml += '</tr>';
  }
  head.innerHTML = headHtml;

  // ============================================================
  // СБОР ДАННЫХ
  // ============================================================
  let rowsData = [];
  for (let i = dataStart; i < window.qrLogs.length; i++) {
    const item = window.qrLogs[i];
    if (!item || !item.data || item.action === 'delete') continue;
    rowsData.push({ index: i, data: item.data, status: item.status });
  }

  // ============================================================
  // ТЕЛО ТАБЛИЦЫ
  // ============================================================
  let bodyHtml = "";
  
  for (var ri = 0; ri < rowsData.length; ri++) {
    var rIdx = rowsData[ri].index;
    var row = rowsData[ri].data;
    var status = rowsData[ri].status;
    var rowNum = rIdx; // Индекс в массиве

    // Статус строки (wait/ok)
    var isSynced = status === 'ok';
    var bgClass = isSynced ? '' : 'style="background:#fff3cd;"';

    // Зебра
    var zebraBg = (ri % 2 === 0) ? 'background:#e8f5e9;' : 'background:#ffffff;';

    // Проверяем, есть ли выделение
    let isRowSelected = false;
    if (window.logsSelectedRange.startRow !== null) {
      isRowSelected = (rIdx >= window.logsSelectedRange.startRow && rIdx <= window.logsSelectedRange.endRow);
    }

    bodyHtml += '<tr id="logs-row-'+rIdx+'" '+bgClass+' style="'+zebraBg+'">';
    bodyHtml += '<td class="row-header-num" id="logs-row-hdr-'+rIdx+'" onclick="logsSelectWholeRow('+rIdx+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;width:40px;padding:4px 2px;'+(isRowSelected ? 'background:#c7e0f4;' : '')+'">'+rowNum+'</td>';

    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      let displayValue = row[cIdx] !== undefined ? row[cIdx] : '';
      
      // Проверяем выделение ячейки
      let isSelected = false;
      if (window.logsSelectedRange.startRow !== null) {
        isSelected = (rIdx >= window.logsSelectedRange.startRow && rIdx <= window.logsSelectedRange.endRow &&
                      cIdx >= window.logsSelectedRange.startCol && cIdx <= window.logsSelectedRange.endCol);
      }

      const selectClass = isSelected ? 'cell-selected' : '';
      
      // Ячейка "Куда выдано" (индекс 8) — редактируемая
      if (cIdx === 8) {
        bodyHtml += '<td id="logs-cell-'+rIdx+'-'+cIdx+'" class="'+selectClass+'" style="'+zebraBg+' border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:60px;white-space:normal;word-wrap:break-word;word-break:break-word;cursor:pointer;user-select:none;" onclick="logsHandleCellClick(event,'+rIdx+','+cIdx+')" onmousedown="logsHandleMouseDown(event,'+rIdx+','+cIdx+')" onmouseover="logsHandleMouseOver(event,'+rIdx+','+cIdx+')">'+displayValue+'</td>';
      } else {
        bodyHtml += '<td id="logs-cell-'+rIdx+'-'+cIdx+'" class="'+selectClass+'" style="'+zebraBg+' border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:60px;white-space:normal;word-wrap:break-word;word-break:break-word;cursor:pointer;user-select:none;" onclick="logsHandleCellClick(event,'+rIdx+','+cIdx+')" onmousedown="logsHandleMouseDown(event,'+rIdx+','+cIdx+')" onmouseover="logsHandleMouseOver(event,'+rIdx+','+cIdx+')">'+displayValue+'</td>';
      }
    }
    bodyHtml += '</tr>';
  }
  
  body.innerHTML = bodyHtml || '<tr><td colspan="14" style="text-align:center;padding:20px;color:#999;">Пусто</td></tr>';

  // Обновляем выделение
  logsRefreshSelection();
  logsAttachDragListeners();
}

// ================================================================
// ВЫДЕЛЕНИЕ ДЛЯ ЖУРНАЛА (КАК У САЛЬДО)
// ================================================================

function logsSelectAll() {
  const data = window.qrLogs;
  if (!data || data.length === 0) return;
  
  const dataStart = (data.length > 0 && data[0] && data[0].isHeader === true) ? 1 : 0;
  if (dataStart >= data.length) return;
  
  window.logsSelectedRange.startRow = dataStart;
  window.logsSelectedRange.endRow = data.length - 1;
  window.logsSelectedRange.startCol = 0;
  window.logsSelectedRange.endCol = 12;
  logsRefreshSelection();
}

function logsSelectWholeRow(rIdx) {
  window.logsSelectedRange.startRow = rIdx;
  window.logsSelectedRange.endRow = rIdx;
  window.logsSelectedRange.startCol = 0;
  window.logsSelectedRange.endCol = 12;
  logsRefreshSelection();
}

function logsSelectWholeColumn(cIdx) {
  const data = window.qrLogs;
  if (!data || data.length === 0) return;
  
  const dataStart = (data.length > 0 && data[0] && data[0].isHeader === true) ? 1 : 0;
  if (dataStart >= data.length) return;
  
  window.logsSelectedRange.startRow = dataStart;
  window.logsSelectedRange.endRow = data.length - 1;
  window.logsSelectedRange.startCol = cIdx;
  window.logsSelectedRange.endCol = cIdx;
  logsRefreshSelection();
}

function logsHandleCellClick(event, rIdx, cIdx) {
  if (window.logsIsDragging) return;
  
  // Режим возврата — клик по строке
  if (window.isReturnMode) {
    handleLogClick(rIdx);
    return;
  }
  
  // Режим редактирования ячейки "Куда" (индекс 8)
  if (cIdx === 8 && !window.isReturnMode) {
    if (typeof enableLogCellEdit === 'function') {
      // Создаём искусственное событие
      const cellEl = document.getElementById('logs-cell-'+rIdx+'-'+cIdx);
      if (cellEl) {
        enableLogCellEdit({ target: cellEl, stopPropagation: function(){} }, rIdx);
      }
    }
    return;
  }
  
  // Выделение
  if (event.shiftKey && window.logsSelectedRange.startRow !== null) {
    window.logsSelectedRange.startRow = Math.min(window.logsSelectedRange.startRow, rIdx);
    window.logsSelectedRange.endRow = Math.max(window.logsSelectedRange.endRow, rIdx);
    window.logsSelectedRange.startCol = Math.min(window.logsSelectedRange.startCol, cIdx);
    window.logsSelectedRange.endCol = Math.max(window.logsSelectedRange.endCol, cIdx);
  } else {
    window.logsSelectedRange.startRow = rIdx;
    window.logsSelectedRange.endRow = rIdx;
    window.logsSelectedRange.startCol = cIdx;
    window.logsSelectedRange.endCol = cIdx;
  }
  
  logsRefreshSelection();
}

function logsHandleMouseDown(event, rIdx, cIdx) {
  event.preventDefault();
  window.logsIsDragging = true;
  window.logsDragStartRow = rIdx;
  window.logsDragStartCol = cIdx;
  window.logsSelectedRange.startRow = rIdx;
  window.logsSelectedRange.endRow = rIdx;
  window.logsSelectedRange.startCol = cIdx;
  window.logsSelectedRange.endCol = cIdx;
  logsRefreshSelection();
}

function logsHandleMouseOver(event, rIdx, cIdx) {
  if (!window.logsIsDragging) return;
  
  window.logsSelectedRange.startRow = Math.min(window.logsDragStartRow, rIdx);
  window.logsSelectedRange.endRow = Math.max(window.logsDragStartRow, rIdx);
  window.logsSelectedRange.startCol = Math.min(window.logsDragStartCol, cIdx);
  window.logsSelectedRange.endCol = Math.max(window.logsDragStartCol, cIdx);
  logsRefreshSelection();
}

function logsAttachDragListeners() {
  const container = document.querySelector('#result .table-wrapper');
  const table = container ? container.querySelector('table') : null;
  if (!table) return;
  
  table.removeEventListener('mousedown', logsGlobalMouseDown);
  table.removeEventListener('mousemove', logsGlobalMouseMove);
  table.removeEventListener('mouseup', logsGlobalMouseUp);
  document.removeEventListener('mouseup', logsGlobalMouseUp);
  
  table.addEventListener('mousedown', logsGlobalMouseDown);
  table.addEventListener('mousemove', logsGlobalMouseMove);
  table.addEventListener('mouseup', logsGlobalMouseUp);
  document.addEventListener('mouseup', logsGlobalMouseUp);
}

function logsGlobalMouseDown(e) {
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('logs-cell-')) return;
  
  const parts = cellEl.id.replace('logs-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  
  e.preventDefault();
  window.logsIsDragging = true;
  window.logsDragStartRow = rIdx;
  window.logsDragStartCol = cIdx;
  window.logsSelectedRange.startRow = rIdx;
  window.logsSelectedRange.endRow = rIdx;
  window.logsSelectedRange.startCol = cIdx;
  window.logsSelectedRange.endCol = cIdx;
  logsRefreshSelection();
}

function logsGlobalMouseMove(e) {
  if (!window.logsIsDragging) return;
  
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('logs-cell-')) return;
  
  const parts = cellEl.id.replace('logs-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  
  e.preventDefault();
  window.logsSelectedRange.startRow = Math.min(window.logsDragStartRow, rIdx);
  window.logsSelectedRange.endRow = Math.max(window.logsDragStartRow, rIdx);
  window.logsSelectedRange.startCol = Math.min(window.logsDragStartCol, cIdx);
  window.logsSelectedRange.endCol = Math.max(window.logsDragStartCol, cIdx);
  logsRefreshSelection();
}

function logsGlobalMouseUp(e) {
  if (window.logsIsDragging) {
    window.logsIsDragging = false;
    logsRefreshSelection();
  }
}

// ================================================================
// ОБНОВЛЕНИЕ ВИЗУАЛЬНЫХ ВЫДЕЛЕНИЙ (КАК У САЛЬДО)
// ================================================================

function logsRefreshSelection() {
  // Снимаем старые выделения
  document.querySelectorAll('#logs-body .cell-selected, #logs-body .row-selected, #logs-head .col-selected')
    .forEach(function(el) {
      el.classList.remove('cell-selected', 'row-selected', 'col-selected');
      el.style.background = '';
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.borderBottom = '';
    });
  
  // Снимаем подсветку заголовков
  const headRow = document.querySelector('#logs-head tr');
  if (headRow) {
    const cells = headRow.querySelectorAll('th');
    cells.forEach(function(el) {
      el.style.background = '';
      el.style.borderBottom = '';
    });
  }
  
  if (window.logsSelectedRange.startRow === null) return;
  
  // Подсвечиваем ячейки
  for (let r = window.logsSelectedRange.startRow; r <= window.logsSelectedRange.endRow; r++) {
    const rowHdr = document.getElementById('logs-row-hdr-'+r);
    if (rowHdr) {
      rowHdr.classList.add('row-selected');
      rowHdr.style.background = '#c7e0f4';
    }
    for (let c = window.logsSelectedRange.startCol; c <= window.logsSelectedRange.endCol; c++) {
      const cellEl = document.getElementById('logs-cell-'+r+'-'+c);
      if (cellEl) {
        cellEl.classList.add('cell-selected');
        cellEl.style.background = '#c7e0f4';
        cellEl.style.outline = '2px solid #2b5797';
        cellEl.style.outlineOffset = '-2px';
      }
    }
  }
  
  // Подсвечиваем заголовок столбца
  if (headRow) {
    const cells = headRow.querySelectorAll('th');
    if (cells[window.logsSelectedRange.startCol + 1]) {
      cells[window.logsSelectedRange.startCol + 1].style.background = '#c7e0f4';
      cells[window.logsSelectedRange.startCol + 1].style.borderBottom = '3px solid #2b5797';
    }
  }
}

// ================================================================
// КОПИРОВАНИЕ (Ctrl+C) ДЛЯ ЖУРНАЛА
// ================================================================

document.addEventListener('copy', function(e) {
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#result')) return;
  if (window.logsSelectedRange.startRow === null) return;
  
  const data = window.qrLogs;
  if (!data || data.length === 0) return;
  
  const dataStart = (data.length > 0 && data[0] && data[0].isHeader === true) ? 1 : 0;
  const { startRow, endRow, startCol, endCol } = window.logsSelectedRange;
  
  let copyData = [];
  for (let r = startRow; r <= endRow && r < data.length; r++) {
    if (!data[r] || !data[r].data) continue;
    let rowCopy = [];
    for (let c = startCol; c <= endCol && c < data[r].data.length; c++) {
      rowCopy.push(data[r].data[c] !== undefined ? data[r].data[c] : '');
    }
    copyData.push(rowCopy);
  }
  
  const tsvText = copyData.map(function(row) { return row.join('\t'); }).join('\n');
  e.clipboardData.setData('text/plain', tsvText);
  e.preventDefault();
});

// ================================================================
// ОСТАЛЬНЫЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ)
// ================================================================

function recalculateUnprocessedSup() {
  const stock = window.inventoryData;
  const logs = window.qrLogs;
  if (!stock || stock.length <= 1) return;

  console.log("Движок SUP: Запущен расчет не проведенных в SUP черновиков...");

  const dataStart = (logs.length > 0 && logs[0] && logs[0].isHeader === true) ? 1 : 0;
  
  const totalsMap = {};
  
  for (let i = dataStart; i < logs.length; i++) {
    const item = logs[i];
    if (!item || !item.data || item.action === 'delete') continue;
    const logRow = item.data;
    if (logRow.length < 6) continue;
    const artKey = String(logRow[1]).trim().toLowerCase();
    const paramKey = String(logRow[2]).trim().toLowerCase();
    const qtyVal = parseInt(logRow[5]) || 0;
    const mapKey = artKey + "|||" + paramKey;
    if (!totalsMap[mapKey]) totalsMap[mapKey] = 0;
    totalsMap[mapKey] += qtyVal;
  }

  let updatedRowsCount = 0;
  
  for (let j = 1; j < stock.length; j++) {
    const stockRow = stock[j];
    if (!stockRow || stockRow.length < 8) continue;
    const sArtKey = String(stockRow[0]).trim().toLowerCase();
    const sParamKey = String(stockRow[1]).trim().toLowerCase();
    const searchKey = sArtKey + "|||" + sParamKey;
    const currentUnprocessedQty = totalsMap[searchKey] !== undefined ? totalsMap[searchKey] : 0;
    stockRow[7] = currentUnprocessedQty;
    updatedRowsCount++;
  }

  window.inventoryData = stock;
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
  console.log("Движок SUP: Пересчет завершен. Обновлено строк: " + updatedRowsCount);
}

async function syncFromGoogle() {
  if (!navigator.onLine) return;
  
  const badge = document.getElementById('status-text-badge');
  const indicatorEl = document.getElementById('indicator');
  const titleText = document.getElementById('project-title-text');
  const syncBtn = document.getElementById('sync-btn');
  
  if (syncBtn) syncBtn.classList.add('sync-active-highlight');
  if (titleText) titleText.classList.add('hidden');
  if (badge) {
    badge.innerText = "Идет синхронизация";
    badge.className = "status-badge badge-sync-active";
  }
  if (indicatorEl) {
    indicatorEl.classList.add('sync-pulse');
  }

  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    
    if (data.logs && data.logs.length > 0) {
      window.qrLogs = [];
      window.qrLogs.push({ data: data.logs[0], isHeader: true });
      for (let i = 1; i < data.logs.length; i++) {
        window.qrLogs.push({ data: data.logs[i], status: 'ok' });
      }
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      renderLogs();
    }
    
    if (data.stock) {
      window.inventoryData = data.stock;
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
      if (typeof renderStock === 'function') renderStock();
    }
    
    if (data.balance) {
      window.balanceData = data.balance;
      localStorage.setItem('sheetsSync_сальдо', JSON.stringify(window.balanceData));
    }
    if (data.diff) {
      window.diffData = data.diff;
      localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));
    }

    recalculateUnprocessedSup();
    
    if (syncBtn) syncBtn.classList.remove('sync-active-highlight');
    if (badge) badge.className = "status-badge hidden";
    if (indicatorEl) indicatorEl.classList.remove('sync-pulse');
    if (titleText) titleText.classList.remove('hidden');
    
    alert("Глобальная синхронизация успешно завершена!\nОбновлены: Журнал выдачи, Остатки склада, Сальдо и Отчет сверки.");
  } catch (e) {
    if (syncBtn) syncBtn.classList.remove('sync-active-highlight');
    if (badge) badge.className = "status-badge hidden";
    if (indicatorEl) indicatorEl.classList.remove('sync-pulse');
    if (titleText) titleText.classList.remove('hidden');
    alert("Ошибка при синхронизации данных из облака: " + e.message);
  }
}

async function sendUnsynced() {
  if (!navigator.onLine || !window.qrLogs || !window.qrLogs.length) return;
  
  const dataStart = (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) ? 1 : 0;
  
  for (let i = dataStart; i < window.qrLogs.length; i++) {
    const item = window.qrLogs[i];
    if (!item || item.status !== 'wait') continue;

    item.status = 'syncing';
    
    try {
      let bodyData = "";
      if (item.action === 'delete') {
        const art = item.itemKeys || "";
        const param = item.itemKeys || "";
        bodyData = "DELETE_ROW|" + item.id + "|" + item.qty + "|" + art + "|" + param;
      } else if (item.data) {
        bodyData = JSON.stringify({ row: item.data });
      }

      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: bodyData
      });

      if (item.action === 'delete') {
        window.qrLogs.splice(i, 1);
        i--;
      } else {
        item.status = 'ok';
      }
      
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      renderLogs();
      
    } catch (e) {
      console.error("Ошибка при фоновой отправке:", e);
      item.status = 'wait';
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      break;
    }
  }
}

document.addEventListener("DOMContentLoaded", function() {
  renderLogs();
  sendUnsynced();
});

console.log('✅ api.js — загружен (версия 2.4, журнал с выделением)');
