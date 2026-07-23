// ================================================================
// balance.js — Модуль импорта Сальдо и Сравнения остатков
// Версия 2.7 — УБРАНА ДВОЙНАЯ ШАПКА, НАЗВАНИЯ В ТЕЛЕ ТАБЛИЦЫ
// ================================================================

window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
window.diffData = JSON.parse(localStorage.getItem('qr_diff_v1')) || [];

// ================================================================
// СОСТОЯНИЕ ВЫДЕЛЕНИЯ ДЛЯ ТАБЛИЦЫ ОТЛИЧИЙ
// ================================================================

window.diffSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.diffIsDragging = false;
window.diffDragStartRow = null;
window.diffDragStartCol = null;
window.diffFilterColor = "all";

// ================================================================
// ОТКРЫТИЕ МЕНЮ САЛЬДО
// ================================================================

function openBalanceMenu() {
  if (typeof stopCamera === 'function') stopCamera();
  document.getElementById('balance-menu-buttons').classList.remove('hidden');
  document.getElementById('balance-paste-container').classList.add('hidden');
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  if (document.getElementById('where-view')) document.getElementById('where-view').classList.add('hidden');
  if (document.getElementById('return-view')) document.getElementById('return-view').classList.add('hidden');
  if (document.getElementById('diff-table-view')) document.getElementById('diff-table-view').classList.add('hidden');
  document.getElementById('balance-view').classList.remove('hidden');
}

// ================================================================
// ПОКАЗ ОБЛАСТИ ИМПОРТА EXCEL (САЛЬДО)
// ================================================================

function showBalancePasteArea() {
  document.getElementById('balance-menu-buttons').classList.add('hidden');
  
  window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
  
  if (typeof initExcelMatrixData === 'function') {
    initExcelMatrixData();
  } else {
    window.excelMatrix = [];
    for (var r = 0; r < 800; r++) {
      var row = [];
      for (var c = 0; c < 20; c++) {
        if (window.balanceData[r] && window.balanceData[r][c] !== undefined) {
          row.push(String(window.balanceData[r][c]));
        } else {
          row.push('');
        }
      }
      window.excelMatrix.push(row);
    }
  }
  
  if (typeof renderExcelGrid === 'function') {
    renderExcelGrid();
  } else {
    renderBalanceGrid();
  }
  
  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "ВНЕСТИ ИЗМЕНЕНИЯ";
    importBtn.disabled = false;
  }
  document.getElementById('balance-paste-container').classList.remove('hidden');
}

function hideBalancePasteArea() {
  document.getElementById('balance-paste-container').classList.add('hidden');
  document.getElementById('balance-menu-buttons').classList.remove('hidden');
}

// ================================================================
// РЕНДЕРИНГ ТАБЛИЦЫ ОТЛИЧИЙ (ПРАВИЛЬНАЯ СТРУКТУРА)
// ================================================================

function showDiffTable() {
  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) {
    alert("Информация:\nТаблица отличий пуста.\n\nПожалуйста, сначала выполните операцию 'СРАВНИТЬ', чтобы рассчитать разницу остатков.");
    return;
  }

  // Рендерим таблицу отличий
  renderDiffTable();
  
  document.getElementById('balance-view').classList.add('hidden');
  document.getElementById('diff-table-view').classList.remove('hidden');
}

function renderDiffTable() {
  const head = document.getElementById('diff-head');
  const body = document.getElementById('diff-body');
  if (!head || !body) return;

  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Таблица отличий пуста</td></tr>';
    return;
  }

  // Первая строка матрицы — названия столбцов
  const headerRow = diffMatrix[0] || ['Партия', 'Материал', 'КрТекстМатериала', 'Базисная ЕИ', 'Разница Остатка', 'Выдано товаров'];
  const colLetters = ['A','B','C','D','E','F'];
  const numCols = 6;

  // ============================================================
  // ШАПКА: ТОЛЬКО БУКВЫ (БЕЗ НОМЕРА)
  // ============================================================
  let headHtml = '';
  headHtml += '<tr>';
  headHtml += '<th class="excel-corner" onclick="diffSelectAll()" title="Выделить всё" style="min-width:40px;max-width:40px;width:40px;background:#e8e8e8!important;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;text-align:center;user-select:none;">⬚</th>';
  for (let c = 0; c < numCols; c++) {
    const letter = colLetters[c] || String.fromCharCode(65 + c);
    headHtml += '<th id="diff-col-hdr-'+c+'" onclick="diffSelectWholeColumn('+c+')" title="Выделить столбец '+letter+'" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:80px;position:sticky;top:0;z-index:10;white-space:normal;word-wrap:break-word;">'+letter+'</th>';
  }
  headHtml += '</tr>';
  head.innerHTML = headHtml;

  // ============================================================
  // ТЕЛО: СТРОКА 1 — НАЗВАНИЯ (НОМЕР 1), ДАЛЕЕ ДАННЫЕ (НОМЕР 2...)
  // ============================================================
  
  // Собираем все строки: сначала названия, потом данные
  let allRows = [];
  // Добавляем строку с названиями (индекс 0)
  allRows.push({ index: 0, data: headerRow, isHeader: true });
  // Добавляем остальные строки (данные)
  for (let i = 1; i < diffMatrix.length; i++) {
    allRows.push({ index: i, data: diffMatrix[i] });
  }

  // Поиск и фильтрация
  const searchInput = document.getElementById('diff-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  let filteredRows = allRows;
  if (term !== "") {
    filteredRows = allRows.filter(function(row) {
      return row.data.some(function(cell) { return String(cell).toLowerCase().includes(term); });
    });
    // Всегда сохраняем первую строку (названия)
    if (filteredRows.length > 0 && filteredRows[0].index !== 0) {
      // Если после фильтрации первая строка не является названиями, вставляем названия
      filteredRows.unshift(allRows[0]);
    }
  }

  // Фильтр по цвету (только для данных, не для названий)
  if (window.diffFilterColor !== "all") {
    filteredRows = filteredRows.filter(function(row, idx) {
      if (idx === 0) return true; // всегда оставляем названия
      const lastCell = String(row.data[4] || '').trim();
      if (window.diffFilterColor === "green") return lastCell.indexOf('+') === 0;
      if (window.diffFilterColor === "red") return lastCell.indexOf('-') === 0;
      return true;
    });
  }

  let bodyHtml = "";
  
  for (var ri = 0; ri < filteredRows.length; ri++) {
    var rowData = filteredRows[ri];
    var rIdx = rowData.index;
    var row = rowData.data;
    var rowNum = ri + 1; // нумерация начинается с 1

    // Определяем цвет строки (только для данных, не для названий)
    let rowColor = '';
    if (ri > 0) {
      const diffValue = String(row[4] || '').trim();
      if (diffValue.indexOf('+') === 0) {
        rowColor = '#dcfce7'; // зелёный — профицит
      } else if (diffValue.indexOf('-') === 0) {
        rowColor = '#fee2e2'; // красный — дефицит
      }
    }

    // Зебра для названий — серый фон, для данных — белый (цвета строк задаются выше)
    var bgStyle = (ri === 0) ? 'background:#f0f0f0;' : (rowColor ? 'background:'+rowColor+';' : 'background:#ffffff;');

    // Проверяем выделение строки
    let isRowSelected = false;
    if (window.diffSelectedRange.startRow !== null) {
      isRowSelected = (rIdx >= window.diffSelectedRange.startRow && rIdx <= window.diffSelectedRange.endRow);
    }

    bodyHtml += '<tr id="diff-row-'+rIdx+'" style="'+bgStyle+'">';
    bodyHtml += '<td class="row-header-num" id="diff-row-hdr-'+rIdx+'" onclick="diffSelectWholeRow('+rIdx+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;width:40px;padding:4px 2px;'+(isRowSelected ? 'background:#c7e0f4;' : '')+'">'+rowNum+'</td>';

    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      let displayValue = row[cIdx] !== undefined ? row[cIdx] : '';
      
      // Проверяем выделение ячейки
      let isSelected = false;
      if (window.diffSelectedRange.startRow !== null) {
        isSelected = (rIdx >= window.diffSelectedRange.startRow && rIdx <= window.diffSelectedRange.endRow &&
                      cIdx >= window.diffSelectedRange.startCol && cIdx <= window.diffSelectedRange.endCol);
      }

      const selectClass = isSelected ? 'cell-selected' : '';
      
      bodyHtml += '<td id="diff-cell-'+rIdx+'-'+cIdx+'" class="'+selectClass+'" style="'+bgStyle+' border:1px solid #d0d7de;padding:4px 8px;text-align:left;font-size:13px;min-width:80px;white-space:normal;word-wrap:break-word;word-break:break-word;cursor:pointer;user-select:none;" onclick="diffHandleCellClick(event,'+rIdx+','+cIdx+')" onmousedown="diffHandleMouseDown(event,'+rIdx+','+cIdx+')" onmouseover="diffHandleMouseOver(event,'+rIdx+','+cIdx+')">'+displayValue+'</td>';
    }
    bodyHtml += '</tr>';
  }
  
  body.innerHTML = bodyHtml || '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Совпадений или расхождений не найдено</td></tr>';

  // Обновляем выделение
  diffRefreshSelection();
  diffAttachDragListeners();
}

function renderDiffTableBody() {
  renderDiffTable();
}

// ================================================================
// ВЫДЕЛЕНИЕ ДЛЯ ТАБЛИЦЫ ОТЛИЧИЙ
// ================================================================

function diffSelectAll() {
  const data = window.diffData;
  if (!data || data.length === 0) return;
  
  window.diffSelectedRange.startRow = 0;
  window.diffSelectedRange.endRow = data.length - 1;
  window.diffSelectedRange.startCol = 0;
  window.diffSelectedRange.endCol = 5;
  diffRefreshSelection();
}

function diffSelectWholeRow(rIdx) {
  window.diffSelectedRange.startRow = rIdx;
  window.diffSelectedRange.endRow = rIdx;
  window.diffSelectedRange.startCol = 0;
  window.diffSelectedRange.endCol = 5;
  diffRefreshSelection();
}

function diffSelectWholeColumn(cIdx) {
  const data = window.diffData;
  if (!data || data.length === 0) return;
  
  window.diffSelectedRange.startRow = 0;
  window.diffSelectedRange.endRow = data.length - 1;
  window.diffSelectedRange.startCol = cIdx;
  window.diffSelectedRange.endCol = cIdx;
  diffRefreshSelection();
}

function diffHandleCellClick(event, rIdx, cIdx) {
  if (window.diffIsDragging) return;
  
  if (event.shiftKey && window.diffSelectedRange.startRow !== null) {
    window.diffSelectedRange.startRow = Math.min(window.diffSelectedRange.startRow, rIdx);
    window.diffSelectedRange.endRow = Math.max(window.diffSelectedRange.endRow, rIdx);
    window.diffSelectedRange.startCol = Math.min(window.diffSelectedRange.startCol, cIdx);
    window.diffSelectedRange.endCol = Math.max(window.diffSelectedRange.endCol, cIdx);
  } else {
    window.diffSelectedRange.startRow = rIdx;
    window.diffSelectedRange.endRow = rIdx;
    window.diffSelectedRange.startCol = cIdx;
    window.diffSelectedRange.endCol = cIdx;
  }
  
  diffRefreshSelection();
}

function diffHandleMouseDown(event, rIdx, cIdx) {
  event.preventDefault();
  window.diffIsDragging = true;
  window.diffDragStartRow = rIdx;
  window.diffDragStartCol = cIdx;
  window.diffSelectedRange.startRow = rIdx;
  window.diffSelectedRange.endRow = rIdx;
  window.diffSelectedRange.startCol = cIdx;
  window.diffSelectedRange.endCol = cIdx;
  diffRefreshSelection();
}

function diffHandleMouseOver(event, rIdx, cIdx) {
  if (!window.diffIsDragging) return;
  
  window.diffSelectedRange.startRow = Math.min(window.diffDragStartRow, rIdx);
  window.diffSelectedRange.endRow = Math.max(window.diffDragStartRow, rIdx);
  window.diffSelectedRange.startCol = Math.min(window.diffDragStartCol, cIdx);
  window.diffSelectedRange.endCol = Math.max(window.diffDragStartCol, cIdx);
  diffRefreshSelection();
}

function diffAttachDragListeners() {
  const container = document.querySelector('#diff-table-view .table-wrapper');
  const table = container ? container.querySelector('table') : null;
  if (!table) return;
  
  table.removeEventListener('mousedown', diffGlobalMouseDown);
  table.removeEventListener('mousemove', diffGlobalMouseMove);
  table.removeEventListener('mouseup', diffGlobalMouseUp);
  document.removeEventListener('mouseup', diffGlobalMouseUp);
  
  table.addEventListener('mousedown', diffGlobalMouseDown);
  table.addEventListener('mousemove', diffGlobalMouseMove);
  table.addEventListener('mouseup', diffGlobalMouseUp);
  document.addEventListener('mouseup', diffGlobalMouseUp);
}

function diffGlobalMouseDown(e) {
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('diff-cell-')) return;
  
  const parts = cellEl.id.replace('diff-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  
  e.preventDefault();
  window.diffIsDragging = true;
  window.diffDragStartRow = rIdx;
  window.diffDragStartCol = cIdx;
  window.diffSelectedRange.startRow = rIdx;
  window.diffSelectedRange.endRow = rIdx;
  window.diffSelectedRange.startCol = cIdx;
  window.diffSelectedRange.endCol = cIdx;
  diffRefreshSelection();
}

function diffGlobalMouseMove(e) {
  if (!window.diffIsDragging) return;
  
  const cellEl = e.target.closest('td');
  if (!cellEl || !cellEl.id || !cellEl.id.startsWith('diff-cell-')) return;
  
  const parts = cellEl.id.replace('diff-cell-', '').split('-');
  const rIdx = parseInt(parts[0]);
  const cIdx = parseInt(parts[1]);
  
  e.preventDefault();
  window.diffSelectedRange.startRow = Math.min(window.diffDragStartRow, rIdx);
  window.diffSelectedRange.endRow = Math.max(window.diffDragStartRow, rIdx);
  window.diffSelectedRange.startCol = Math.min(window.diffDragStartCol, cIdx);
  window.diffSelectedRange.endCol = Math.max(window.diffDragStartCol, cIdx);
  diffRefreshSelection();
}

function diffGlobalMouseUp(e) {
  if (window.diffIsDragging) {
    window.diffIsDragging = false;
    diffRefreshSelection();
  }
}

// ================================================================
// ОБНОВЛЕНИЕ ВИЗУАЛЬНЫХ ВЫДЕЛЕНИЙ
// ================================================================

function diffRefreshSelection() {
  // Снимаем старые выделения
  document.querySelectorAll('#diff-body .cell-selected, #diff-body .row-selected, #diff-head .col-selected')
    .forEach(function(el) {
      el.classList.remove('cell-selected', 'row-selected', 'col-selected');
      el.style.background = '';
      el.style.outline = '';
      el.style.outlineOffset = '';
      el.style.borderBottom = '';
    });
  
  // Снимаем подсветку заголовков (первая строка шапки — буквы)
  const headRow = document.querySelector('#diff-head tr:first-child');
  if (headRow) {
    const cells = headRow.querySelectorAll('th');
    cells.forEach(function(el) {
      el.style.background = '';
      el.style.borderBottom = '';
    });
  }
  
  if (window.diffSelectedRange.startRow === null) return;
  
  // Подсвечиваем ячейки
  for (let r = window.diffSelectedRange.startRow; r <= window.diffSelectedRange.endRow; r++) {
    const rowHdr = document.getElementById('diff-row-hdr-'+r);
    if (rowHdr) {
      rowHdr.classList.add('row-selected');
      rowHdr.style.background = '#c7e0f4';
    }
    for (let c = window.diffSelectedRange.startCol; c <= window.diffSelectedRange.endCol; c++) {
      const cellEl = document.getElementById('diff-cell-'+r+'-'+c);
      if (cellEl) {
        cellEl.classList.add('cell-selected');
        cellEl.style.background = '#c7e0f4';
        cellEl.style.outline = '2px solid #2b5797';
        cellEl.style.outlineOffset = '-2px';
      }
    }
  }
  
  // Подсвечиваем заголовок столбца (первая строка шапки — буквы)
  if (headRow) {
    const cells = headRow.querySelectorAll('th');
    if (cells[window.diffSelectedRange.startCol + 1]) {
      cells[window.diffSelectedRange.startCol + 1].style.background = '#c7e0f4';
      cells[window.diffSelectedRange.startCol + 1].style.borderBottom = '3px solid #2b5797';
    }
  }
}

// ================================================================
// КОПИРОВАНИЕ (Ctrl+C) ДЛЯ ТАБЛИЦЫ ОТЛИЧИЙ
// ================================================================

document.addEventListener('copy', function(e) {
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#diff-table-view')) return;
  if (window.diffSelectedRange.startRow === null) return;
  
  const data = window.diffData;
  if (!data || data.length === 0) return;
  
  const { startRow, endRow, startCol, endCol } = window.diffSelectedRange;
  
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
// ФИЛЬТРЫ И СОРТИРОВКА
// ================================================================

function filterDiffByColor(colorType) {
  window.diffFilterColor = colorType;
  renderDiffTable();
}

function openDiffFilterMenu(event, colIndex) {
  // Заглушка, можно реализовать позже
  alert('Фильтр будет доступен в следующей версии');
}

// ================================================================
// ВЫПОЛНЕНИЕ СВЕРКИ (СОЗДАНИЕ ТАБЛИЦЫ ОТЛИЧИЙ)
// ================================================================

function executeDatabaseComparison() {
  const stock = window.inventoryData;
  const balance = window.balanceData;
  
  if (!stock || stock.length <= 1) {
    alert("Ошибка: База остатков склада пуста. Синхронизируйте облачко ☁");
    return;
  }
  if (!balance || balance.length <= 1) {
    alert("Ошибка: База Сальдо пуста. Сначала внесите изменения или импортируйте её!");
    return;
  }

  let diffMatrix = [];
  diffMatrix.push(["Партия", "Материал", "КрТекстМатериала", "Базисная ЕИ", "Разница Остатка", "Выдано товаров"]);

  for (let i = 1; i < stock.length; i++) {
    const sRow = stock[i];
    if (!sRow || sRow.length < 5) continue;
    
    const sArt = String(sRow[0]).trim().toLowerCase();
    const sParam = String(sRow[1]).trim().toLowerCase();
    
    const q1 = parseInt(String(sRow[6]).replace(/\s+/g, '')) || 0;
    const q2 = parseInt(String(sRow[8]).replace(/\s+/g, '')) || 0;
    const sQty = q1 + q2;
    const issuedQty = parseInt(String(sRow[7]).replace(/\s+/g, '')) || 0;

    let bQty = 0;
    for (let j = 1; j < balance.length; j++) {
      const bRow = balance[j];
      if (!bRow || bRow.length < 5) continue;
      if (String(bRow[0]).trim().toLowerCase() === sArt && String(bRow[1]).trim().toLowerCase() === sParam) {
        bQty = parseInt(String(bRow[4]).replace(/\s+/g, '')) || 0;
        break;
      }
    }

    const difference = sQty - bQty;
    if (difference === 0) continue;

    let newDiffRow = [];
    newDiffRow.push(sRow[0] || '');
    newDiffRow.push(sRow[1] || '');
    newDiffRow.push(sRow[2] || '');
    newDiffRow.push(sRow[3] || '');
    newDiffRow.push(difference > 0 ? "+" + difference : String(difference));
    newDiffRow.push(issuedQty);
    
    diffMatrix.push(newDiffRow);
  }

  window.diffData = diffMatrix;
  localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));

  var totalDiffsCount = diffMatrix.length - 1;
  var alertMessage = "РЕЗУЛЬТАТЫ СВЕРКИ ОСТАТКОВ:\n\nВыявлено расхождений: " + totalDiffsCount + " поз.\nЛокальное хранилище: УСПЕШНО ЗАПИСАНО.\n";

  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    alertMessage += "Статус сети: Онлайн. Отправка в облако...";
    alert(alertMessage);
    const textPayload = "COMPARE_EXPORT|" + JSON.stringify(diffMatrix);
    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: textPayload
    })
    .then(function(res) { return res.text(); })
    .then(function(serverText) {
      alert("ОТВЕТ СЕРВЕРА:\n\n" + serverText);
    })
    .catch(function(err) {
      alert("Данные сохранены на телефоне, но ошибка выгрузки: " + err.message);
    });
  } else {
    alertMessage += "Статус сети: Офлайн. Данные не отправлены.";
    alert(alertMessage);
  }
}

// ================================================================
// ИМПОРТ ТАБЛИЦЫ ИЗ EXCEL (САЛЬДО)
// ================================================================

async function processTextTableImport() {
  if (!window.excelMatrix || window.excelMatrix.length === 0) {
    alert("Ошибка: Сетка Excel пуста или не инициализирована.");
    return;
  }

  var importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "⏳ Сохранение...";
    importBtn.disabled = true;
  }

  try {
    window.balanceData = window.excelMatrix;
    localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

    var stock = window.inventoryData;
    if (stock && stock.length > 1) {
      for (var i = 1; i < stock.length; i++) {
        var sRow = stock[i];
        if (!sRow || sRow.length < 3) continue;
        var sArt = String(sRow[0]).trim().toLowerCase();
        var sParam = String(sRow[1]).trim().toLowerCase();
        for (var j = 0; j < window.excelMatrix.length; j++) {
          var bRow = window.excelMatrix[j];
          if (!bRow || bRow.length < 5) continue;
          if (String(bRow[0]).trim().toLowerCase() === sArt && String(bRow[1]).trim().toLowerCase() === sParam) {
            sRow[5] = parseInt(String(bRow[4]).replace(/\s+/g, '')) || 0;
            break;
          }
        }
      }
      window.inventoryData = stock;
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
      if (typeof renderStock === 'function') renderStock();
    }

    if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
      var rangePayload = {
        startRow: 1,
        startCol: 1,
        numRows: window.excelMatrix.length,
        numCols: window.excelMatrix[0].length,
        values2D: window.excelMatrix
      };
      var textPayload = "TABLE_RANGE_EXPORT|" + JSON.stringify(rangePayload);
      var response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      var serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА:\n\n" + serverText);
      hideBalancePasteArea();
    } else {
      alert("Сохранено локально на телефоне офлайн.");
      hideBalancePasteArea();
    }
  } catch (err) {
    alert("Критическая ошибка: " + err.message);
  }
  
  if (importBtn) {
    importBtn.innerText = "ВНЕСТИ ИЗМЕНЕНИЯ";
    importBtn.disabled = false;
  }
}

// ================================================================
// ВСТРОЕННЫЙ РЕНДЕР EXCEL-ГРИДА ДЛЯ САЛЬДО (ЕСЛИ ОТСУТСТВУЕТ ВНЕШНИЙ)
// ================================================================

function renderBalanceGrid() {
  const head = document.getElementById('excel-grid-head');
  const body = document.getElementById('excel-grid-body');
  if (!head || !body) return;

  var colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
  
  var headHtml = '<tr>';
  headHtml += '<th class="excel-corner-header" style="min-width:40px;max-width:40px;background:#e8e8e8;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;" onclick="excelSelectAllBalance()">⬚</th>';
  for (var c = 0; c < 20; c++) {
    headHtml += '<th onclick="excelSelectWholeColumnBalance('+c+')" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;">'+colLetters[c]+'</th>';
  }
  headHtml += '</tr>';
  head.innerHTML = headHtml;

  var matrix = window.excelMatrix || [];
  var bodyHtml = "";
  for (var r = 0; r < 800; r++) {
    bodyHtml += '<tr>';
    bodyHtml += '<td class="row-header-num" onclick="excelSelectWholeRowBalance('+r+')" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;cursor:pointer;user-select:none;min-width:40px;max-width:40px;padding:4px 2px;">'+(r+1)+'</td>';
    
    for (var c = 0; c < 20; c++) {
      var cellValue = (matrix[r] && matrix[r][c] !== undefined) ? matrix[r][c] : '';
      bodyHtml += '<td id="bal-cell-'+r+'-'+c+'" onclick="excelHandleBalanceCellClick(event,'+r+','+c+')" onmousedown="excelHandleBalanceMouseDown(event,'+r+','+c+')" onmouseover="excelHandleBalanceMouseOver(event,'+r+','+c+')" style="border:1px solid #d0d7de;padding:4px 6px;text-align:left;font-size:13px;min-width:60px;background:#ffffff;color:#000;cursor:pointer;user-select:none;">'+cellValue+'</td>';
    }
    bodyHtml += '</tr>';
  }
  body.innerHTML = bodyHtml;
}

// ================================================================
// ВЫДЕЛЕНИЕ ДЛЯ ТАБЛИЦЫ САЛЬДО (ЕСЛИ НЕТ ВНЕШНИХ ФУНКЦИЙ)
// ================================================================

window.balanceSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.balanceIsDragging = false;
window.balanceDragStartRow = null;
window.balanceDragStartCol = null;

function excelSelectAllBalance() {
  window.balanceSelectedRange.startRow = 0;
  window.balanceSelectedRange.endRow = 799;
  window.balanceSelectedRange.startCol = 0;
  window.balanceSelectedRange.endCol = 19;
  refreshBalanceSelection();
}

function excelSelectWholeRowBalance(row) {
  window.balanceSelectedRange.startRow = row;
  window.balanceSelectedRange.endRow = row;
  window.balanceSelectedRange.startCol = 0;
  window.balanceSelectedRange.endCol = 19;
  refreshBalanceSelection();
}

function excelSelectWholeColumnBalance(col) {
  window.balanceSelectedRange.startRow = 0;
  window.balanceSelectedRange.endRow = 799;
  window.balanceSelectedRange.startCol = col;
  window.balanceSelectedRange.endCol = col;
  refreshBalanceSelection();
}

function excelHandleBalanceCellClick(event, row, col) {
  if (event.shiftKey && window.balanceSelectedRange.startRow !== null) {
    window.balanceSelectedRange.startRow = Math.min(window.balanceSelectedRange.startRow, row);
    window.balanceSelectedRange.endRow = Math.max(window.balanceSelectedRange.endRow, row);
    window.balanceSelectedRange.startCol = Math.min(window.balanceSelectedRange.startCol, col);
    window.balanceSelectedRange.endCol = Math.max(window.balanceSelectedRange.endCol, col);
  } else {
    window.balanceSelectedRange.startRow = row;
    window.balanceSelectedRange.endRow = row;
    window.balanceSelectedRange.startCol = col;
    window.balanceSelectedRange.endCol = col;
  }
  refreshBalanceSelection();
}

function excelHandleBalanceMouseDown(event, row, col) {
  event.preventDefault();
  window.balanceIsDragging = true;
  window.balanceDragStartRow = row;
  window.balanceDragStartCol = col;
  window.balanceSelectedRange.startRow = row;
  window.balanceSelectedRange.endRow = row;
  window.balanceSelectedRange.startCol = col;
  window.balanceSelectedRange.endCol = col;
  refreshBalanceSelection();
}

function excelHandleBalanceMouseOver(event, row, col) {
  if (!window.balanceIsDragging) return;
  window.balanceSelectedRange.startRow = Math.min(window.balanceDragStartRow, row);
  window.balanceSelectedRange.endRow = Math.max(window.balanceDragStartRow, row);
  window.balanceSelectedRange.startCol = Math.min(window.balanceDragStartCol, col);
  window.balanceSelectedRange.endCol = Math.max(window.balanceDragStartCol, col);
  refreshBalanceSelection();
}

function refreshBalanceSelection() {
  document.querySelectorAll('#excel-grid-body .cell-selected, #excel-grid-body .cell-active-focus')
    .forEach(function(el) {
      el.classList.remove('cell-selected', 'cell-active-focus');
      el.style.background = '';
      el.style.outline = '';
      el.style.outlineOffset = '';
    });
  
  if (window.balanceSelectedRange.startRow === null) return;
  
  for (var r = window.balanceSelectedRange.startRow; r <= window.balanceSelectedRange.endRow; r++) {
    for (var c = window.balanceSelectedRange.startCol; c <= window.balanceSelectedRange.endCol; c++) {
      var cellEl = document.getElementById('bal-cell-'+r+'-'+c);
      if (cellEl) {
        cellEl.classList.add('cell-selected');
        cellEl.style.background = '#c7e0f4';
        cellEl.style.outline = '2px solid #2b5797';
        cellEl.style.outlineOffset = '-2px';
      }
    }
  }
}

document.addEventListener('mouseup', function(e) {
  if (window.balanceIsDragging) {
    window.balanceIsDragging = false;
  }
});

function clearExcelGridData() {
  if (!confirm("Вы уверены, что хотите полностью очистить текущую сетку Сальдо?")) return;
  
  window.excelMatrix = [];
  for (var r = 0; r < 800; r++) {
    var row = [];
    for (var c = 0; c < 20; c++) {
      row.push("");
    }
    window.excelMatrix.push(row);
  }
  window.balanceSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  renderBalanceGrid();
}

console.log('✅ balance.js — загружен (версия 2.7, правильная структура)');
