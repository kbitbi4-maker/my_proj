// js/api.js — Модуль сетевого взаимодействия и глобальной фоновой синхронизации

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwp8iw4EYWYbIymV4VxnKu1BEA3trhEiTc9zhxHrXDtdl9rpF2QYMss92mpUG7Lks9XYQ/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

function renderLogs() {
  const body = document.getElementById('logs-body');
  if (!body) return;
  
  const visibleLogs = window.qrLogs.filter(item => item && item.data);

  if (!visibleLogs.length) { 
    body.innerHTML = '<tr><td colspan="13" style="background: rgba(255,255,255,0.85); color: #000;">Пусто</td></tr>'; 
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

    // Рендерим строки с зазорами (каждая tbody/tr — отдельный прозрачный элемент)
    return `<tr ${bgClass}>${cellsHtml}</tr><tr class="table-spacer"></tr>`;
  }).filter(Boolean).reverse().join('');
}

/**
 * МОДЕРНИЗИРОВАННАЯ ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ (ОБНОВЛЯЕТ ВСЕ 4 БАЗЫ ДАННЫХ ИЗ ОБЛАКА)
 */
async function syncFromGoogle() {
  if (!navigator.onLine) return;
  
  const badge = document.getElementById('status-text-badge');
  const indicatorEl = document.getElementById('indicator');
  const titleText = document.getElementById('project-title-text');
  const syncBtn = document.getElementById('sync-btn');
  
  // ВКЛЮЧАЕМ ЭФФЕКТЫ: Кнопка горит красным, название скрывается, плашка активна
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
      localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));
    }
    if (data.diff) {
      window.diffData = data.diff;
      localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));
    }

    renderLogs();
    
    // ОТКЛЮЧАЕМ ЭФФЕКТЫ ПОСЛЕ УСПЕШНОГО ОКОНЧАНИЯ
    if (syncBtn) syncBtn.classList.remove('sync-active-highlight');
    if (badge) badge.className = "status-badge hidden";
    if (indicatorEl) indicatorEl.classList.remove('sync-pulse');
    if (titleText) titleText.classList.remove('hidden');
    
    alert("Глобальная синхронизация успешно завершена!\nОбновлены: Журнал выдачи, Остатки склада, Сальдо и Отчет сверки.");
  } catch (e) { 
    // ОТКЛЮЧАЕМ ЭФФЕКТЫ БЕЗ РАЗНИЦЫ ПРИ ОШИБКЕ БЕЗ ВЫЛЕТА ПРОГРАММЫ
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

