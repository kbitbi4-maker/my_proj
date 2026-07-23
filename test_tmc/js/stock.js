// ================================================================
// stock.js — РЕНДЕРИНГ ТАБЛИЦЫ ОСТАТКОВ (через excel_core.js)
// Версия 4.0 — использует универсальный движок
// ================================================================

// Регистрируем таблицу остатков
function initStockTable() {
  const stockData = window.inventoryData || [];
  
  // Регистрируем таблицу в универсальном движке
  excelRegisterTable('stock', {
    data: stockData,
    headers: null, // берём из первой строки данных
    colCount: 21,
    editMode: false,
    containerId: 'stock',
    searchInputId: 'stock-search',
    title: 'Остатки на складе',
    onRowClick: 'handleStockRowClick',
    formulas: {
      4: function(row) { // E = G + I
        const gVal = parseFloat(row[6]) || 0;
        const iVal = parseFloat(row[8]) || 0;
        return gVal + iVal;
      }
    },
    rowColors: null // зебра определяется в CSS
  });
  
  // Рендерим таблицу
  excelRenderTable('stock');
}

// Инициализируем после загрузки данных
function showStock() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length === 0) {
    alert("Сначала нажмите кнопку синхронизации ☁");
    return;
  }
  
  // Обновляем данные в движке
  excelUpdateData('stock', currentData);
  
  // Открываем модалку
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
}

// Обработчик клика по строке (режим просмотра)
function handleStockRowClick(rIdx) {
  const currentData = window.inventoryData;
  if (!currentData || !currentData[rIdx]) {
    alert("Ошибка: Данные строки не найдены");
    return;
  }
  window.currentSelectedRowData = [...currentData[rIdx]];
  if (typeof openNumpadView === 'function') {
    openNumpadView();
  } else {
    alert("Ошибка: Модуль нумпада (js/numpad.js) не подключен.");
  }
}

// Переключение режима редактирования
function toggleStockEditMode() {
  excelToggleEditMode('stock');
}

// Сброс фильтров
function resetStockFilters() {
  excelResetFilters('stock');
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = '';
}

// Сортировка (прокси)
function stockSortByColumn(cIdx) {
  excelSortByColumn('stock', cIdx);
}

// Обработчик поиска
function stockSearch() {
  const searchInput = document.getElementById('stock-search');
  if (searchInput) {
    excelSearch('stock', searchInput.value);
  }
}

// Переопределяем renderStock для совместимости
function renderStock() {
  const currentData = window.inventoryData || [];
  excelUpdateData('stock', currentData);
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  if (window.inventoryData && window.inventoryData.length > 0) {
    initStockTable();
  }
});

console.log('✅ stock.js — загружен (версия 4.0, использует excel_core.js)');
