// ================================================================
// stock.js — ТАБЛИЦА ОСТАТКОВ (обёртка над excel_engine.js)
// Версия 5.0
// ================================================================

// Инициализация таблицы остатков
function initStockTable() {
  excelRegisterTable('stock', {
    data: window.inventoryData || [],
    colCount: 21,
    containerId: 'stock',
    searchInputId: 'stock-search',
    title: 'Остатки на складе',
    onRowClick: function(tableId, rIdx) {
      // Клик по строке в режиме просмотра — открываем нумпад
      if (EXCEL_ENGINE.editModes['stock']) return;
      const data = window.inventoryData;
      if (!data || !data[rIdx]) { alert('Ошибка: данные строки не найдены'); return; }
      window.currentSelectedRowData = [...data[rIdx]];
      if (typeof openNumpadView === 'function') openNumpadView();
      else alert('Ошибка: модуль нумпада не подключен.');
    },
    formulas: {
      4: function(row) {
        const g = parseFloat(row[6]) || 0;
        const i = parseFloat(row[8]) || 0;
        return g + i;
      }
    },
    rowColors: null,
  });
}

function showStock() {
  const data = window.inventoryData;
  if (!data || data.length === 0) {
    alert('Сначала нажмите кнопку синхронизации ☁');
    return;
  }
  // Если таблица ещё не зарегистрирована — регистрируем
  if (!EXCEL_ENGINE.tables['stock']) initStockTable();
  excelUpdateData('stock', data);
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
}

function renderStock() {
  if (!EXCEL_ENGINE.tables['stock']) initStockTable();
  excelUpdateData('stock', window.inventoryData || []);
}

function toggleStockEditMode() {
  excelToggleEditMode('stock');
}

function resetStockFilters() {
  excelResetFilters('stock');
  const input = document.getElementById('stock-search');
  if (input) input.value = '';
}

function stockSearch() {
  const input = document.getElementById('stock-search');
  if (input) excelSearch('stock', input.value);
}

// Обработчик клика по строке (для режима просмотра) – уже задан в onRowClick

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  if (window.inventoryData && window.inventoryData.length > 0) {
    initStockTable();
  }
});

console.log('✅ stock.js загружен');
