// ================================================================
// api.js — ЖУРНАЛ ВЫДАЧИ + СИНХРОНИЗАЦИЯ (обёртка над excel_engine.js)
// Версия 2.7 — полный код
// ================================================================

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbww4XB-yCHpL4mC8UWABoRp5-adrXIr7zqQ9RQI586bCgV5CiJOKqklapq018JWaU-JWQ/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

// ================================================================
// ИНИЦИАЛИЗАЦИЯ ТАБЛИЦЫ ЖУРНАЛА
// ================================================================

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
    if (window.qrLogs[i] && window.qrLogs[i].data && window.qrLogs[i].action !== 'delete') {
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
            // Передаём в enableLogCellEdit индекс в массиве данных (rIdx)
            // но для редактирования нужен оригинальный индекс в qrLogs
            // Найдём его: rIdx — это индекс в tableData, где 0 — заголовки, 1.. — записи
            // В qrLogs индекс первой записи = start (0 или 1)
            const startIdx = (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) ? 1 : 0;
            const logIndex = startIdx + (rIdx - 1); // если rIdx=1 (первая запись) -> startIdx
            if (logIndex >= 0 && logIndex < window.qrLogs.length) {
              enableLogCellEdit({ target: cellEl, stopPropagation: function() {} }, logIndex);
            }
          }
        }
        return false; // запрещаем стандартное выделение и onRowClick
      }
      // Если режим возврата — вызываем handleLogClick (передаём оригинальный индекс в qrLogs)
      if (window.isReturnMode) {
        const startIdx = (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) ? 1 : 0;
        const logIndex = startIdx + (rIdx - 1);
        if (logIndex >= 0 && logIndex < window.qrLogs.length) {
          handleLogClick(logIndex);
        }
        return false;
      }
      // Иначе разрешаем стандартное выделение
      return true;
    },
    rowColors: null,
    // Не разрешаем редактирование всей таблицы, только через кастомный клик
    editMode: false,
  });
}

// ================================================================
// РЕНДЕРИНГ ЖУРНАЛА
// ================================================================

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

// ================================================================
// ОСТАЛЬНЫЕ ФУНКЦИИ (БЕЗ ИЗМЕНЕНИЙ)
// ================================================================

function recalculateUnprocessedSup() {
  const stock = window.inventoryData;
  const logs = window.qrLogs;
  if (!stock || stock.length <= 1) return;

  console.log("Движок SUP: Запущен расчет не проведенных в SUP черновиков...");

  const dataStart = (logs.length > 0 && logs[0] && logs[0].isHeader === true) ? 1 : 0;
  
  const totalsMap = {};
  
  for (let i = dataStart; i < logs.length; i++) {
    const item = logs[i];
    if (!item || !item.data || item.action === 'delete') continue;
    const logRow = item.data;
    if (logRow.length < 6) continue;
    const artKey = String(logRow[1]).trim().toLowerCase();
    const paramKey = String(logRow[2]).trim().toLowerCase();
    const qtyVal = parseInt(logRow[5]) || 0;
    const mapKey = artKey + "|||" + paramKey;
    if (!totalsMap[mapKey]) totalsMap[mapKey] = 0;
    totalsMap[mapKey] += qtyVal;
  }

  let updatedRowsCount = 0;
  
  for (let j = 1; j < stock.length; j++) {
    const stockRow = stock[j];
    if (!stockRow || stockRow.length < 8) continue;
    const sArtKey = String(stockRow[0]).trim().toLowerCase();
    const sParamKey = String(stockRow[1]).trim().toLowerCase();
    const searchKey = sArtKey + "|||" + sParamKey;
    const currentUnprocessedQty = totalsMap[searchKey] !== undefined ? totalsMap[searchKey] : 0;
    stockRow[7] = currentUnprocessedQty;
    updatedRowsCount++;
  }

  window.inventoryData = stock;
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
  console.log("Движок SUP: Пересчет завершен. Обновлено строк: " + updatedRowsCount);
}

async function syncFromGoogle() {
  if (!navigator.onLine) return;
  
  const badge = document.getElementById('status-text-badge');
  const indicatorEl = document.getElementById('indicator');
  const titleText = document.getElementById('project-title-text');
  const syncBtn = document.getElementById('sync-btn');
  
  if (syncBtn) syncBtn.classList.add('sync-active-highlight');
  if (titleText) titleText.classList.add('hidden');
  if (badge) {
    badge.innerText = "Идет синхронизация";
    badge.className = "status-badge badge-sync-active";
  }
  if (indicatorEl) {
    indicatorEl.classList.add('sync-pulse');
  }

  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    
    if (data.logs && data.logs.length > 0) {
      window.qrLogs = [];
      window.qrLogs.push({ data: data.logs[0], isHeader: true });
      for (let i = 1; i < data.logs.length; i++) {
        window.qrLogs.push({ data: data.logs[i], status: 'ok' });
      }
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      renderLogs();
    }
    
    if (data.stock) {
      window.inventoryData = data.stock;
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
      if (typeof renderStock === 'function') renderStock();
    }
    
    if (data.balance) {
      window.balanceData = data.balance;
      localStorage.setItem('sheetsSync_сальдо', JSON.stringify(window.balanceData));
    }
    if (data.diff) {
      window.diffData = data.diff;
      localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));
    }

    recalculateUnprocessedSup();
    
    if (syncBtn) syncBtn.classList.remove('sync-active-highlight');
    if (badge) badge.className = "status-badge hidden";
    if (indicatorEl) indicatorEl.classList.remove('sync-pulse');
    if (titleText) titleText.classList.remove('hidden');
    
    alert("Глобальная синхронизация успешно завершена!\nОбновлены: Журнал выдачи, Остатки склада, Сальдо и Отчет сверки.");
  } catch (e) {
    if (syncBtn) syncBtn.classList.remove('sync-active-highlight');
    if (badge) badge.className = "status-badge hidden";
    if (indicatorEl) indicatorEl.classList.remove('sync-pulse');
    if (titleText) titleText.classList.remove('hidden');
    alert("Ошибка при синхронизации данных из облака: " + e.message);
  }
}

async function sendUnsynced() {
  if (!navigator.onLine || !window.qrLogs || !window.qrLogs.length) return;
  
  const dataStart = (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) ? 1 : 0;
  
  for (let i = dataStart; i < window.qrLogs.length; i++) {
    const item = window.qrLogs[i];
    if (!item || item.status !== 'wait') continue;

    item.status = 'syncing';
    
    try {
      let bodyData = "";
      if (item.action === 'delete') {
        const art = item.itemKeys || "";
        const param = item.itemKeys || "";
        bodyData = "DELETE_ROW|" + item.id + "|" + item.qty + "|" + art + "|" + param;
      } else if (item.data) {
        bodyData = JSON.stringify({ row: item.data });
      }

      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: bodyData
      });

      if (item.action === 'delete') {
        window.qrLogs.splice(i, 1);
        i--;
      } else {
        item.status = 'ok';
      }
      
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      renderLogs();
      
    } catch (e) {
      console.error("Ошибка при фоновой отправке:", e);
      item.status = 'wait';
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      break;
    }
  }
}

document.addEventListener("DOMContentLoaded", function() {
  renderLogs();
  sendUnsynced();
});

console.log('✅ api.js загружен (версия 2.7)');
