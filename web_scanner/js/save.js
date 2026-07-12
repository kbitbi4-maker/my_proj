// js/save.js — Модуль сохранения записей и прямого списания остатков (до 100 строк)

async function saveEntry() {
  if (window.isSaving) return; 
  window.isSaving = true;

  try {
    // 1. Формирование даты и времени
    const now = new Date(),
          hh = now.getHours().toString().padStart(2, '0'),
          mm = now.getMinutes().toString().padStart(2, '0'),
          time = "'" + hh + ":" + mm,
          day = now.getDate().toString().padStart(2, '0'),
          month = (now.getMonth() + 1).toString().padStart(2, '0'),
          year = now.getFullYear().toString().slice(-2);
    
    const currentWorker = window.currentUser || "Не указан";
    const author = "Неугодников"; 
    
    if (!window.currentSelectedRowData || window.currentSelectedRowData.length === 0) {
      alert("Ошибка: Товар не выбран из журнала!");
      window.isSaving = false;
      return;
    }

    // 2. Извлечение чистых данных товара (первые 4 ячейки из строки остатков)
    const itemKeys = window.currentSelectedRowData.slice(0, 4);
    const qty = parseInt(window.currentQty) || 0;

    // 3. Расчет нового сквозного ID для журнала выдачи
    const nextId = window.qrLogs.length > 1 
      ? Math.max(...window.qrLogs.filter(r => r.status === 'ok' || !isNaN(r.data[0])).map(r => parseInt(r.data[0]) || 0)) + 1 
      : 1;

    // 4. Прямой маппинг в новую строку выдачи: ячейка в ячейку без разделителей
    const newRowData = [nextId, ...itemKeys, qty, currentWorker, author, time, day, month, year];

    // 5. Локальное списание остатка в массиве inventoryData (сравнение массивов по ячейкам)
    window.inventoryData = window.inventoryData.map(row => {
      const match = String(row[0]) === String(itemKeys[0]) &&
                    String(row[1]) === String(itemKeys[1]) &&
                    String(row[2]) === String(itemKeys[2]) &&
                    String(row[3]) === String(itemKeys[3]);
      if (match) {
        row[4] = (parseInt(row[4]) || 0) - qty;
      }
      return row;
    });

    // 6. Сохранение изменений в локальные базы браузера (LocalStorage)
    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
    window.qrLogs.push({ data: newRowData, status: 'wait' });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));   
    
    // 7. Обновление интерфейса главного меню и закрытие окон
    if (typeof renderLogs === 'function') renderLogs(); 
    if (typeof closeModal === 'function') closeModal();
    
    window.isSaving = false; 
    
    // 8. Фоновая отправка в Google Таблицы
    if (typeof sendUnsynced === 'function') sendUnsynced(); 
    
  } catch (e) { 
    console.error("Ошибка при сохранении записи:", e); 
    window.isSaving = false; 
  }
}

