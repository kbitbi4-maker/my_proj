// ================================================================
// api.js — Модуль сетевого взаимодействия и синхронизации
// Версия 2.2 — использует excel_core.js для журнала выдачи
// ================================================================

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbww4XB-yCHpL4mC8UWABoRp5-adrXIr7zqQ9RQI586bCgV5CiJOKqklapq018JWaU-JWQ/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

// Регистрируем таблицу журнала выдачи
function initLogsTable() {
  const logsData = window.qrLogs || [];
  
  // Определяем шапку (первая строка с isHeader: true)
  let headers = null;
  let dataStart = 0;
  if (logsData.length > 0 && logsData[0] && logsData[0].isHeader === true) {
    headers = logsData[0].data;
    dataStart = 1;
  }
  
  // Извлекаем данные для таблицы
  let tableData = [];
  if (headers) {
    tableData.push(headers);
  }
  for (let i = dataStart; i < logsData.length; i++) {
    if (logsData[i] && logsData[i].data) {
      tableData.push(logsData[i].data);
    }
  }
  
  excelRegisterTable('logs', {
    data: tableData,
    headers: null,
    colCount: 13,
    editMode: false,
    containerId: 'logs',
    title: 'Журнал выдачи',
    onRowClick: null // особый обработчик через отдельную функцию
  });
  
  // Рендерим таблицу (но она рендерится через renderLogs)
}

function renderLogs() {
  const logsData = window.qrLogs || [];
  
  // Определяем шапку
  let headers = null;
  let dataStart = 0;
  if (logsData.length > 0 && logsData[0] && logsData[0].isHeader === true) {
    headers = logsData[0].data;
    dataStart = 1;
  }
  
  // Извлекаем данные для таблицы
  let tableData = [];
  if (headers) {
    tableData.push(headers);
  }
  for (let i = dataStart; i < logsData.length; i++) {
    if (logsData[i] && logsData[i].data && logsData[i].action !== 'delete') {
      tableData.push(logsData[i].data);
    }
  }
  
  // Обновляем данные в универсальном движке
  const table = EXCEL_CORE.tables['logs'];
  if (table) {
    table.data = tableData;
    excelRenderTable('logs');
  } else {
    // Если таблица ещё не зарегистрирована — регистрируем
    initLogsTable();
  }
}

function recalculateUnprocessedSup() {
  const stock = window.inventoryData;
  const logs = window.qrLogs;
  if (!stock || stock.length <= 1) return;

  console.log("Движок SUP: Запущен расчет не проведенных в SUP черновиков...");

  const startIdx = (logs.length > 0 && logs[0] && logs[0].isHeader === true) ? 1 : 0;
  
  const totalsMap = {};
  
  for (let i = startIdx; i < logs.length; i++) {
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
    
    // Журнал выдачи
    if (data.logs && data.logs.length > 0) {
      window.qrLogs = [];
      window.qrLogs.push({ data: data.logs[0], isHeader: true });
      for (let i = 1; i < data.logs.length; i++) {
        window.qrLogs.push({ data: data.logs[i], status: 'ok' });
      }
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      renderLogs();
    }
    
    // Остатки
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
  
  const startIdx = (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) ? 1 : 0;
  
  for (let i = startIdx; i < window.qrLogs.length; i++) {
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

// Специальный обработчик для журнала выдачи (клик по строке)
function handleLogRowClick(rIdx) {
  // Этот функционал остаётся из returns.js
  if (window.isReturnMode) {
    // Ищем оригинальный индекс в window.qrLogs
    let originalIndex = 0;
    let counter = 0;
    const startIdx = (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) ? 1 : 0;
    for (let i = startIdx; i < window.qrLogs.length; i++) {
      if (window.qrLogs[i] && window.qrLogs[i].data && window.qrLogs[i].action !== 'delete') {
        if (counter === rIdx) {
          originalIndex = i;
          break;
        }
        counter++;
      }
    }
    if (originalIndex !== 0) {
      handleLogClick(originalIndex);
    }
  } else {
    // Режим редактирования ячейки "Куда"
    // Находим оригинальный индекс
    let originalIndex = 0;
    let counter = 0;
    const startIdx = (window.qrLogs.length > 0 && window.qrLogs[0] && window.qrLogs[0].isHeader === true) ? 1 : 0;
    for (let i = startIdx; i < window.qrLogs.length; i++) {
      if (window.qrLogs[i] && window.qrLogs[i].data && window.qrLogs[i].action !== 'delete') {
        if (counter === rIdx) {
          originalIndex = i;
          break;
        }
        counter++;
      }
    }
    if (originalIndex !== 0 && typeof enableLogCellEdit === 'function') {
      // Создаём искусственное событие для редактирования ячейки "Куда"
      const targetCell = document.querySelector('#logs-body tr:nth-child(' + (rIdx + 1) + ') td:nth-child(9)');
      if (targetCell) {
        enableLogCellEdit({ target: targetCell, stopPropagation: function(){} }, originalIndex);
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", function() {
  // Инициализируем таблицу журнала
  if (window.qrLogs && window.qrLogs.length > 0) {
    initLogsTable();
    renderLogs();
  } else {
    initLogsTable();
  }
  sendUnsynced();
});
