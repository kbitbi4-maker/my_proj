// ================================================================
// balance.js — Модуль импорта Сальдо и Сравнения остатков
// Версия 2.5 — использует excel_core.js для таблицы отличий
// ================================================================

window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
window.diffData = JSON.parse(localStorage.getItem('qr_diff_v1')) || [];

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

  // Регистрируем таблицу отличий в универсальном движке
  excelRegisterTable('diff', {
    data: diffMatrix,
    headers: null, // берём из первой строки
    colCount: 6,
    editMode: false,
    containerId: 'diff',
    searchInputId: 'diff-search',
    title: 'Таблица отличий',
    rowColors: {
      '#dcfce7': function(row) { // зелёный — профицит
        return String(row[4] || '').indexOf('+') === 0;
      },
      '#fee2e2': function(row) { // красный — дефицит
        return String(row[4] || '').indexOf('-') === 0;
      }
    }
  });

  document.getElementById('balance-view').classList.add('hidden');
  document.getElementById('diff-table-view').classList.remove('hidden');
  
  // Рендерим таблицу
  excelRenderTable('diff');
}

function renderDiffTableBody() {
  const diffMatrix = window.diffData || [];
  excelUpdateData('diff', diffMatrix);
}

function filterDiffByColor(colorType) {
  EXCEL_CORE.filterColor = colorType;
  renderDiffTableBody();
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
