// URL вашего Google Apps Script
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWWliIxyk0BxXNE8VriVtLaUbQB31VY8WoAl0hCIoR7fKK_98a70q6C6ioFLlgEofUDw/exec';
// Инициализация баз данных в глобальной области видимости
window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

/**
 * Отрисовка журнала выданных товаров на главном экране
 */
function renderLogs() {
  const head = document.getElementById('logs-head');
  const body = document.getElementById('logs-body');
  if (!head || !body) return;
  
  const visibleLogs = window.qrLogs.filter(item => item && item.data);

  if (!visibleLogs.length) { 
    body.innerHTML = '<tr><td colspan="11">Пусто</td></tr>'; 
    return; 
  }

  if (window.qrLogs && window.qrLogs[0] && window.qrLogs[0].data) {
    head.innerHTML = window.qrLogs[0].data.map(h => `<th>${h}</th>`).join('');
  }

  body.innerHTML = window.qrLogs.map((item, i) => {
    if (i === 0 || !item || !item.data) return '';
    const isSynced = item.status === 'ok';
    const bg = isSynced ? 'style="background:#d4edda;"' : '';
    return `<tr ${bg} onclick="handleLogClick(${i})">${item.data.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
  }).filter(Boolean).reverse().join('');
}

/**
 * Принудительное скачивание актуальной базы из Google Таблиц (Кнопка «Облачко»)
 */
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

/**
 * ФОНОВАЯ АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ: Разделяет POST для выдач и GET для удалений
 */
async function sendUnsynced() {
  if (!navigator.onLine || !window.qrLogs || !window.qrLogs.length) return;
  
  for (let i = 0; i < window.qrLogs.length; i++) {
    const item = window.qrLogs[i];
    if (!item || item.status !== 'wait') continue;

    item.status = 'syncing'; 
    
    try {
      if (item.action === 'delete') {
        // ЕСЛИ ЭТО УДАЛЕНИЕ: собираем параметры в прямую GET-строку
        const art = encodeURIComponent(item.itemKeys[0] || "");
        const param = encodeURIComponent(item.itemKeys[1] || "");
        const deleteUrl = `${SCRIPT_URL}?action=delete&id=${item.id}&qty=${item.qty}&art=${art}&param=${param}`;
        
        // Отправляем легкий GET-запрос (он никогда не блокируется CORS)
        await fetch(deleteUrl, { method: 'GET' });

        // Успешно выполнено в облаке — вырезаем маркер задачи из очереди телефона
        window.qrLogs.splice(i, 1);
        i--; 
      } else if (item.data) {
        // ЕСЛИ ЭТО ОБЫЧНАЯ ВЫДАЧА/ВОЗВРАТ: используем ваш оригинальный рабочий POST
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ row: item.data })
        });
        
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
