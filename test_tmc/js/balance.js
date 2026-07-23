// ================================================================
// balance.js — Модуль импорта Сальдо и Сравнения остатков
// Версия 2.6 — ВОСКРЕШЕНА ТАБЛИЦА ЗАГРУЗКИ САЛЬДО
// ================================================================

window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
window.diffData = JSON.parse(localStorage.getItem('qr_diff_v1')) || [];

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
// ПОКАЗ ОБЛАСТИ ИМПОРТА EXCEL (ВОСКРЕШАЕМ)
// ================================================================

function showBalancePasteArea() {
  document.getElementById('balance-menu-buttons').classList.add('hidden');
  
  // Восстанавливаем данные из localStorage
  window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
  
  // Инициализируем Excel-матрицу
  if (typeof initExcelMatrixData === 'function') {
    initExcelMatrixData();
  } else {
    console.error('Ошибка: initExcelMatrixData не определена');
    // Создаём простую матрицу вручную
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
  
  // Рендерим Excel-грид
  if (typeof renderExcelGrid === 'function') {
    renderExcelGrid();
  } else {
    // Если renderExcelGrid не определён, используем встроенную функцию
    renderBalanceGrid();
  }
  
  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "ВНЕСТИ ИЗМЕНЕНИЯ";
    importBtn.disabled = false;
  }
  document.getElementById('balance-paste-container').classList.remove('hidden');
}

// ================================================================
// ВСТРОЕННЫЙ РЕНДЕР EXCEL-ГРИДА ДЛЯ САЛЬДО
// ================================================================

function renderBalanceGrid() {
  const head = document.getElementById('excel-grid-head');
  const body = document.getElementById('excel-grid-body');
  if (!head || !body) return;

  var colLetters = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T'];
  
  // Шапка
  var headHtml = '<tr>';
  headHtml += '<th class="excel-corner-header" style="min-width:40px;max-width:40px;background:#e8e8e8;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;cursor:pointer;" onclick="excelSelectAllBalance()">⬚</th>';
  for (var c = 0; c < 20; c++) {
    headHtml += '<th onclick="excelSelectWholeColumnBalance('+c+')" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:60px;position:sticky;top:0;z-index:10;">'+colLetters[c]+'</th>';
  }
  headHtml += '</tr>';
  head.innerHTML = headHtml;

  // Тело таблицы
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
// ВЫДЕЛЕНИЕ ДЛЯ ТАБЛИЦЫ САЛЬДО
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
  // Снимаем старые выделения
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

// Добавляем глобальные слушатели для drag
document.addEventListener('mouseup', function(e) {
  if (window.balanceIsDragging) {
    window.balanceIsDragging = false;
  }
});

// ================================================================
// ОЧИСТКА ТАБЛИЦЫ САЛЬДО
// ================================================================

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

// ================================================================
// ПРОЧИЕ ФУНКЦИИ (СРАВНЕНИЕ, ИМПОРТ, ОТЛИЧИЯ)
// ================================================================

function hideBalancePasteArea() {
  document.getElementById('balance-paste-container').classList.add('hidden');
  document.getElementById('balance-menu-buttons').classList.remove('hidden');
}

function showDiffTable() {
  var diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) {
    alert("Информация:\nТаблица отличий пуста.\n\nПожалуйста, сначала выполните операцию 'СРАВНИТЬ', чтобы рассчитать разницу остатков.");
    return;
  }

  // Регистрируем таблицу отличий в универсальном движке
  excelRegisterTable('diff', {
    data: diffMatrix,
    headers: null,
    colCount: 6,
    editMode: false,
    containerId: 'diff',
    searchInputId: 'diff-search',
    title: 'Таблица отличий',
    rowColors: {
      '#dcfce7': function(row) {
        return String(row[4] || '').indexOf('+') === 0;
      },
      '#fee2e2': function(row) {
        return String(row[4] || '').indexOf('-') === 0;
      }
    }
  });

  document.getElementById('balance-view').classList.add('hidden');
  document.getElementById('diff-table-view').classList.remove('hidden');
  excelRenderTable('diff');
}

function renderDiffTableBody() {
  var diffMatrix = window.diffData || [];
  var table = EXCEL_CORE.tables['diff'];
  if (table) {
    table.data = diffMatrix;
    excelRenderTable('diff');
  }
}

function filterDiffByColor(colorType) {
  EXCEL_CORE.filterColor = colorType;
  renderDiffTableBody();
}

function executeDatabaseComparison() {
  var stock = window.inventoryData;
  var balance = window.balanceData;
  
  if (!stock || stock.length <= 1) {
    alert("Ошибка: База остатков склада пуста. Синхронизируйте облачко ☁");
    return;
  }
  if (!balance || balance.length <= 1) {
    alert("Ошибка: База Сальдо пуста. Сначала внесите изменения или импортируйте её!");
    return;
  }

  var diffMatrix = [];
  diffMatrix.push(["Партия", "Материал", "КрТекстМатериала", "Базисная ЕИ", "Разница Остатка", "Выдано товаров"]);

  for (var i = 1; i < stock.length; i++) {
    var sRow = stock[i];
    if (!sRow || sRow.length < 5) continue;
    
    var sArt = String(sRow[0]).trim().toLowerCase();
    var sParam = String(sRow[1]).trim().toLowerCase();
    
    var q1 = parseInt(String(sRow[6]).replace(/\s+/g, '')) || 0;
    var q2 = parseInt(String(sRow[8]).replace(/\s+/g, '')) || 0;
    var sQty = q1 + q2;
    var issuedQty = parseInt(String(sRow[7]).replace(/\s+/g, '')) || 0;

    var bQty = 0;
    for (var j = 1; j < balance.length; j++) {
      var bRow = balance[j];
      if (!bRow || bRow.length < 5) continue;
      if (String(bRow[0]).trim().toLowerCase() === sArt && String(bRow[1]).trim().toLowerCase() === sParam) {
        bQty = parseInt(String(bRow[4]).replace(/\s+/g, '')) || 0;
        break;
      }
    }

    var difference = sQty - bQty;
    if (difference === 0) continue;

    var newDiffRow = [];
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
    var textPayload = "COMPARE_EXPORT|" + JSON.stringify(diffMatrix);
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

function openDiffFilterMenu(event, colIndex) {
  // Заглушка для меню фильтра
  alert('Фильтр будет доступен в следующей версии');
}

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
    // Сохраняем сальдо локально
    window.balanceData = window.excelMatrix;
    localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

    // Обновляем остатки (столбец "из.SUP" — индекс 5)
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

console.log('✅ balance.js — загружен (версия 2.6)');
