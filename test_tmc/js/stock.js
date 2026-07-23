// Регистрируем таблицу остатков
function initStockTable() {
  excelRegisterTable('stock', {
    data: window.inventoryData || [],
    colCount: 21,
    containerId: 'stock',
    searchInputId: 'stock-search',
    title: 'Остатки на складе',
    onRowClick: 'handleStockRowClick', // будем передавать имя функции
    formulas: {
      4: function(row) {
        const gVal = parseFloat(row[6]) || 0;
        const iVal = parseFloat(row[8]) || 0;
        return gVal + iVal;
      }
    },
    rowColors: null, // зебра задаётся в CSS
  });
}

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

function renderStock() {
  excelUpdateData('stock', window.inventoryData || []);
}

function toggleStockEditMode() {
  excelToggleEditMode('stock');
}

function resetStockFilters() {
  excelResetFilters('stock');
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = '';
}

// Обработчик клика по строке
function handleStockRowClick(rIdx) {
  // Проверяем, что не в режиме редактирования
  if (EXCEL_ENGINE.editModes['stock']) return;
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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  if (window.inventoryData && window.inventoryData.length > 0) {
    initStockTable();
    // не рендерим сразу, покажем при открытии
  }
});
