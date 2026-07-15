// js/save.js — Модуль сохранения данных выдачи и возвратов

async function saveEntry() {
  if (window.isSaving) return; 
  window.isSaving = true;

  try {
    const now = new Date(),
          hh = now.getHours().toString().padStart(2, '0'),
          mm = now.getMinutes().toString().padStart(2, '0'),
          time = "'" + hh + ":" + mm;
          
    let day, month, year;

    if (window.customDateStr && window.customDateStr.length === 6) {
      day = window.customDateStr.substring(0, 2);
      month = window.customDateStr.substring(2, 4);
      year = window.customDateStr.substring(4, 6);
    } else {
      day = now.getDate().toString().padStart(2, '0');
      month = (now.getMonth() + 1).toString().padStart(2, '0');
      year = now.getFullYear().toString().slice(-2);
    }
    
    const currentWorker = window.currentUser || "Не указан";
    const author = "Неугодникова"; 
    const targetDestination = window.currentWhere || "Не указан";
    
    if (!window.currentSelectedRowData || window.currentSelectedRowData.length === 0) {
      alert("Ошибка: Товар не выбран!");
      window.isSaving = false;
      return;
    }

    const itemKeys = window.currentSelectedRowData.slice(0, 4);
    const enteredQty = parseInt(window.currentQty) || 0;

    if (enteredQty <= 0) {
      alert("Ошибка: Количество должно быть больше 0!");
      window.isSaving = false;
      return;
    }

    // =========================================================================
    // ВЕТКА А: ЕСЛИ ВКЛЮЧЕН РЕЖИМ «ВЕРНУТЬ ЧАСТЬ» ЧЕРЕЗ НУМПАД
    // =========================================================================
    if (window.isPartialReturnInput) {
      const maxAvailableToReturn = parseInt(window.currentSelectedRowData[4]) || 0;
      
      if (enteredQty > maxAvailableToReturn) {
        alert(`Ошибка: Нельзя вернуть больше, чем было выдано! (Максимум: ${maxAvailableToReturn} шт.)`);
        window.isSaving = false;
        return;
      }

      window.inventoryData = window.inventoryData.map(row => {
        if (row && 
            String(row[0]).trim() == String(itemKeys[0]).trim() && 
            String(row[1]).trim() == String(itemKeys[1]).trim() && 
            String(row[2]).trim() == String(itemKeys[2]).trim() && 
            String(row[3]).trim() == String(itemKeys[3]).trim()) {
          row[4] = (parseInt(row[4]) || 0) + enteredQty;
        }
        return row;
      });
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

      const nextId = window.qrLogs.length > 1 
        ? Math.max(...window.qrLogs.filter(r => r.status === 'ok' || (r.data && !isNaN(r.data[0]))).map(r => parseInt(r.data[0]) || 0)) + 1 
        : 1;

      // Формируем 13 столбцов [ID, Арт, Парам, Имя1, Имя2, Кол-во, КУДА, Сотр, Автор, Время, Д, М, Г]
      const returnPartRowData = [nextId, ...itemKeys, -enteredQty, targetDestination, currentWorker, author, time, day, month, year];

      window.qrLogs.push({ data: returnPartRowData, status: 'wait' });
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));   
      
      if (typeof renderLogs === 'function') renderLogs(); 
      
      window.isPartialReturnInput = false;
      const addBtnEl = document.getElementById('addBtn');
      if (addBtnEl) addBtnEl.style.background = "#22c55e"; 

      closeModal();
      if (typeof toggleReturnMode === 'function' && window.isReturnMode) toggleReturnMode();
      
      window.isSaving = false; 
      if (typeof sendUnsynced === 'function') sendUnsynced(); 
      return; 
    }

    // =========================================================================
    // ВЕТКА Б: СТАНДАРТНЫЙ РЕЖИМ ОБЫЧНОЙ ВЫДАЧИ ТОВАРОВ (13 СТОЛБЦОВ)
    // =========================================================================
    window.inventoryData = window.inventoryData.map(row => {
      if (row && row[0] === itemKeys[0] && row[1] === itemKeys[1] && row[2] === itemKeys[2] && row[3] === itemKeys[3]) {
        row[4] = (parseInt(row[4]) || 0) - enteredQty;
      }
      return row;
    });

    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    const nextId = window.qrLogs.length > 1 
      ? Math.max(...window.qrLogs.filter(r => r.status === 'ok' || (r.data && !isNaN(r.data[0]))).map(r => parseInt(r.data[0]) || 0)) + 1 
      : 1;

    const newRowData = [nextId, ...itemKeys, enteredQty, targetDestination, currentWorker, author, time, day, month, year];

    window.qrLogs.push({ data: newRowData, status: 'wait' });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));   
    
    if (typeof renderLogs === 'function') renderLogs(); 
    closeModal();
    
    window.isSaving = false; 
    if (typeof sendUnsynced === 'function') sendUnsynced(); 
    
  } catch (e) { 
    console.error("Ошибка при сохранении:", e); 
    window.isSaving = false; 
  }
}
