// js/balance.js — Модуль импорта Сальдо (Лист 3) и Сравнения остатков (Лист 4) — ЧАСТЬ 1

window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
window.diffData = JSON.parse(localStorage.getItem('qr_diff_v1')) || [];

window.diffFilterColor = "all"; 
window.diffSortDirection = {};  

/**
 * Открытие стартового диалогового окна Сальдо
 */
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

/**
 * Показ области импорта в стиле Excel с инициализацией сетки
 */
function showBalancePasteArea() {
  document.getElementById('balance-menu-buttons').classList.add('hidden');
  
  // Инициализируем и отрисовываем Excel-грид из кэша памяти устройства через excel_grid.js
  if (typeof initExcelMatrixData === 'function' && typeof renderExcelGrid === 'function') {
    initExcelMatrixData();
    renderExcelGrid();
  } else {
    console.error("Критическая ошибка: Движок js/excel_grid.js не подключен или не загружен.");
  }
  
  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "ВНЕСТИ ИЗМЕНЕНИЯ";
    importBtn.disabled = false;
  }
  document.getElementById('balance-paste-container').classList.remove('hidden');
}

/**
 * Возврат из сетки импорта в главное меню управления сальдо
 */
function hideBalancePasteArea() {
  const pasteContainer = document.getElementById('balance-paste-container');
  if (pasteContainer) pasteContainer.classList.add('hidden');
  
  const menuButtons = document.getElementById('balance-menu-buttons');
  if (menuButtons) menuButtons.classList.remove('hidden');
}

/**
 * ИНИЦИАЛИЗАЦИЯ И ОТРИСОВКА ШАПКИ ТАБЛИЦЫ ОТЛИЧИЙ (ЛИСТ 4)
 */
function showDiffTable() {
  const diffMatrix = window.diffData;

  if (!diffMatrix || diffMatrix.length <= 1) {
    alert("Информация:\nТаблица отличий пуста.\n\nПожалуйста, сначала выполните операцию 'СРАВНИТЬ', чтобы рассчитать разницу остатков.");
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

/**
 * РЕНДЕРИНГ СТРОК ТАБЛИЦЫ ОТЛИЧИЙ С УЧЕТОМ СОРТИРОВКИ, ФИЛЬТРА ЦВЕТА И ТЕКСТОВОГО ПОИСКА
 */
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
// js/balance.js — Модуль импорта Сальдо (Лист 3) и Сравнения остатков (Лист 4) — ЧАСТЬ 2

/**
 * ВЫЗОВ ПОПОВЕРА ФИЛЬТРАЦИИ И СОРТИРОВКИ ДЛЯ ВЫБРАННОГО СТОЛБЦА
 */
function openDiffFilterMenu(event, colIndex) {
  event.stopPropagation();
  const popover = document.getElementById('filter-popover-menu');
  if (!popover) return;

  popover.style.top = `${event.clientY + window.scrollY + 10}px`;
  popover.style.left = `${Math.min(event.clientX, window.innerWidth - 200)}px`;
  
  popover.innerHTML = `
    <button onclick="sortDiffByColumn(${colIndex}, 'asc')">🔤 Сортировка (А → Я)</button>
    <button onclick="sortDiffByColumn(${colIndex}, 'desc')">🔤 Сортировка (Я → А)</button>
    <div style="border-top: 1px solid #e2e8f0; margin: 4px 0;"></div>
    <button class="color-opt-green" onclick="filterDiffByColor('green')">🟢 Только Профицит (+)</button>
    <button class="color-opt-red" onclick="filterDiffByColor('red')">🔴 Только Дефицит (-)</button>
    <button class="color-opt-none" onclick="filterDiffByColor('all')">⚪ Сбросить все фильтры</button>
  `;

  popover.classList.remove('hidden');

  const closeMenuHandler = () => {
    popover.classList.add('hidden');
    document.removeEventListener('click', closeMenuHandler);
  };
  setTimeout(() => document.addEventListener('click', closeMenuHandler), 50);
}

function sortDiffByColumn(colIndex, direction) {
  const diffMatrix = window.diffData;
  if (!diffMatrix || diffMatrix.length <= 1) return;

  const header = diffMatrix[0];
  let dataRows = diffMatrix.slice(1);

  dataRows.sort((rowA, rowB) => {
    let valA = String(rowA[colIndex] || '').toLowerCase().trim();
    let valB = String(rowB[colIndex] || '').toLowerCase().trim();

    const numA = parseFloat(valA.replace(/[+]/g, ''));
    const numB = parseFloat(valB.replace(/[+]/g, ''));
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return direction === 'asc' ? numA - numB : numB - numA;
    }

    if (valA < valB) return direction === 'asc' ? -1 : 1;
    if (valA > valB) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  window.diffData = [header, ...dataRows];
  renderDiffTableBody();
}

function filterDiffByColor(colorType) {
  window.diffFilterColor = colorType;
  renderDiffTableBody();
}

/**
 * АВТОМАТИЧЕСКОЕ СРАВНЕНИЕ БАЗ ДАННЫХ С ОЧИСТКОЙ РАЗРЯДОВ ТЫСЯЧ
 */
async function executeDatabaseComparison() {
  const stock = window.inventoryData; 
  const balance = window.balanceData;  

  if (!stock || stock.length <= 1) {
    alert("Ошибка: База остатков пуста. Синхронизируйте облачко ☁");
    return;
  }
  if (!balance || balance.length <= 1) {
    alert("Ошибка: Сначала загрузите сальдо из Excel через кнопку выше!");
    return;
  }

  let diffMatrix = [];
  diffMatrix.push([...stock[0].slice(0, 5)]); 

  for (let i = 1; i < stock.length; i++) {
    const sRow = stock[i];
    if (!sRow || sRow.length < 5) continue;

    const sArt = String(sRow[1]).trim();
    const sParam = String(sRow[2]).trim();
    
    const q1 = parseInt(String(sRow[6]).replace(/\s+/g, '')) || 0;
    const q2 = parseInt(String(sRow[7]).replace(/\s+/g, '')) || 0;
    const sQty = q1 + q2; 

    let foundInBalance = false;
    let bQty = 0;

    for (let j = 1; j < balance.length; j++) {
      const bRow = balance[j];
      if (!bRow || bRow.length < 5) continue;

      if (String(bRow[1]).trim() === sArt && String(bRow[2]).trim() === sParam) {
        foundInBalance = true;
        const cleanBalanceStr = String(bRow[4]).replace(/\s+/g, '');
        bQty = parseInt(cleanBalanceStr) || 0; 
        break;
      }
    }

    const difference = sQty - bQty;
    if (difference === 0) continue;

    let newDiffRow = [...sRow.slice(0, 5)];
    if (difference > 0) {
      newDiffRow[4] = "+" + difference;
    } else {
      newDiffRow[4] = String(difference); 
    }
    diffMatrix.push(newDiffRow);
  }

  window.diffData = diffMatrix;
  localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));

  alert(`Сверка завершена!\nОбнаружено расхождений: ${diffMatrix.length - 1} позиций.\nОтправляем отчет на Лист 4 в облако...`);

  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const textPayload = "COMPARE_EXPORT|" + JSON.stringify(diffMatrix);
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО СВЕРКЕ:\n\n" + serverText);
    } catch (e) {
      console.error(e);
      alert("Отчет сохранен на устройстве, но произошла ошибка отправки в облако: " + e.message);
    }
  } else {
    alert("Нет сети. Результаты сравнения сохранены локально в четвертую базу данных.");
  }
}

/**
 * ИМПОРТ ИЗ ИНТЕРАКТИВНОГО EXCEL-ГРИДА С АВТОФИЛЬТРАЦИЕЙ ПУСТЫХ СТРОК
 */
async function processTextTableImport() {
  if (!window.excelMatrix || window.excelMatrix.length === 0) {
    alert("Ошибка: Сетка Excel не инициализирована.");
    return;
  }

  let matrix = [];
  for (let r = 0; r < window.excelMatrix.length; r++) {
    const row = window.excelMatrix[r];
    const hasData = row.some(cell => cell && cell.trim() !== "");
    if (hasData) {
      let cleanRow = [...row];
      matrix.push(cleanRow);
    }
  }

  if (matrix.length === 0) {
    alert("Ошибка: Таблица Excel пуста! Выделите ячейку и вставьте данные через Ctrl+V перед сохранением.");
    return;
  }

  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "⏳ Обработка ячеек...";
    importBtn.disabled = true;
  }

  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    window.balanceData = matrix;
    localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

    const stock = window.inventoryData;
    if (stock && stock.length > 1) {
      for (let i = 1; i < stock.length; i++) {
        const sRow = stock[i];
        if (!sRow || sRow.length < 3) continue;

        const sArt = String(sRow[0]).trim().toLowerCase();
        const sParam = String(sRow[1]).trim().toLowerCase();

        for (let j = 1; j < matrix.length; j++) {
          const bRow = matrix[j];
          if (!bRow || bRow.length < 5) continue;

          if (String(bRow[0]).trim().toLowerCase() === sArt && String(bRow[1]).trim().toLowerCase() === sParam) {
            const cleanVal = parseInt(String(bRow[4]).replace(/\s+/g, '')) || 0;
            sRow[5] = cleanVal; 
            break;
          }
        }
      }
      window.inventoryData = stock;
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
      if (typeof renderStock === 'function') renderStock();
    }

    if (importBtn) importBtn.innerText = "☁️ Отправка в облако Google...";
    await new Promise(resolve => setTimeout(resolve, 50));

    if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
      const textPayload = "BALANCE_WITH_SUP_IMPORT|" + JSON.stringify(matrix);
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО САЛЬДО С ОБНОВЛЕНИЕМ из.SUP:\n\n" + serverText);
      hideBalancePasteArea();
    } else {
      alert(`Импорт завершен локально! Столбец из.SUP обновлен на устройстве.\nВнимание: В облако данные не ушли, так как интернет отсутствует.`);
      hideBalancePasteArea();
    }
  } catch (err) {
    console.error(err);
    alert("Критическая ошибка обработки таблицы: " + err.message);
    if (importBtn) {
      importBtn.innerText = "ВНЕСТИ ИЗМЕНЕНИЯ";
      importBtn.disabled = false;
    }
  }
}
