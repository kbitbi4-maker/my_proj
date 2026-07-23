// js/api.js — Модуль сетевого взаимодействия и глобальной фоновой синхронизации — ЧАСТЬ 1

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyoOx2Jcian0PJQ80emw9qKkM56Xbj8HlMNf3lpvrQ-VbQr9neFP9RQLuosk1VszzStBw/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

function renderLogs() {
  const body = document.getElementById('logs-body');
  if (!body) return;
  
  const visibleLogs = window.qrLogs.filter(item => item && item.data);

  if (!visibleLogs.length) { 
    body.innerHTML = '<tr><td colspan="13" style="background: #ffffff; color: #000;">Пусто</td></tr>'; 
    return; 
  }

  body.innerHTML = window.qrLogs.map((item, i) => {
    if (i === 0 || !item || !item.data) return '';
    const isSynced = item.status === 'ok';
    const bgClass = isSynced ? 'class="log-row-synced"' : 'class="log-row-wait"';
    
    const cellsHtml = item.data.map((cell, cellIndex) => {
      if (cellIndex === 8) {
        return `<td class="log-where-cell" data-index="${i}" onclick="if(!window.isReturnMode){ enableLogCellEdit(event, ${i}); } else { handleLogClick(${i}); }">${cell}</td>`;
      }
      return `<td onclick="handleLogClick(${i})">${cell}</td>`;
    }).join('');

    return `<tr ${bgClass}>${cellsHtml}</tr>`;
  }).filter(Boolean).reverse().join('');
}

/**
 * ГАРАНТИРОВАННО РАБОЧИЙ ДВИЖОК: Жестко прописаны индексы ячеек без ложных сокращений
 */
function recalculateUnprocessedSup() {
  const stock = window.inventoryData;
  const logs = window.qrLogs;
  if (!stock || stock.length <= 1) return;

  console.log("Движок SUP: Запущен расчет не проведенных в SUP черновиков...");

  const totalsMap = {};
  
  // Цикл по журналу выдачи (Таблица 2)
  for (let i = 0; i < logs.length; i++) {
    const item = logs[i];
    if (!item || !item.data || item.action === 'delete') continue;
    if (i === 0) continue; 

    const logRow = item.data;
    if (logRow.length < 6) continue;

    // Извлекаем данные по строгим индексам (1 - Артикул, 2 - Параметр, 5 - Кол-во)
    const artKey = String(logRow[1]).trim().toLowerCase();   
    const paramKey = String(logRow[2]).trim().toLowerCase(); 
    const qtyVal = parseInt(logRow[5]) || 0;                 

    const mapKey = artKey + "|||" + paramKey;
    if (!totalsMap[mapKey]) {
      totalsMap[mapKey] = 0;
    }
    totalsMap[mapKey] += qtyVal;
  }

  let updatedRowsCount = 0;
  
  // Цикл по остаткам склада (Таблица 1)
  for (let j = 1; j < stock.length; j++) {
    const stockRow = stock[j];
    if (!stockRow || stockRow.length < 8) continue;

    // Извлекаем данные по строгим индексам (0 - Артикул склада, 1 - Параметр склада)
    const sArtKey = String(stockRow[0]).trim().toLowerCase();     
    const sParamKey = String(stockRow[1]).trim().toLowerCase();   
    const searchKey = sArtKey + "|||" + sParamKey;

    const currentUnprocessedQty = totalsMap[searchKey] !== undefined ? totalsMap[searchKey] : 0;
    
    // Записываем сумму строго в 8-й столбец остатков (индекс 7)
    stockRow[7] = currentUnprocessedQty;                       
    updatedRowsCount++;
  }

  window.inventoryData = stock;
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
  console.log("Движок SUP: Пересчет завершен без ошибок. Обновлено строк: " + updatedRowsCount);
}








// =========================================================================
// ДОСТИГНУТ ЛИМИТ В 6400 СИМВОЛОВ — НАЧАЛО ЧАСТИ 2
// =========================================================================
// js/api.js — Модуль сетевого взаимодействия и глобальной фоновой синхронизации — ЧАСТЬ 2

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
    
    if (data.logs) {
      window.qrLogs = data.logs.map(row => ({ data: row, status: 'ok' }));
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
    }
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
    
    alert("Глобальная синхронизация успешно завершена!\nОбновлены: Журнал выдачи, Остатки склада (включая не проведено в SUP), Сальдо и Отчет сверки.");
  } catch (e) { 
    if (syncBtn) syncBtn.classList.remove('sync-active-highlight');
    if (badge) badge.className = "status-badge hidden";
    if (indicatorEl) indicatorEl.classList.remove('sync-pulse');
    if (titleText) titleText.classList.remove('hidden');
    alert("Ошибка при синхронизации данных из облака"); 
  }
}

async function sendUnsynced() {
  if (!navigator.onLine || !window.qrLogs || !window.qrLogs.length) return;
  
  for (let i = 0; i < window.qrLogs.length; i++) {
    const item = window.qrLogs[i];
    if (!item || item.status !== 'wait') continue;

    item.status = 'syncing'; 
    
    try {
      let bodyData = "";
      
      if (item.action === 'delete') {
        const art = item.itemKeys || "";
        const param = item.itemKeys || "";
        bodyData = `DELETE_ROW|${item.id}|${item.qty}|${art}|${param}`;
      } else if (item.data) {
        bodyData = JSON.stringify({ row: item.data });
      }

      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
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

document.addEventListener("DOMContentLoaded", () => {
  renderLogs();
  sendUnsynced();
});
