// ================================================================
// balance.js — Модуль импорта Сальдо и Сравнения остатков
// Версия 2.3 — исправлена шапка таблицы отличий
// ================================================================

window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
window.diffData = JSON.parse(localStorage.getItem('qr_diff_v1')) || [];
window.diffFilterColor = "all";
window.diffSortDirection = {};

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

function showBalancePasteArea() {
  document.getElementById('balance-menu-buttons').classList.add('hidden');
  if (typeof initExcelMatrixData === 'function' && typeof renderExcelGrid === 'function') {
    initExcelMatrixData();
    renderExcelGrid();
  } else {
    console.error("Критическая ошибка: Движок js/excel_grid.js не подключен.");
  }
  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "ВНЕСТИ ИЗМЕНЕНИЯ";
    importBtn.disabled = false;
  }
  document.getElementById('balance-paste-container').classList.remove('hidden');
}

function hideBalancePasteArea() {
  const pasteContainer = document.getElementById('balance-paste-container');
  if (pasteContainer) pasteContainer.classList.add('hidden');
  const menuButtons = document.getElementById('balance-menu-buttons');
  if (menuButtons) menuButtons.classList.remove('hidden');
}

function showDiffTable() {
  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) {
    alert("Информация:\nТаблица отличий пуста.\n\nПожалуйста, сначала выполните операцию 'СРАВНИТЬ', чтобы рассчитать разницу остатков.");
    return;
  }

  const head = document.getElementById('diff-head');
  const body = document.getElementById('diff-body');
  if (!head || !body) return;

  const searchInput = document.getElementById('diff-search');
  if (searchInput) searchInput.value = "";
  window.diffFilterColor = "all";

  // ============================================================
  // ФОРМИРУЕМ ШАПКУ ЦЕЛИКОМ (БЕЗ АПЕНДИКСА)
  // ============================================================
  const headers = diffMatrix[0] || ['Партия', 'Материал', 'КрТекстМатериала', 'Базисная ЕИ', 'Разница Остатка', 'Выдано товаров'];
  const colLetters = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // СТРОКА 1: БУКВЫ
  let headHtml = '<tr>';
  headHtml += '<th class="excel-corner" style="min-width:40px;max-width:40px;background:#e8e8e8!important;border-right:2px solid #a0a0a0;border-bottom:1px solid #d0d7de;"></th>';
  for (let c = 0; c < 6; c++) {
    const letter = colLetters[c] || String.fromCharCode(65 + c);
    headHtml += '<th onclick="diffSortByColumn('+c+')" style="background:#f0f0f0;color:#333;font-weight:600;font-size:12px;padding:6px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:pointer;user-select:none;min-width:80px;position:sticky;top:0;z-index:10;">'+letter+'</th>';
  }
  headHtml += '</tr>';
  
  // СТРОКА 2: НАЗВАНИЯ СТОЛБЦОВ
  headHtml += '<tr>';
  headHtml += '<th style="min-width:40px;max-width:40px;background:#e8e8e8!important;border-right:2px solid #a0a0a0;border-bottom:2px solid #a0a0a0;"></th>';
  for (let h = 0; h < 6; h++) {
    const headerName = headers[h] !== undefined && headers[h] !== '' ? headers[h] : colLetters[h] || String.fromCharCode(65 + h);
    headHtml += '<th style="background:#f0f0f0;color:#333;font-weight:600;font-size:11px;padding:4px 4px;border:1px solid #d0d7de;border-bottom:2px solid #a0a0a0;text-align:center;cursor:default;user-select:none;min-width:80px;position:sticky;top:24px;z-index:10;white-space:normal;word-wrap:break-word;">'+headerName+'</th>';
  }
  headHtml += '</tr>';
  
  // Устанавливаем шапку
  head.innerHTML = headHtml;

  // Рендерим тело
  renderDiffTableBody();

  document.getElementById('balance-view').classList.add('hidden');
  document.getElementById('diff-table-view').classList.remove('hidden');
}

function diffSortByColumn(cIdx) {
  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) return;
  const header = diffMatrix[0];
  let dataRows = diffMatrix.slice(1);
  
  if (window.diffSortDirection[cIdx] === 'asc') {
    window.diffSortDirection[cIdx] = 'desc';
  } else if (window.diffSortDirection[cIdx] === 'desc') {
    window.diffSortDirection[cIdx] = null;
  } else {
    window.diffSortDirection[cIdx] = 'asc';
  }
  
  const dir = window.diffSortDirection[cIdx];
  if (dir) {
    dataRows.sort(function(a, b) {
      let valA = String(a[cIdx] || '').toLowerCase().trim();
      let valB = String(b[cIdx] || '').toLowerCase().trim();
      let numA = parseFloat(valA.replace(/[+]/g, ''));
      let numB = parseFloat(valB.replace(/[+]/g, ''));
      if (!isNaN(numA) && !isNaN(numB)) {
        return dir === 'asc' ? numA - numB : numB - numA;
      }
      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  window.diffData = [header, ...dataRows];
  renderDiffTableBody();
}

function renderDiffTableBody() {
  const body = document.getElementById('diff-body');
  if (!body) return;

  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Таблица отличий пуста</td></tr>';
    return;
  }

  const searchInput = document.getElementById('diff-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

  let rowsData = diffMatrix.slice(1);

  if (term !== "") {
    rowsData = rowsData.filter(function(row) {
      return row.some(function(cell) { return String(cell).toLowerCase().includes(term); });
    });
  }

  if (window.diffFilterColor !== "all") {
    rowsData = rowsData.filter(function(row) {
      const lastCell = String(row[4] || '').trim();
      if (window.diffFilterColor === "green") return lastCell.indexOf('+') === 0;
      if (window.diffFilterColor === "red") return lastCell.indexOf('-') === 0;
      return true;
    });
  }

  if (rowsData.length === 0) {
    body.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:#999;">Совпадений или расхождений не найдено</td></tr>';
    return;
  }

  let bodyHtml = "";
  for (var ri = 0; ri < rowsData.length; ri++) {
    var row = rowsData[ri];
    if (!row) continue;
    
    const diffValue = String(row[4] || '').trim();
    let rowColor = '';
    if (diffValue.indexOf('+') === 0) {
      rowColor = '#dcfce7';
    } else if (diffValue.indexOf('-') === 0) {
      rowColor = '#fee2e2';
    }
    
    while (row.length < 6) {
      row.push('');
    }
    
    const rowNum = ri + 1;
    
    bodyHtml += '<tr style="background:'+rowColor+';">';
    bodyHtml += '<td class="row-header-num" style="background:#f0f0f0;color:#555;font-weight:600;font-size:12px;text-align:center;border:1px solid #d0d7de;min-width:40px;max-width:40px;padding:4px 2px;">'+rowNum+'</td>';
    
    for (let c = 0; c < 6; c++) {
      const cellValue = row[c] !== undefined ? row[c] : '';
      bodyHtml += '<td style="border:1px solid #d0d7de;padding:4px 6px;text-align:left;font-size:13px;min-width:80px;background:transparent;color:#000;">'+cellValue+'</td>';
    }
    bodyHtml += '</tr>';
  }
  body.innerHTML = bodyHtml;
}

function filterDiffByColor(colorType) {
  window.diffFilterColor = colorType;
  renderDiffTableBody();
}

function openDiffFilterMenu(event, colIndex) {
  event.stopPropagation();
  const popover = document.getElementById('filter-popover-menu');
  if (!popover) return;
  popover.style.top = event.clientY + window.scrollY + 10 + 'px';
  popover.style.left = Math.min(event.clientX, window.innerWidth - 200) + 'px';
  popover.innerHTML = '<button onclick="diffSortByColumn('+colIndex+')">🔤 Сортировка</button><div style="border-top:1px solid #e2e8f0;margin:4px 0;"></div><button class="color-opt-green" onclick="filterDiffByColor(\'green\')">🟢 Только Профицит (+)</button><button class="color-opt-red" onclick="filterDiffByColor(\'red\')">🔴 Только Дефицит (-)</button><button class="color-opt-none" onclick="filterDiffByColor(\'all\')">⚪ Сбросить все фильтры</button>';
  popover.classList.remove('hidden');
  const closeMenuHandler = function() {
    popover.classList.add('hidden');
    document.removeEventListener('click', closeMenuHandler);
  };
  setTimeout(function() { document.addEventListener('click', closeMenuHandler); }, 50);
}

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

async function processTextTableImport() {
  if (!window.excelMatrix || window.excelMatrix.length === 0) {
    alert("Ошибка: Сетка Excel пуста или не инициализирована.");
    return;
  }

  const rangePayload = {
    startRow: 1,
    startCol: 1,
    numRows: window.excelMatrix.length,
    numCols: window.excelMatrix[0].length,
    values2D: window.excelMatrix
  };

  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "⏳ Формирование матрицы...";
    importBtn.disabled = true;
  }

  try {
    window.balanceData = window.excelMatrix;
    localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

    const stock = window.inventoryData;
    if (stock && stock.length > 1) {
      for (let i = 1; i < stock.length; i++) {
        const sRow = stock[i];
        if (!sRow || sRow.length < 3) continue;
        const sArt = String(sRow[0]).trim().toLowerCase();
        const sParam = String(sRow[1]).trim().toLowerCase();
        for (let j = 0; j < window.excelMatrix.length; j++) {
          const bRow = window.excelMatrix[j];
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
      const textPayload = "TABLE_RANGE_EXPORT|" + JSON.stringify(rangePayload);
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА:\n\n" + serverText);
      window.excelChangedCells = {};
      window.ctrlSelectedCells = [];
      hideBalancePasteArea();
    } else {
      alert("Сохранено локально на телефоне офлайн.");
      hideBalancePasteArea();
    }
  } catch (err) {
    alert("Критическая ошибка отправки матрицы: " + err.message);
    if (importBtn) {
      importBtn.innerText = "ВНЕСТИ ИЗМЕНЕНИЯ";
      importBtn.disabled = false;
    }
  }
}
