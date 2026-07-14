// js/api.js — Модуль сетевого взаимодействия и глобальной фоновой синхронизации

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYrFwc1EOwNe1A8g5oekELICMgJYOR_y3ooM84b8gfCYaOdzkOTNxzs31dTXyB75kQZw/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

function renderLogs() {
  const head = document.getElementById('logs-head');
  const body = document.getElementById('logs-body');
  if (!head || !body) return;
  
  const visibleLogs = window.qrLogs.filter(item => item && item.data);

  if (!visibleLogs.length) { 
    body.innerHTML = '<tr><td colspan="12">Пусто</td></tr>'; 
    return; 
  }

  if (visibleLogs && visibleLogs[0] && visibleLogs[0].data) {
    head.innerHTML = visibleLogs[0].data.map(h => `<th>${h}</th>`).join('');
  }

  body.innerHTML = window.qrLogs.map((item, i) => {
    if (i === 0 || !item || !item.data) return '';
    const isSynced = item.status === 'ok';
    const bg = isSynced ? 'style="background:#d4edda;"' : '';
    return `<tr ${bg} onclick="handleLogClick(${i})">${item.data.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
  }).filter(Boolean).reverse().join('');
}

/**
 * МОДЕРНИЗИРОВАННАЯ ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ (ОБНОВЛЯЕТ ВСЕ 4 БАЗЫ ДАННЫХ ИЗ ОБЛАКА)
 */
async function syncFromGoogle() {
  if (!navigator.onLine) return;
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    
    // 1. Синхронизируем Лист 2 (Журнал выдачи)
    if (data.logs) {
      window.qrLogs = data.logs.map(row => ({ data: row, status: 'ok' }));
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
    }
    // 2. Синхронизируем Лист 1 (Остатки на складе)
    if (data.stock) {
      window.inventoryData = data.stock;
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
    }
    // 3. Синхронизируем Лист 3 (Загруженное сальдо)
    if (data.balance) {
      window.balanceData = data.balance;
      localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));
    }
    // 4. Синхронизируем Лист 4 (Таблица отличий)
    if (data.diff) {
      window.diffData = data.diff;
      localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));
    }

    renderLogs();
    alert("Глобальная синхронизация успешно завершена!\nОбновлены: Журнал выдачи, Остатки склада, Сальдо и Отчет сверки.");
  } catch (e) { 
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
        const art = item.itemKeys[0] || "";
        const param = item.itemKeys[1] || "";
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
