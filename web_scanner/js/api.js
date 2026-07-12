// URL вашего Google Apps Script (берем из старого проекта) 
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby6liG6fwKIJfTg3iURAdhWItkl1CzXFfoZGxYhgcSH7D2Sxbvu8SCUYlg---jTntlY2Q/exec';
// Инициализация баз данных в глобальной области видимости
window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

function renderLogs() {
  const head = document.getElementById('logs-head');
  const body = document.getElementById('logs-body');
  if (!head || !body) return;
  if (!window.qrLogs || !window.qrLogs.length) { 
    body.innerHTML = '<tr><td colspan="11">Пусто</td></tr>'; 
    return; 
  }

  // Заголовок всегда берем из поля data первой записи в массиве логов
  if (window.qrLogs[0] && window.qrLogs[0].data) {
    head.innerHTML = window.qrLogs[0].data.map(h => `<th>${h}</th>`).join('');
  }

  // Отрисовка тела с сохранением оригинального индекса строки
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
  } catch (e) { 
    alert("Ошибка при синхронизации"); 
  }
}

async function sendUnsynced() {
  if (!navigator.onLine || !window.qrLogs || !window.qrLogs.length) return;
  for (let i = 0; i < window.qrLogs.length; i++) {
    if (window.qrLogs[i] && window.qrLogs[i].status === 'wait') {
      window.qrLogs[i].status = 'syncing'; 
      
      // Определяем тип действия для Google Скрипта
      const actionType = window.qrLogs[i].action || 'insert';
      
      try {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ 
            action: actionType,
            row: window.qrLogs[i].data 
          })
        });
        window.qrLogs[i].status = 'ok';
        localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
        renderLogs();
      } catch (e) {
        window.qrLogs[i].status = 'wait'; 
        localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
        break; 
      }
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderLogs();
  sendUnsynced();
});
