// ================================================================
// js/stock.js — ПОЛНЫЙ МОДУЛЬ EXCEL-ГРИДА ОСТАТКОВ СКЛАДА
// Версия 2.0 — с поддержкой выделения, копирования, вставки
// ================================================================

window.isStockEditMode = false;
window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
window.stockActiveCell = { row: null, col: null };
window.stockChangesQueue = {}; // Кэш изменений: { "R_C": { row, col, value, bg, fontColor, fontWeight } }

// ================================================================
// ОТОБРАЖЕНИЕ ТАБЛИЦЫ ОСТАТКОВ (ЭКСЕЛЬ-ПОДОБНЫЙ ГРИД)
// ================================================================

function showStock() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length === 0) { 
    alert("Сначала нажмите кнопку синхронизации ☁"); 
    return; 
  }
  
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";
  window.isStockEditMode = true;

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
  
  renderStock(); 
}

// ================================================================
// ОСНОВНОЙ РЕНДЕР ТАБЛИЦЫ
// ================================================================

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase().trim() : "";
  
  const currentData = window.inventoryData;
  if (!currentData || !currentData.length) return;
  
  // ДОБАВЛЯЕМ ПАНЕЛЬ УПРАВЛЕНИЯ СТИЛЯМИ (если её нет)
  let controlsWrapper = document.getElementById('stock-edit-controls-wrapper');
  if (!controlsWrapper) {
    controlsWrapper = document.createElement('div');
    controlsWrapper.id = 'stock-edit-controls-wrapper';
    controlsWrapper.style.width = '100%';
    if (searchInput && searchInput.parentNode) {
      searchInput.parentNode.insertBefore(controlsWrapper, searchInput);
    }
  }

  const changesCount = Object.keys(window.stockChangesQueue).length;
  controlsWrapper.innerHTML = `
    <div id="stock-edit-badge" class="stock-mode-badge">
      📊 РЕЖИМ EXCEL-ГРИДА АКТИВЕН 
      <span style="font-weight:400;font-size:12px;color:#555;">
        (Выделение: клик, Shift+клик, Ctrl+C / Ctrl+V)
      </span>
    </div>
    <div id="stock-edit-actions" class="stock-edit-actions-row">
      <button class="btn-stock-cancel" onclick="cancelStockChanges()">
        ✖ Сбросить кэш (${changesCount})
      </button>
      <button class="btn-stock-save" onclick="saveStockChangesCloud()">
        💾 Сохранить в Google (${changesCount})
      </button>
    </div>
  `;
  
  // ============================================================
  // ЗАГОЛОВКИ СТОЛБЦОВ (БУКВЫ A, B, C, ...)
  // ============================================================
  const colLetters = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U'];
  
  let headHtml = `<tr>`;
  // Первая ячейка — пустой угол (как в Excel)
  headHtml += `<th class="excel-corner-header" style="min-width:40px;max-width:40px;background:#e8e8e8;border-right:2px solid #a0a0a0;"></th>`;
  
  // Заголовки столбцов с буквами (начиная с A)
  for (let c = 0; c < 21; c++) {
    const letter = colLetters[c + 1] || String.fromCharCode(65 + c);
    headHtml += `<th onclick="excelSelectWholeColumn(${c})" title="Выделить столбец ${letter}">${letter}</th>`;
  }
  headHtml += `</tr>`;
  head.innerHTML = headHtml;

  // ============================================================
  // ТЕЛО ТАБЛИЦЫ (СТРОКИ)
  // ============================================================
  let bodyHtml = "";
  
  for (let rIdx = 1; rIdx < currentData.length; rIdx++) {
    const row = currentData[rIdx];
    if (!row || row.length === 0) continue;
    
    // Фильтрация по поисковому запросу
    const isMatch = row.some(cell => String(cell).toLowerCase().includes(term));
    if (!isMatch && term !== "") continue;

    // Номер строки (1-индексация для пользователя)
    bodyHtml += `<tr id="ex-row-${rIdx}">`;
    bodyHtml += `<td class="row-header-num" id="row-hdr-${rIdx}" onclick="excelSelectWholeRow(event, ${rIdx})">${rIdx}</td>`;

    // Ячейки строки (максимум 21 столбец)
    for (let cIdx = 0; cIdx < 21; cIdx++) {
      const cellKey = `${rIdx}_${cIdx}`;
      const isDirty = window.stockChangesQueue[cellKey];
      
      // Берём значение: либо изменённое, либо из исходных данных
      let displayValue = isDirty ? isDirty.value : (row[cIdx] !== undefined ? row[cIdx] : '');
      
      // Форматирование цены (столбец J — индекс 9)
      if (cIdx === 9 && !isDirty && displayValue !== '') {
        const parsedPrice = parseFloat(String(displayValue).replace(/,/g, '.').replace(/\s+/g, ''));
        if (!isNaN(parsedPrice)) displayValue = parsedPrice.toFixed(3);
      }

      // Стили грязных ячеек
      const dirtyClass = isDirty ? 'cell-stock-dirty' : '';
      const bgStyle = isDirty && isDirty.bg ? `background-color: ${isDirty.bg};` : '';
      const colorStyle = isDirty && isDirty.fontColor ? `color: ${isDirty.fontColor};` : '';
      const weightStyle = isDirty && isDirty.fontWeight ? `font-weight: ${isDirty.fontWeight};` : '';

      bodyHtml += `
        <td id="ex-cell-${rIdx}-${cIdx}" 
            class="${dirtyClass}" 
            style="${bgStyle} ${colorStyle} ${weightStyle}"
            contenteditable="true" 
            onclick="excelHandleCellClick(event, ${rIdx}, ${cIdx})"
            onblur="excelHandleCellBlur(this, ${rIdx}, ${cIdx})"
            onkeydown="excelHandleCellKeyDown(event, ${rIdx}, ${cIdx})">
          ${displayValue}
        </td>
      `;
    }
    bodyHtml += `</tr>`;
  }
  
  body.innerHTML = bodyHtml || '<tr><td colspan="22" style="text-align:center;padding:20px;color:#999;">Ничего не найдено</td></tr>';

  // ВОССТАНАВЛИВАЕМ ВЫДЕЛЕНИЯ ПОСЛЕ ПЕРЕРИСОВКИ
  excelRefreshSelectionVisuals();
}

// ================================================================
// ОБРАБОТЧИКИ КЛИКОВ ПО ЯЧЕЙКАМ (ВЫДЕЛЕНИЕ)
// ================================================================

function excelHandleCellClick(event, rIdx, cIdx) {
  const currentData = window.inventoryData;
  if (!currentData || !currentData[rIdx]) return;

  // SHIFT + КЛИК — ВЫДЕЛЕНИЕ ДИАПАЗОНА
  if (event.shiftKey && window.stockActiveCell.row !== null && window.stockActiveCell.col !== null) {
    window.stockSelectedRange.startRow = Math.min(window.stockActiveCell.row, rIdx);
    window.stockSelectedRange.endRow = Math.max(window.stockActiveCell.row, rIdx);
    window.stockSelectedRange.startCol = Math.min(window.stockActiveCell.col, cIdx);
    window.stockSelectedRange.endCol = Math.max(window.stockActiveCell.col, cIdx);
  } else {
    // ОБЫЧНЫЙ КЛИК — ВЫДЕЛЕНИЕ ОДНОЙ ЯЧЕЙКИ
    window.stockActiveCell.row = rIdx;
    window.stockActiveCell.col = cIdx;
    window.stockSelectedRange.startRow = rIdx;
    window.stockSelectedRange.endRow = rIdx;
    window.stockSelectedRange.startCol = cIdx;
    window.stockSelectedRange.endCol = cIdx;
  }

  excelRefreshSelectionVisuals();
  
  // ФОКУС НА АКТИВНОЙ ЯЧЕЙКЕ
  const cellEl = document.getElementById(`ex-cell-${rIdx}-${cIdx}`);
  if (cellEl) {
    cellEl.classList.add('cell-active-focus');
    cellEl.focus();
  }
}

// ================================================================
// ВЫДЕЛЕНИЕ ЦЕЛОЙ СТРОКИ (ПО КЛИКУ НА НОМЕР)
// ================================================================

function excelSelectWholeRow(event, rIdx) {
  event.stopPropagation();
  const currentData = window.inventoryData;
  if (!currentData || !currentData[rIdx]) return;

  window.stockActiveCell.row = rIdx;
  window.stockActiveCell.col = 0;
  
  window.stockSelectedRange.startRow = rIdx;
  window.stockSelectedRange.endRow = rIdx;
  window.stockSelectedRange.startCol = 0;
  window.stockSelectedRange.endCol = 20; // 21 столбец (индексы 0–20)

  excelRefreshSelectionVisuals();
}

// ================================================================
// ВЫДЕЛЕНИЕ ЦЕЛОГО СТОЛБЦА (ПО КЛИКУ НА БУКВУ)
// ================================================================

function excelSelectWholeColumn(cIdx) {
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

// ================================================================
// ОБНОВЛЕНИЕ ВИЗУАЛЬНЫХ ВЫДЕЛЕНИЙ (ПЕРЕРИСОВКА КЛАССОВ)
// ================================================================

function excelRefreshSelectionVisuals() {
  // Сбрасываем старые выделения
  document.querySelectorAll('.cell-selected, .cell-active-focus, .row-selected')
    .forEach(el => el.classList.remove('cell-selected', 'cell-active-focus', 'row-selected'));

  if (window.stockSelectedRange.startRow === null) return;

  // ПОДСВЕЧИВАЕМ ДИАПАЗОН
  for (let r = window.stockSelectedRange.startRow; r <= window.stockSelectedRange.endRow; r++) {
    const rowHdr = document.getElementById(`row-hdr-${r}`);
    if (rowHdr) rowHdr.classList.add('row-selected');

    for (let c = window.stockSelectedRange.startCol; c <= window.stockSelectedRange.endCol; c++) {
      const cellEl = document.getElementById(`ex-cell-${r}-${c}`);
      if (cellEl) {
        cellEl.classList.add('cell-selected');
        // Активная ячейка — дополнительная рамка
        if (r === window.stockActiveCell.row && c === window.stockActiveCell.col) {
          cellEl.classList.add('cell-active-focus');
        }
      }
    }
  }
}

// ================================================================
// ОБРАБОТЧИК BLUR (СОХРАНЕНИЕ ИЗМЕНЕНИЙ В КЭШ)
// ================================================================

function excelHandleCellBlur(cellElement, rIdx, cIdx) {
  cellElement.classList.remove('cell-active-focus');
  
  const newValue = cellElement.innerText.trim();
  const originalValue = String(window.inventoryData[rIdx][cIdx] || '').trim();

  // Считываем текущие стили
  const currentBg = window.getComputedStyle(cellElement).backgroundColor;
  const currentTextHex = window.getComputedStyle(cellElement).color;
  const currentWeight = window.getComputedStyle(cellElement).fontWeight;

  const cellKey = `${rIdx}_${cIdx}`;

  // ЕСЛИ ЗНАЧЕНИЕ ИЛИ СТИЛЬ ИЗМЕНИЛИСЬ — ДОБАВЛЯЕМ В КЭШ
  if (newValue !== originalValue || currentBg !== 'transparent' || currentWeight !== '400') {
    cellElement.classList.add('cell-stock-dirty');
    
    window.stockChangesQueue[cellKey] = {
      row: rIdx,
      col: cIdx,
      value: newValue,
      bg: currentBg,
      fontColor: currentTextHex,
      fontWeight: currentWeight
    };
  } else {
    // ЕСЛИ ВЕРНУЛИ СТАРОЕ — УДАЛЯЕМ ИЗ КЭША
    cellElement.classList.remove('cell-stock-dirty');
    delete window.stockChangesQueue[cellKey];
  }

  // ОБНОВЛЯЕМ СЧЁТЧИК НА КНОПКЕ СОХРАНЕНИЯ
  const saveBtn = document.querySelector('.btn-stock-save');
  if (saveBtn) {
    const count = Object.keys(window.stockChangesQueue).length;
    saveBtn.innerText = `💾 Сохранить в Google (${count})`;
  }
  
  const cancelBtn = document.querySelector('.btn-stock-cancel');
  if (cancelBtn) {
    const count = Object.keys(window.stockChangesQueue).length;
    cancelBtn.innerText = `✖ Сбросить кэш (${count})`;
  }
}

// ================================================================
// ОБРАБОТЧИК KEYDOWN (ENTER — ПЕРЕХОД НА СТРОКУ НИЖЕ)
// ================================================================

function excelHandleCellKeyDown(event, rIdx, cIdx) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const nextCell = document.getElementById(`ex-cell-${rIdx + 1}-${cIdx}`);
    if (nextCell) {
      nextCell.focus();
      excelHandleCellClick(event, rIdx + 1, cIdx);
    }
  }
}

// ================================================================
// ОТМЕНА ВСЕХ ИЗМЕНЕНИЙ (СБРОС КЭША)
// ================================================================

function cancelStockChanges() {
  if (Object.keys(window.stockChangesQueue).length === 0) {
    alert('Нет изменений для отмены.');
    return;
  }
  
  if (!confirm('Очистить все несохранённые изменения ячеек?')) return;
  
  window.stockChangesQueue = {};
  window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  window.stockActiveCell = { row: null, col: null };
  
  renderStock();
}

// ================================================================
// СОХРАНЕНИЕ ИЗМЕНЕНИЙ В ОБЛАКО (GOOGLE SHEETS)
// ================================================================

async function saveStockChangesCloud() {
  const changesCount = Object.keys(window.stockChangesQueue).length;
  if (changesCount === 0) {
    alert('Нет изменённых ячеек для отправки.');
    return;
  }

  // Применяем изменения к основному массиву данных
  const transactionsList = Object.values(window.stockChangesQueue);
  transactionsList.forEach(tx => {
    if (window.inventoryData[tx.row]) {
      window.inventoryData[tx.row][tx.col] = tx.value;
    }
  });

  // Сохраняем в localStorage
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

  // Отправляем в облако, если есть интернет
  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const payloadData = {
        type: "DELTA_UPDATE",
        cells: transactionsList
      };
      const textPayload = "STOCK_UPDATE|" + JSON.stringify(payloadData);
      
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      
      const resultText = await response.text();

      // Визуальная обратная связь — зелёная вспышка
      transactionsList.forEach(tx => {
        const cellEl = document.getElementById(`ex-cell-${tx.row}-${tx.col}`);
        if (cellEl) {
          cellEl.classList.remove('cell-stock-dirty');
          cellEl.classList.add('cell-stock-saved-flash');
        }
      });

      window.stockChangesQueue = {};
      
      setTimeout(() => {
        renderStock();
        alert('✅ Данные успешно сохранены в облаке!\n' + resultText);
      }, 800);

    } catch (e) {
      console.error('Ошибка отправки изменений:', e);
      alert('⚠️ Ошибка сети. Изменения сохранены локально на устройстве.');
    }
  } else {
    alert('📱 Устройство офлайн. Изменения сохранены в локальный кэш.');
    renderStock();
  }
}

// ================================================================
// КОПИРОВАНИЕ ВЫДЕЛЕННЫХ ЯЧЕЕК (Ctrl+C)
// ================================================================

document.addEventListener('copy', function(e) {
  if (window.stockSelectedRange.startRow === null) return;
  
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#stock-view')) return;

  const currentData = window.inventoryData;
  if (!currentData || currentData.length <= 1) return;

  const { startRow, endRow, startCol, endCol } = window.stockSelectedRange;
  
  // Собираем данные в двумерный массив
  let copyData = [];
  for (let r = startRow; r <= endRow && r < currentData.length; r++) {
    let rowCopy = [];
    for (let c = startCol; c <= endCol && c < (currentData[r] || []).length; c++) {
      const cellKey = `${r}_${c}`;
      const isDirty = window.stockChangesQueue[cellKey];
      const value = isDirty ? isDirty.value : (currentData[r][c] !== undefined ? currentData[r][c] : '');
      rowCopy.push(value);
    }
    copyData.push(rowCopy);
  }

  // Формируем TSV (Tab-Separated Values) — Excel понимает
  const tsvText = copyData.map(row => row.join('\t')).join('\n');
  
  e.clipboardData.setData('text/plain', tsvText);
  e.preventDefault();

  // Визуальный фидбэк
  const badge = document.getElementById('stock-edit-badge');
  if (badge) {
    const origText = badge.innerText;
    badge.innerText = '✅ Скопировано! ' + copyData.length + ' строк';
    badge.style.background = '#d4edda';
    setTimeout(() => {
      badge.innerText = origText;
      badge.style.background = '#e8f0fe';
    }, 1500);
  }
});

// ================================================================
// ВСТАВКА ИЗ БУФЕРА ОБМЕНА (Ctrl+V)
// ================================================================

document.addEventListener('paste', function(e) {
  if (window.stockActiveCell.row === null || window.stockActiveCell.col === null) return;
  
  const activeEl = document.activeElement;
  if (!activeEl || !activeEl.closest('#stock-view')) return;

  const pasteData = e.clipboardData.getData('text/plain');
  if (!pasteData) return;

  e.preventDefault();

  const rows = pasteData.split('\n').filter(line => line.trim() !== '');
  const startR = window.stockActiveCell.row;
  const startC = window.stockActiveCell.col;

  let pasteCount = 0;

  rows.forEach((rowText, rIdx) => {
    const cells = rowText.split('\t');
    const targetR = startR + rIdx;
    if (targetR >= window.inventoryData.length) return;

    cells.forEach((cellValue, cIdx) => {
      const targetC = startC + cIdx;
      if (targetC >= (window.inventoryData[targetR] || []).length) return;

      const cellKey = `${targetR}_${targetC}`;
      const trimmedVal = cellValue.trim();
      
      // Обновляем данные
      window.inventoryData[targetR][targetC] = trimmedVal;
      
      // Добавляем в очередь изменений
      window.stockChangesQueue[cellKey] = {
        row: targetR,
        col: targetC,
        value: trimmedVal,
        bg: '#ffffff',
        fontColor: '#000000',
        fontWeight: '400'
      };
      
      pasteCount++;
    });
  });

  // Перерисовываем таблицу
  renderStock();

  // Визуальный фидбэк
  const badge = document.getElementById('stock-edit-badge');
  if (badge) {
    const origText = badge.innerText;
    badge.innerText = `📋 Вставлено! ${pasteCount} ячеек`;
    badge.style.background = '#d4edda';
    setTimeout(() => {
      badge.innerText = origText;
      badge.style.background = '#e8f0fe';
    }, 1500);
  }
});

// ================================================================
// ПРИНУДИТЕЛЬНЫЙ ПЕРЕСЧЁТ ВЫДЕЛЕНИЙ ПРИ РАЗМЕРЕ ОКНА
// ================================================================

window.addEventListener('resize', function() {
  if (!document.getElementById('stock-view').classList.contains('hidden')) {
    excelRefreshSelectionVisuals();
  }
});

console.log('✅ js/stock.js — Excel-грид загружен');
