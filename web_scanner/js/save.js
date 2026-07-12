// js/save.js — Модуль сохранения записей и прямого списания остатков (до 100 строк)

async function saveEntry() {
  if (window.isSaving) return; 
  window.isSaving = true;

  try {
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
      alert("Ошибка: Товар не выбран!");
      window.isSaving = false;
      return;
    }

    // Извлекаем чистые данные товара (первые 4 ячейки строки) и количество
    const itemKeys = window.currentSelectedRowData.slice(0, 4);
    const qty = parseInt(window.currentQty) || 0;

    // Расчет нового ID на основе данных внутри объектов структуры логов
    const nextId = window.qrLogs.length > 1 
      ? Math.max(...window.qrLogs.filter(r => r.status === 'ok' || (r.data && !isNaN(r.data[0]))).map(r => parseInt(r.data[0]) || 0)) + 1 
      : 1;

    // Прямая вставка без разделителей
    const newRowData = [nextId, ...itemKeys, qty, currentWorker, author, time, day, month, year];

    // Локальное списание остатка: сравниваем первые 4 ячейки каждой строки
    window.inventoryData = window.inventoryData.map(row => {
      if (row && row[0] === itemKeys[0] && row[1] === itemKeys[1] && row[2] === itemKeys[2] && row[3] === itemKeys[3]) {
        row[4] = (parseInt(row[4]) || 0) - qty;
      }
      return row;
    });

    // Сохранение в LocalStorage
    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
    window.qrLogs.push({ data: newRowData, status: 'wait' });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));   
    
    // Обновление интерфейса
    if (typeof renderLogs === 'function') renderLogs(); 
    if (typeof closeModal === 'function') closeModal();
    
    window.isSaving = false; 
    if (typeof sendUnsynced === 'function') sendUnsynced(); 
    
  } catch (e) { 
    console.error("Ошибка при сохранении:", e); 
    window.isSaving = false; 
  }
}
