// ================================================================
// stock.js — ТАБЛИЦА ОСТАТКОВ (обёртка над excel_engine.js)
// Версия 5.0 — полный код
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
      4: function(row) { // E = G + I (индексы 6 и 8)
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
  renderStock();
}

function stockSearch() {
  const input = document.getElementById('stock-search');
  if (input) excelSearch('stock', input.value);
}

// Функция сохранения изменений (вызывается из кнопки)
function saveStockChangesCloud() {
  excelSaveChanges('stock', function(tableId, transactionsList) {
    // Дополнительная логика после применения изменений (например, отправка в облако)
    // Здесь мы уже применили изменения к данным, теперь отправляем в Google
    if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
      try {
        const payloadData = { type: "DELTA_UPDATE", cells: transactionsList };
        const textPayload = "STOCK_UPDATE|" + JSON.stringify(payloadData);
        fetch(SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: textPayload
        })
        .then(res => res.text())
        .then(result => {
          alert('✅ Данные сохранены в облаке!\n' + result);
          // Перерисовываем таблицу, чтобы снять dirty-флаги
          renderStock();
        })
        .catch(err => {
          alert('⚠️ Ошибка отправки: ' + err.message + '\nДанные сохранены локально.');
        });
      } catch (e) {
        alert('⚠️ Ошибка: ' + e.message);
      }
    } else {
      alert('📱 Устройство офлайн. Изменения сохранены локально.');
    }
  });
}

function cancelStockChanges() {
  // Просто перерисовываем таблицу без сохранения, очищая очередь изменений
  if (!EXCEL_ENGINE.tables['stock']) return;
  const queue = EXCEL_ENGINE.changesQueues['stock'] || {};
  if (Object.keys(queue).length === 0) {
    alert('Нет изменений для отмены.');
    return;
  }
  if (!confirm('Очистить все несохранённые изменения ячеек?')) return;
  EXCEL_ENGINE.changesQueues['stock'] = {};
  EXCEL_ENGINE.selections['stock'] = { startRow: null, startCol: null, endRow: null, endCol: null };
  EXCEL_ENGINE.activeCells['stock'] = { row: null, col: null };
  renderStock();
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
  if (window.inventoryData && window.inventoryData.length > 0) {
    initStockTable();
  }
});

console.log('✅ stock.js загружен (версия 5.0)');
