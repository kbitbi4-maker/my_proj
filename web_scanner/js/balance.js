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
 * КРИТИЧЕСКИЙ ФИКС: Исправлена кнопка "ТАБЛИЦА ОТЛИЧИЙ". Теперь заголовки корректно извлекаются из первой строки матрицы window.diffData.
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

  // Динамически извлекаем заголовки из первой строки (индекс 0) Листа 4
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
  if (!diffMatrix || diffMatrix.length <= 1) {
    body.innerHTML = '<tr><td colspan="5">Таблица отличий пуста</td></tr>';
    return;
  }

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
      return true;
    });
  }

  if (rowsData.length === 0) {
    body.innerHTML = '<tr><td colspan="5">Совпадений или расхождений не найдено</td></tr>';
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
 * МОДЕРНИЗИРОВАННАЯ СВЕРКА: Автопереход убран. Формируется полный и детальный информационный алерт о статусе локальной памяти и облака.
 */
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
  // Формируем жесткий корректный массив шапки Листа 4
  diffMatrix.push(["Партия", "Материал", "КрТекстМатериала", "Базисная ЕИ", "Разница Остатка"]); 

  for (let i = 1; i < stock.length; i++) {
    const sRow = stock[i];
    if (!sRow || sRow.length < 5) continue;

    const sArt = String(sRow[0]).trim().toLowerCase();   
    const sParam = String(sRow[1]).trim().toLowerCase(); 
    
    const q1 = parseInt(String(sRow[6]).replace(/\s+/g, '')) || 0;
    const q2 = parseInt(String(sRow[7]).replace(/\s+/g, '')) || 0;
    const sQty = q1 + q2; 

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

    let newDiffRow = [...sRow.slice(0, 4)];
    newDiffRow.push(difference > 0 ? "+" + difference : String(difference)); 
    diffMatrix.push(newDiffRow);
  }

  // Фиксируем результаты локально в буфер устройства
  window.diffData = diffMatrix;
  localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));
  
  var totalDiffsCount = diffMatrix.length - 1;
  var alertMessage = "РЕЗУЛЬТАТЫ СВЕРКИ ОСТАТКОВ:\n\n" +
                     "1. Расчеты: Завершено.\n" +
                     "2. Выявлено расхождений: " + totalDiffsCount + " поз.\n" +
                     "3. Локальное хранилище телефона: УСПЕШНО ЗАПИСАНО.\n";

  // Запуск фоновой отправки сформированного пакета в облако Google Таблиц
  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    alertMessage += "4. Статус сети: Онлайн.\n5. Облако Google: Идет отправка пакета COMPARE_EXPORT...";
    alert(alertMessage); // Выдаем предварительный статус

    const textPayload = "COMPARE_EXPORT|" + JSON.stringify(diffMatrix);
    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: textPayload
    })
    .then(function(res) { return res.text(); })
    .then(function(serverText) {
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО СВЕРКЕ:\n\n" + serverText + "\n\nТаблица отличий сохранена и готова к просмотру через меню.");
    })
    .catch(function(err) {
      alert("Внимание: Данные сохранены на телефоне, но произошла ошибка выгрузки в облако: " + err.message);
    });
  } else {
    alertMessage += "4. Статус сети: Офлайн.\n5. Облако Google: Данные не отправлены (нет интернета).";
    alert(alertMessage);
  }
}

/**
 * ИМПОРТ: НАПРАВЛЯЕТ ВЕСЬ МАССИВ 20 НА 800 СТРОГО ПРЯМОУГОЛЬНИКОМ
 */
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
      alert("ОТВЕТ СЕРВЕРА GOOGLE:\n\n" + serverText);
      
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
