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
  
  // Для отображения на экране берем только реальные записи выдач/возвратов (где есть поле data)
  // Скрытые технические маркеры удаления на экран выводить не нужно
  const visibleLogs = window.qrLogs.filter(item => item && item.data);

  if (!visibleLogs.length) { 
    body.innerHTML = '<tr><td colspan="11">Пусто</td></tr>'; 
    return; 
  }

  // Заголовок берем из первой строки базы данных логов
  if (window.qrLogs[0] && window.qrLogs[0].data) {
    head.innerHTML = window.qrLogs[0].data.map(h => `<th>${h}</th>`).join('');
  }

  // Отрисовка тела: выводим записи в обратном порядке (новые сверху)
  // Передаем оригинальный индекс i в функцию handleLogClick, чтобы всегда точно знать строку
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
 * ФОНОВАЯ АВТОМАТИЧЕСКАЯ СИНХРОНИЗАЦИЯ: Умеет и добавлять записи, и удалять строки
 */
async function sendUnsynced() {
  if (!navigator.onLine || !window.qrLogs || !window.qrLogs.length) return;
  
  for (let i = 0; i < window.qrLogs.length; i++) {
    const item = window.qrLogs[i];
    if (!item || item.status !== 'wait') continue;

    // Блокируем элемент очереди, чтобы избежать дублирования запросов
    item.status = 'syncing'; 
    
    try {
      let payload = {};
      
      // Анализируем, что именно находится в очереди отправки
      if (item.action === 'delete') {
        // ЕСЛИ ЭТО МАРКЕР УДАЛЕНИЯ: формируем команду удаления для Google Script
        payload = {
          action: "delete",
          id: item.id,
          itemKeys: item.itemKeys,
          qty: item.qty
        };
      } else if (item.data) {
        // ЕСЛИ ЭТО ОБЫЧНАЯ СТРОКА: формируем стандартный пакет отправки выдачи/возврата
        payload = { row: item.data };
      }

      // Отправляем данные как чистый текст (text/plain). 
      // Это критически важно, чтобы Google Apps Script смог прочитать тело запроса в фоне
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify(payload)
      });

      // ПОСЛЕ УСПЕШНОГО ОТВЕТА СЕРВЕРА:
      if (item.action === 'delete') {
        // Если это была команда на удаление — полностью стираем маркер из локальной очереди
        window.qrLogs.splice(i, 1);
        i--; // Сдвигаем индекс цикла назад, так как элемент удален из массива
      } else {
        // Если это была обычная строка — переводим её в статус 'ok' (она станет зеленой)
        item.status = 'ok';
      }
      
      // Сохраняем обновленное состояние в память телефона и обновляем экран
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      renderLogs();
      
    } catch (e) {
      console.error("Ошибка при фоновой отправке:", e);
      // В случае сбоя сети возвращаем статус обратно в 'wait' для следующей автоматической попытки
      item.status = 'wait'; 
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
      break; 
    }
  }
}

// Запуск фоновой выгрузки при старте приложения
document.addEventListener("DOMContentLoaded", () => {
  renderLogs();
  sendUnsynced();
});
