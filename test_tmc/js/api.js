
// ================================================================
// api.js — Модуль сетевого взаимодействия и синхронизации
// Версия 2.1 — сохранение шапки из Google Таблицы
// ================================================================

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbww4XB-yCHpL4mC8UWABoRp5-adrXIr7zqQ9RQI586bCgV5CiJOKqklapq018JWaU-JWQ/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

function renderLogs() {
  const body = document.getElementById('logs-body');
  if (!body) return;
  
  if (!window.qrLogs || window.qrLogs.length === 0) {
    body.innerHTML = '<tr><td colspan="13" style="background:#ffffff;color:#000;text-align:center;padding:20px;">Пусто</td></tr>';
    return;
  }

  // Определяем, есть ли шапка (isHeader === true)
  const firstItem = window.qrLogs[0];
  const hasHeader = firstItem && firstItem.isHeader === true;
  let startIndex = hasHeader ? 1 : 0;
  
  // Если есть шапка — пропускаем её при рендеринге тела
  let bodyHtml = "";
  
  for (let i = startIndex; i < window.qrLogs.length; i++) {
    const item = window.qrLogs[i];
    if (!item || !item.data) continue;
    if (item.action === 'delete') continue;
    
    const isSynced = item.status === 'ok';
    const bgClass = isSynced ? 'class="log-row-synced"' : 'class="log-row-wait"';
    
    let cellsHtml = '';
    for (let cellIndex = 0; cellIndex < item.data.length; cellIndex++) {
      const cell = item.data[cellIndex] !== undefined ? item.data[cellIndex] : '';
      if (cellIndex === 8) {
        cellsHtml += '<td class="log-where-cell" data-index="'+i+'" onclick="if(!window.isReturnMode){ window.enableLogCellEdit ? enableLogCellEdit(event, '+i+') : null; } else { handleLogClick('+i+'); }">'+cell+'</td>';
      } else {
        cellsHtml += '<td onclick="handleLogClick('+i+')">'+cell+'</td>';
      }
    }
    
    bodyHtml += '<tr '+bgClass+'>'+cellsHtml+'</tr>';
  }
  
  if (bodyHtml === '') {
    body.innerHTML = '<tr><td colspan="13" style="background:#ffffff;color:#000;text-align:center;padding:20px;">Пусто</td></tr>';
  } else {
    body.innerHTML = bodyHtml;
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
    
    // Журнал выдачи — сохраняем шапку (первая строка)
    if (data.logs && data.logs.length > 0) {
      window.qrLogs = [];
      // Первая строка — шапка (isHeader: true)
      window.qrLogs.push({ data: data.logs[0], isHeader: true });
      // Остальные строки — данные
      for (let i = 1; i < data.logs.length; i++) {
        window.qrLogs.push({ data: data.logs[i], status: 'ok' });
      }
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
    }
    
    // Остатки — первая строка это шапка (без маркера, она просто первая)
    if (data.stock) {
      window.inventoryData = data.stock;
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
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
    renderLogs();
    if (typeof renderStock === 'function') renderStock();
    
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

document.addEventListener("DOMContentLoaded", function() {
  renderLogs();
  sendUnsynced();
});
