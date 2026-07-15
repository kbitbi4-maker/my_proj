// js/stock.js — Модуль журнала остатков целиком 

function showStock() {
  const currentData = window.inventoryData;

  if (!currentData || currentData.length === 0) { 
    alert("Сначала нажмите кнопку синхронизации ☁"); 
    return; 
  }
  
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";

  // Принудительно сбрасываем режим редактирования остатков при каждом новом открытии окна
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
  
  // 1. ДИНАМИЧЕСКИЙ ВЫВОД КНОПОК УПРАВЛЕНИЯ РЕДАКТИРОВАНИЕМ ВНУТРИ ОКНА
  // Проверяем, добавлены ли уже кнопки управления над таблицей остатков. Если нет — создаем их.
  let controlsWrapper = document.getElementById('stock-edit-controls-wrapper');
  if (!controlsWrapper) {
    controlsWrapper = document.createElement('div');
    controlsWrapper.id = 'stock-edit-controls-wrapper';
    controlsWrapper.style.width = '100%';
    controlsWrapper.style.flexShrink = '0';
    
    // Вставляем блок управления прямо перед строкой поиска остатков
    const searchInputEl = document.getElementById('stock-search');
    if (searchInputEl && searchInputEl.parentNode) {
      searchInputEl.parentNode.insertBefore(controlsWrapper, searchInputEl);
    }
  }

  // Обновляем HTML-содержимое блока кнопок в зависимости от того, активен ли режим изменения
  const isEdit = !!window.isStockEditMode;
  controlsWrapper.innerHTML = `
    <div id="stock-edit-badge" class="stock-mode-badge ${isEdit ? '' : 'hidden'}" style="text-align: center; margin-bottom: 8px;">
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
  
  // 2. ОТРИСОВКА ЗАГОЛОВКОВ ТАБЛИЦЫ
  head.innerHTML = currentData[0].map(h => `<th>${h}</th>`).join('');
  
  // 3. ОТРИСОВКА СТРОК ТАБЛИЦЫ ОСТАТКОВ
  body.innerHTML = currentData.map((row, index) => {
    if (index === 0) return ''; // Пропускаем заголовок таблицы
    
    const isMatch = row.some(cell => String(cell).toLowerCase().includes(term));
    if (!isMatch && term !== "") return '';

    // Генерируем ячейки строки
    const cellsHtml = row.map((cell, cellIndex) => {
      // Пятый столбец (индекс 4 в JS) — это Количество на остатке
      if (cellIndex === 4 && isEdit) {
        // Если активирован режим редактирования — подставляем инпут с уникальным ID вместо текста
        return `
          <td class="editable-stock-cell" onclick="event.stopPropagation();">
            <input type="number" id="stock-input-${index}" class="cell-stock-input" value="${cell}" min="0" autocomplete="off">
          </td>
        `;
      }
      // Для всех остальных столбцов или в обычном режиме — выводим стандартный текст ячейки
      return `<td>${cell}</td>`;
    }).join('');

    // Если активен режим редактирования остатков, клик по строке заблокирован, чтобы не открывался нумпад
    const clickAction = isEdit ? '' : `onclick="selectFromStockDirect(${index})"`;
    const rowStyle = isEdit ? 'style="cursor: default;"' : '';

    return `<tr ${clickAction} ${rowStyle}>${cellsHtml}</tr>`;
  }).join('');
  
  if (body.innerHTML.trim() === "") {
    body.innerHTML = '<tr><td colspan="11">Ничего не найдено</td></tr>';
  }
}

function selectFromStockDirect(index) {
  const currentData = window.inventoryData;
  if (!currentData) return;

  // Копируем чистый массив ячеек выбранной строки остатков
  window.currentSelectedRowData = [...currentData[index]]; 
  
  document.getElementById('stock-view').classList.add('hidden');
  if (typeof openNumpadView === 'function') {
    openNumpadView();
  } else {
    console.error("Функция openNumpadView не найдена. Убедитесь, что файл js/numpad.js подключен.");
  }
}
