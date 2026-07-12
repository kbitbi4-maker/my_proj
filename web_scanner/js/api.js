// URL вашего Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWWliIxyk0BxXNE8VriVtLaUbQB31VY8WoAl0hCIoR7fKK_98a70q6C6ioFLlgEofUDw/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

function renderLogs() {
  const head = document.getElementById('logs-head');
  const body = document.getElementById('logs-body');
  if (!head || !body) return;
  const visibleLogs = window.qrLogs.filter(item => item && item.data);
  if (!visibleLogs.length) { 
    body.innerHTML = '<tr><td colspan="11">Пусто</td></tr>'; 
    return; 
  }
  if (window.qrLogs && window.qrLogs.data) {
    head.innerHTML = window.qrLogs.data.map(h => `<th>${h}</th>`).join('');
  }
  body.innerHTML = window.qrLogs.map((item, i) => {
    if (i === 0 || !item || !item.data) return '';
    const isSynced = item.status === 'ok';
    const bg = isSynced ? 'style="background:#d4edda;"' : '';
    return `<tr ${bg} onclick="handleLogClick(${i})">${item.data.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
  }).filter(Boolean).reverse().join('');
}

async function syncFromGoogle() {
  if (!navigator.onLine) return;
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
    renderLogs();
    alert("Синхронизация успешно завершена!");
  } catch (e) { alert("Ошибка при синхронизации"); }
}

/**
 * АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ С ПЕРЕХВАТОМ ДИАГНОСТИКИ ОТ GOOGLE
 */
async function sendUnsynced() {
  if (!navigator.onLine || !window.qrLogs || !window.qrLogs.length) return;
  
  for (let i = 0; i < window.qrLogs.length; i++) {
    const item = window.qrLogs[i];
    if (!item || item.status !== 'wait') continue;

    item.status = 'syncing'; 
    
    try {
      let payload = {};
      
      if (item.action === 'delete') {
        payload = {
          action: "delete",
          id: item.id,
          itemKeys: item.itemKeys,
          qty: item.qty
        };
      } else if (item.data) {
        payload = { row: item.data };
      }

      // Отправляем запрос
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      // Считываем текстовый ответ, который прислал Google Apps Script
      const serverResponseText = await response.text();

      // Если это была команда на удаление — выводим лог от сервера на экран смартфона!
      if (item.action === 'delete') {
        alert("ОТВЕТ ОБЛАКА НА УДАЛЕНИЕ:\n\n" + serverResponseText);
        
        // Удаляем маркер из локальной памяти в любом случае, чтобы завершить цикл
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
