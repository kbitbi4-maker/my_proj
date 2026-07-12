// URL вашего Google Apps Script
const SCRIPT_URL = 'https://google.com';
// Инициализация баз данных в глобальной области видимости
window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;

function renderLogs() {
  const head = document.getElementById('logs-head');
  const body = document.getElementById('logs-body');
  if (!head || !body) return;
  
  // Фильтруем логи: для отображения на экране берем только реальные строки данных
  const visibleLogs = window.qrLogs.filter(item => item && item.data);

  if (!visibleLogs.length) { 
    body.innerHTML = '<tr><td colspan="11">Пусто</td></tr>'; 
    return; 
  }

  // Заголовок всегда берем из поля data первой записи в массиве логов
  if (visibleLogs[0] && visibleLogs[0].data) {
    head.innerHTML = visibleLogs[0].data.map(h => `<th>${h}</th>`).join('');
  }

  // Отрисовка тела: берем всё, кроме первой строки, переворачиваем и выводим
  body.innerHTML = window.qrLogs.map((item, originalIndex) => {
    if (originalIndex === 0 || !item || !item.data) return '';
    const isSynced = item.status === 'ok';
    const bg = isSynced ? 'style="background:#d4edda;"' : '';
    return `<tr ${bg} onclick="handleLogClick(${originalIndex})">${item.data.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
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
    const item = window.qrLogs[i];
    if (!item || item.status !== 'wait') continue;

    item.status = 'syncing'; 
    
    try {
      let payload = {};
      
      // Проверяем тип задачи в буфере
      if (item.action === 'delete') {
        // Формируем команду удаления
        payload = {
          action: "delete",
          id: item.id,
          itemKeys: item.itemKeys,
          qty: item.qty
        };
      } else if (item.data) {
        // Если это обычная строка выдачи или возврата
        payload = { row: item.data };
      }

      // ВАЖНО: Отправляем как чистый ТЕКСТ (text/plain). 
      // Это позволяет обойти блокировку Google при фоновых POST запросах без использования mode: 'no-cors'
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      // Если это было удаление — мы стираем этот маркер из локальной базы, задача выполнена в облаке
      if (item.action === 'delete') {
        window.qrLogs.splice(i, 1);
        i--; // Сдвигаем индекс назад, так как элемент удален
      } else {
        item.status = 'ok';
      }
      
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      renderLogs();
    } catch (e) {
      // При ошибке связи возвращаем статус обратно в 'wait' для следующей попытки
      item.status = 'wait'; 
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      break; 
    }
  }
}

// Безопасный запуск отрисовки при загрузке DOM
document.addEventListener("DOMContentLoaded", () => {
  renderLogs();
  sendUnsynced();
});
