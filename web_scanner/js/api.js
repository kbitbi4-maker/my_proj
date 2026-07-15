// js/api.js — Модуль сетевого взаимодействия и глобальной фоновой синхронизации

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwp8iw4EYWYbIymV4VxnKu1BEA3trhEiTc9zhxHrXDtdl9rpF2QYMss92mpUG7Lks9XYQ/exec';

window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

function renderLogs() {
  const head = document.getElementById('logs-head');
  const body = document.getElementById('logs-body');
  if (!head || !body) return;
  
  const visibleLogs = window.qrLogs.filter(item => item && item.data);

  if (!visibleLogs.length) { 
    body.innerHTML = '<tr><td colspan="10">Пусто</td></tr>'; 
    return; 
  }

  // Фиксированная безопасная шапка журнала (10 колонок)
  head.innerHTML = `
    <th>ID</th><th>Артикул</th><th>Парам 1</th><th>Парам 2</th>
    <th>Наименование</th><th>Кол-во</th><th>Сотрудник</th>
    <th>Автор</th><th>Куда выдано</th><th>Дата/Время</th>
  `;

  body.innerHTML = window.qrLogs.map((item, i) => {
    if (i === 0 || !item || !item.data) return '';
    const isSynced = item.status === 'ok';
    const bg = isSynced ? 'style="background:#d4edda;"' : '';
    
    const cellsHtml = item.data.map((cell, cellIndex) => {
      // КУДА ВЫДАНО теперь железно под индексом 8
      if (cellIndex === 8) {
        return `<td class="log-where-cell" onclick="if(!window.isReturnMode){ enableLogCellEdit(event, ${i}); } else { handleLogClick(${i}); }">${cell}</td>`;
      }
      return `<td onclick="handleLogClick(${i})">${cell}</td>`;
    }).join('');

    return `<tr ${bg}>${cellsHtml}</tr>`;
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
    if (data.balance) {
      window.balanceData = data.balance;
      localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));
    }
    if (data.diff) {
      window.diffData = data.diff;
      localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));
    }

    renderLogs();
    alert("Глобальная синхронизация успешно завершена!");
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
        bodyData = `DELETE_ROW|${item.id}|${item.qty}|${item.itemKeys[0]}|${item.itemKeys[1]}`;
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

document.addEventListener("DOMContentLoaded", () => {
  renderLogs();
  sendUnsynced();
});

