const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbww4XB-yCHpL4mC8UWABoRp5-adrXIr7zqQ9RQI586bCgV5CiJOKqklapq018JWaU-JWQ/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

// Инициализация таблицы журнала
function initLogsTable() {
  // Подготовка данных: если есть isHeader, используем его как первую строку
  let tableData = [];
  let headers = null;
  let start = 0;
  if (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) {
    headers = window.qrLogs[0].data;
    start = 1;
  }
  if (headers) tableData.push(headers);
  else tableData.push(['ID', 'Артикул', 'Парам 1', 'Парам 2', 'Наименование', 'Кол-во', 'Сотрудник', 'Автор', 'Куда выдано', 'Время', 'День', 'Мес', 'Год']);
  for (let i = start; i < window.qrLogs.length; i++) {
    if (window.qrLogs[i] && window.qrLogs[i].data) {
      tableData.push(window.qrLogs[i].data);
    }
  }

  excelRegisterTable('logs', {
    data: tableData,
    colCount: 13,
    containerId: 'logs',
    title: 'Журнал выдачи',
    // Кастомный обработчик клика по ячейке
    onCellClick: function(tableId, rIdx, cIdx, event) {
      // Если клик по ячейке "Куда" (индекс 8) и не режим возврата
      if (cIdx === 8 && !window.isReturnMode) {
        if (typeof enableLogCellEdit === 'function') {
          const cellEl = document.getElementById(`ex-cell-${tableId}-${rIdx}-${cIdx}`);
          if (cellEl) {
            enableLogCellEdit({ target: cellEl, stopPropagation: function() {} }, rIdx);
          }
        }
        return false; // запрещаем стандартное выделение и onRowClick
      }
      // Если режим возврата — вызываем handleLogClick (передаём rIdx как индекс в массиве данных)
      if (window.isReturnMode) {
        // Находим оригинальный индекс в qrLogs
        // В данных движка строки: 0 — заголовки, 1... — записи
        // rIdx — это индекс в массиве данных, он соответствует индексу записи в qrLogs (с учётом смещения)
        const originalIndex = rIdx; // так как мы строим данные без пропусков
        // но если есть isHeader, то смещение: rIdx = 0 соответствует заголовку, rIdx=1 — первой записи
        // В qrLogs индекс первой записи = start
        const startIdx = (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) ? 1 : 0;
        const logIndex = startIdx + (rIdx - 1); // если rIdx=1 (первая запись) -> startIdx
        if (logIndex >= 0 && logIndex < window.qrLogs.length) {
          handleLogClick(logIndex);
        }
        return false;
      }
      // Иначе разрешаем стандартное выделение
      return true;
    },
    // onRowClick не используем, так как поведение зависит от режима
    rowColors: null,
  });
}

function renderLogs() {
  if (!EXCEL_ENGINE.tables['logs']) initLogsTable();
  // Подготовка данных
  let tableData = [];
  let headers = null;
  let start = 0;
  if (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) {
    headers = window.qrLogs[0].data;
    start = 1;
  }
  if (headers) tableData.push(headers);
  else tableData.push(['ID', 'Артикул', 'Парам 1', 'Парам 2', 'Наименование', 'Кол-во', 'Сотрудник', 'Автор', 'Куда выдано', 'Время', 'День', 'Мес', 'Год']);
  for (let i = start; i < window.qrLogs.length; i++) {
    if (window.qrLogs[i] && window.qrLogs[i].data && window.qrLogs[i].action !== 'delete') {
      tableData.push(window.qrLogs[i].data);
    }
  }
  excelUpdateData('logs', tableData);
}

// Остальные функции (синхронизация, SUP, отправка) остаются без изменений
// ...

// (Пропущены для краткости, но они такие же как в предыдущей версии)

console.log('✅ api.js загружен');
