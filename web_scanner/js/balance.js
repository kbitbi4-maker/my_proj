// js/balance.js — Модуль импорта Сальдо (Лист 3) и Сравнения остатков (Лист 4) — ЧАСТЬ 1

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
    alert("Информация:\nТаблица отличий пуста.\n\nПожалуйста, сначала выполните операцию 'СРАВНИТЬ'.");
    return;
  }

  const head = document.getElementById('diff-head');
  if (!head) return;

  const searchInput = document.getElementById('diff-search');
  if (searchInput) searchInput.value = "";
  window.diffFilterColor = "all";

  head.innerHTML = diffMatrix[0].map((h, idx) => {
    return `<th onclick="openDiffFilterMenu(event, ${idx})" style="cursor: pointer; position: relative;">${h} ▾</th>`;
  }).join('');

  renderDiffTableBody();

  document.getElementById('balance-view').classList.add('hidden');
  document.getElementById('diff-table-view').classList.remove('hidden');
}

function renderDiffTableBody() {
  const body = document.getElementById('diff-body');
  if (!body) return;

  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) return;

  const searchInput = document.getElementById('diff-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";

  let rowsData = diffMatrix.slice(1);

  if (term !== "") {
    rowsData = rowsData.filter(row => {
      return row.some(cell => String(cell).toLowerCase().includes(term));
    });
  }

  if (window.diffFilterColor !== "all") {
    rowsData = rowsData.filter(row => {
      const lastCell = String(row[row.length - 1] || '').trim();
      if (window.diffFilterColor === "green") return lastCell.indexOf('+') === 0;
      if (window.diffFilterColor === "red") return lastCell.indexOf('-') === 0;
      if (window.diffFilterColor === "none") return (lastCell.indexOf('+') !== 0 && lastCell.indexOf('-') !== 0);
      return true;
    });
  }

  if (rowsData.length === 0) {
    body.innerHTML = '<tr><td colspan="6">Совпадений или расхождений не найдено</td></tr>';
    return;
  }

  body.innerHTML = rowsData.map(row => {
    if (!row) return '';
    const lastCell = String(row[row.length - 1] || '').trim();
    let bgStyle = '';

    if (lastCell.indexOf('-') === 0) {
      bgStyle = 'style="background: #fee2e2;"'; 
    } else if (lastCell.indexOf('+') === 0) {
      bgStyle = 'style="background: #dcfce7;"'; 
    }

    return `<tr ${bgStyle}>${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
  }).join('');
}
