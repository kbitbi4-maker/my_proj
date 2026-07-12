// URL вашего Google Apps Script (берем из старого проекта)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWWliIxyk0BxXNE8VriVtLaUbQB31VY8WoAl0hCIoR7fKK_98a70q6C6ioFLlgEofUDw/exec';
// Инициализация баз данных в глобальной области видимости
window.qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
window.inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];
window.isSaving = false;
window.isReturnMode = false; // Глобальное состояние режима возврата

function toggleReturnMode() {
  window.isReturnMode = !window.isReturnMode;
  const btn = document.getElementById('return-mode-btn');
  const tableWrapper = document.querySelector('.content #result .table-wrapper');
  
  if (window.isReturnMode) {
    if (btn) btn.style.background = "#ef4444"; // Окрашиваем кнопку в красный при активации
    if (tableWrapper) tableWrapper.classList.add('return-active');
  } else {
    if (btn) btn.style.background = "transparent";
    if (tableWrapper) tableWrapper.classList.remove('return-active');
  }
  renderLogs();
}

function renderLogs() {
  const head = document.getElementById('logs-head');
  const body = document.getElementById('logs-body');
  if (!head || !body) return;
  if (!window.qrLogs || !window.qrLogs.length) { 
    body.innerHTML = '<tr><td colspan="11">Пусто</td></tr>'; 
    return; 
  }

  if (window.qrLogs[0] && window.qrLogs[0].data) {
    head.innerHTML = window.qrLogs[0].data.map(h => `<th>${h}</th>`).join('');
  }

  // Отрисовка тела с привязкой оригинального индекса из массива qrLogs
  body.innerHTML = window.qrLogs.slice(1).reverse().map((item, revIdx) => {
    if (!item || !item.data) return '';
    
    // Вычисляем настоящий индекс элемента в исходном массиве qrLogs
    const originalIndex = window.qrLogs.length - 1 - revIdx;
    
    // Определяем цвет фона в зависимости от статуса синхронизации и возврата
    let bg = '';
    if (item.status === 'returned' || item.status === 'return_wait') {
      bg = 'style="background:#ffeeeb; color:#c0392b; font-weight:bold;"'; // Светло-красный для возвратов
    } else if (item.status === 'ok') {
      bg = 'style="background:#d4edda;"'; // Светло-зеленый для успешной выдачи
    }
    
    return `<tr ${bg} onclick="handleLogClick(${originalIndex})">${item.data.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
  }).join('');
}

function handleLogClick(index) {
  if (!window.isReturnMode) return; // Если режим возврата выключен — ничего не делаем

  const logItem = window.qrLogs[index];
  if (!logItem || !logItem.data) return;

  // Если товар уже был возвращен ранее, прерываем операцию
  if (logItem.status === 'returned' || logItem.status === 'return_wait') {
    alert("Этот товар уже был возвращен!");
    return;
  }

  const id = logItem.data[0];       // Столбец 1: ID выдачи
  const title = logItem.data[2];    // Столбец 3 в логе (Название товара)
  const itemArt = logItem.data[1];  // Артикул (для поиска в остатках)
  const qty = parseInt(logItem.data[5]) || 0; // Столбец 6 в логе: Количество выданного

  const confirmReturn = confirm(`Произвести возврат \n\nВыдача №${id}: ${title}?`);
  
  if (confirmReturn) {
    // 1. Локально меняем статус строки выдачи на "ожидание возврата"
    logItem.status = 'return_wait';
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

    // 2. Локально увеличиваем количество товара в базе остатков (inventoryData)
    window.inventoryData = window.inventoryData.map(row => {
      // Ищем совпадение по Артикулу (столбец 1) и Названию (столбец 2) внутри таблицы остатков
      if (row && String(row[0]).trim().toLowerCase() === String(itemArt).trim().toLowerCase() && 
                 String(row[1]).trim().toLowerCase() === String(title).trim().toLowerCase()) {
        row[4] = (parseInt(row[4]) || 0) + qty; // Возвращаем количество обратно на склад
      }
      return row;
    });
    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    // Выключаем режим возврата и обновляем интерфейс
    toggleReturnMode(); 
    sendUnsynced(); 
  } else {
    // Если нажали "Отмена" — просто выключаем режим
    toggleReturnMode();
  }
}

async function syncFromGoogle() {
  if (!navigator.onLine) return;
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    
    if (data.logs) {
      // При синхронизации сервер должен присылать статус строки. 
      // Если в массиве данных строки есть маркер возврата (например, строка покрашена на сервере), 
      // GAS должен вернуть статус строки или мы определяем его по вашему признаку.
      window.qrLogs = data.logs.map((row, idx) => {
        // Если это строка данных и сервер пометил её как возврат (например, в конце массива или по вашему флагу)
        // Для обратной совместимости: если GAS умеет отдавать объект со статусом — берём его, иначе 'ok'
        const isRowReturned = row.isReturned === true || (row && row[11] === 'returned');
        return { data: row, status: isRowReturned ? 'returned' : 'ok' };
      });
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
    if (!item) continue;

    // Сценарий 1: Отправка новой обычной выдачи
    if (item.status === 'wait') {
      item.status = 'syncing'; 
      try {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action: 'insert', row: item.data })
        });
        item.status = 'ok';
        localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
        renderLogs();
      } catch (e) {
        item.status = 'wait'; 
        localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
        break; 
      }
    }
    
    // Сценарий 2: Отправка запроса на ВОЗВРАТ товара
    if (item.status === 'return_wait') {
      item.status = 'return_syncing';
      try {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ action: 'return', id: item.data[0], row: item.data }) // Передаем ID выдачи и данные
        });
        item.status = 'returned';
        localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
        renderLogs();
      } catch (e) {
        item.status = 'return_wait';
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
