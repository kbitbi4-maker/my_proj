// js/api.js — Модуль сетевого взаимодействия и глобальной фоновой синхронизации — ЧАСТЬ 1

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzLmQhzuECmdjd3pTeyr_o3mcaOojV-Jpa9w9JU8gHDyvaiS5smiKd0iwRAXmzwKpKA/exec';

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
 * ФИКС СИНТАКСИСА: Восстановлены квадратные скобки индексов для разблокировки кнопки синхронизации
 */
function recalculateUnprocessedSup() {
  const stock = window.inventoryData;
  const logs = window.qrLogs;
  if (!stock || stock.length <= 1) return;

  console.log("Движок SUP: Запущен расчет не проведенных в SUP черновиков...");

  const totalsMap = {};
  
  for (let i = 0; i < logs.length; i++) {
    const item = logs[i];
    if (!item || !item.data || item.action === 'delete') continue;
    if (i === 0) continue; 

    const rowData = item.data;
    const art = String(rowData[1]).trim().toLowerCase();   // Восстановлен индекс 1 (Артикул)
    const param = String(rowData[2]).trim().toLowerCase(); // Восстановлен индекс 2 (Параметр)
    const qty = parseInt(rowData[5]) || 0;                 // Восстановлен индекс 5 (Количество выдачи)

    const key = art + "|||" + param;
    if (!totalsMap[key]) {
      totalsMap[key] = 0;
    }
    totalsMap[key] += qty;
  }

  let updatedRowsCount = 0;
  for (let i = 1; i < stock.length; i++) {
    const sRow = stock[i];
    if (!sRow || sRow.length < 3) continue;

    const sArt = String(sRow[0]).trim().toLowerCase();     // Восстановлен индекс 0 (Артикул склада)
    const sParam = String(sRow[1]).trim().toLowerCase();   // Восстановлен индекс 1 (Параметр склада)
    const key = sArt + "|||" + sParam;

    const currentUnprocessedQty = totalsMap[key] !== undefined ? totalsMap[key] : 0;
    
    // Записываем сумму в 8-й столбец остатков (индекс 7 — не проведено в SUP)
    sRow[7] = currentUnprocessedQty;                       // Восстановлен индекс 7 (Столбец H)
    updatedRowsCount++;
  }

  window.inventoryData = stock;
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
  console.log(`Движок SUP: Пересчет завершен. Обновлено строк склада: ${updatedRowsCount}`);
}










' =========================================================================
' ДОСТИГНУТ ЛИМИТ В 6400 СИМВОЛОВ — НАЧАЛО ЧАСТИ 2
' =========================================================================
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

    // Запускаем автоматический пересчет SUP черновиков после синхронизации из облака
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
