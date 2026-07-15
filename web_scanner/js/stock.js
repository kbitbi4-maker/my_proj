// js/stock.js — Модуль журнала остатков целиком 

function showStock() {
  const currentData = window.inventoryData;

  if (!currentData || currentData.length === 0) { 
    alert("Сначала нажмите кнопку синхронизации ☁"); 
    return; 
  }
  
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";

  if (typeof window.isStockEditMode !== 'undefined') {
    window.isStockEditMode = false;
  }

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
  
  renderStock(); 
}

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase() : "";
  
  const currentData = window.inventoryData;
  if (!currentData || !currentData.length) return;
  
  let controlsWrapper = document.getElementById('stock-edit-controls-wrapper');
  if (!controlsWrapper) {
    controlsWrapper = document.createElement('div');
    controlsWrapper.id = 'stock-edit-controls-wrapper';
    controlsWrapper.style.width = '100%';
    controlsWrapper.style.flexShrink = '0';
    
    const searchInputEl = document.getElementById('stock-search');
    if (searchInputEl && searchInputEl.parentNode) {
      searchInputEl.parentNode.insertBefore(controlsWrapper, searchInputEl);
    }
  }

  const isEdit = !!window.isStockEditMode;
  controlsWrapper.innerHTML = `
    <div id="stock-edit-badge" class="stock-mode-badge ${isEdit ? '' : 'hidden'}">
      ⚠️ РЕЖИМ ИЗМЕНЕНИЯ ОСТАТКОВ АКТИВЕН
    </div>
    <button id="stock-edit-trigger-btn" class="btn-edit-trigger ${isEdit ? 'hidden' : ''}" onclick="toggleStockEditMode(true)">
      📝 Внести изменения
    </button>
    <div id="stock-edit-actions" class="stock-edit-actions-row ${isEdit ? '' : 'hidden'}">
      <button class="btn-stock-cancel" onclick="cancelStockChanges()">Отмена</button>
      <button class="btn-stock-save" onclick="saveStockChangesCloud()">Сохранить изменения</button>
    </div>
  `;
  
  head.innerHTML = `
    <th>Партия</th><th>Материал</th><th>КрТекстМатериала</th><th>Базисная ЕИ</th>
    <th>Кол-во<br>запаса<br>в конце<br>периода</th>
    <th>из.SUP</th>
    <th>скл.1</th>
    <th>скл.2</th>
    <th>цена<br>за<br>единицу</th>
    <th>лок.ID</th>
    <th>Ст-ть<br>запаса<br>в конце<br>периода</th>
    <th>Завод</th><th>Склад</th><th>Особый запас</th><th>СПП-элемент</th><th>Группа материалов</th>
    <th>Дата поступления на склад</th><th>Золото</th><th>Серебро</th>
  `;
  
  body.innerHTML = currentData.map((row, index) => {
    if (index === 0) return ''; 
    
    const isMatch = row.some(cell => String(cell).toLowerCase().includes(term));
    if (!isMatch && term !== "") return '';

    const cellsHtml = row.map((cell, cellIndex) => {
      if (cellIndex === 8) {
        const parsedPrice = parseFloat(String(cell).replace(/,/g, '.').replace(/\s+/g, ''));
        const formattedPrice = !isNaN(parsedPrice) ? parsedPrice.toFixed(3) : cell;
        return `<td>${formattedPrice}</td>`;
      }

      // Вызываем глобальную функцию window.markStockRowAsEdited через инлайн событие
      if ((cellIndex === 4 || cellIndex === 6 || cellIndex === 7) && isEdit) {
        return `
          <td class="editable-stock-cell" onclick="event.stopPropagation();">
            <input type="number" id="stock-input-${index}-${cellIndex}" class="cell-stock-dual-input" value="${parseInt(cell) || 0}" min="0" autocomplete="off" oninput="window.markStockRowAsEdited(${index})">
          </td>
        `;
      }
      return `<td>${cell}</td>`;
    }).join('');

    const clickAction = isEdit ? '' : `onclick="selectFromStockDirect(${index})"`;
    const rowStyle = isEdit ? 'style="cursor: default;"' : '';

    return `<tr ${clickAction} ${rowStyle}>${cellsHtml}</tr>`;
  }).join('');
  
  if (body.innerHTML.trim() === "") {
    body.innerHTML = '<tr><td colspan="19">Ничего не найдено</td></tr>';
  }
}

function selectFromStockDirect(index) {
  const currentData = window.inventoryData;
  if (!currentData || !currentData[index]) return;

  const row = currentData[index];
  const q1 = parseInt(row) || 0; 
  const q2 = parseInt(row) || 0; 
  const totalStock = q1 + q2;

  window.currentSelectedRowData = [row, row, row, row, totalStock, index]; 
  
  document.getElementById('stock-view').classList.add('hidden');
  if (typeof openNumpadView === 'function') {
    openNumpadView();
  } else {
    console.error("Функция openNumpadView не найдена.");
  }
}
