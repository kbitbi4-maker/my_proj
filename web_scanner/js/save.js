// js/save.js — Модуль сохранения данных выдачи и возвратов — ЧАСТЬ 1

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

    // Извлекаем ключи товара (Артикул — индекс 0, Параметр — индекс 1 на Листе 1)
    const p1 = window.currentSelectedRowData[0] || "";
    const p2 = window.currentSelectedRowData[1] || "";
    const p3 = window.currentSelectedRowData[2] || "";
    const p4 = window.currentSelectedRowData[3] || "";
    
    const enteredQty = parseInt(window.currentQty) || 0;

    if (enteredQty <= 0) {
      alert("Ошибка: Количество должно быть больше 0!");
      window.isSaving = false;
      return;
    }

    // Жестко находим точный порядковый номер строки товара в базе телефона window.inventoryData
    let originalRowIndex = -1;
    for (let i = 1; i < window.inventoryData.length; i++) {
      if (window.inventoryData[i] && 
          String(window.inventoryData[i][0]).trim().toLowerCase() === String(p1).trim().toLowerCase() && 
          String(window.inventoryData[i][1]).trim().toLowerCase() === String(p2).trim().toLowerCase()) {
        originalRowIndex = i;
        break;
      }
    }
// js/save.js — Модуль сохранения данных выдачи и возвратов — ЧАСТЬ 2

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

      // КРИТИЧЕСКИЙ ФИКС ИНДЕКСОВ: Товар железно начисляется на скл.1 (индекс 6)
      if (originalRowIndex !== -1 && window.inventoryData[originalRowIndex]) {
        let currentSkl1 = parseInt(window.inventoryData[originalRowIndex][6]) || 0;
        let currentSkl2 = parseInt(window.inventoryData[originalRowIndex][7]) || 0;
        
        // 1. Прибавляем возвращенное количество на Склад 1
        window.inventoryData[originalRowIndex][6] = currentSkl1 + enteredQty;
        // 2. Пересчитываем Общий запас (индекс 4 = скл.1 + скл.2)
        window.inventoryData[originalRowIndex][4] = (currentSkl1 + enteredQty) + currentSkl2;
      }
      
      // Записываем обновленный массив в локальную память телефона
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

      const nextId = window.qrLogs.length > 0 
        ? Math.max(...window.qrLogs.filter(r => r && r.data && !isNaN(r.data[0])).map(r => parseInt(r.data[0]) || 0)) + 1 
        : 1;

      const returnPartRowData = [
        nextId, p1, p2, p3, p4, -enteredQty, currentWorker, author, targetDestination, time, day, month, year
      ];

      window.qrLogs.push({ data: returnPartRowData, status: 'wait' });
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));   
      
      // ОБНОВЛЯЕМ ЭКРАНЫ: перерисовываем журнал выдачи и таблицу остатков на телефоне
      if (typeof renderLogs === 'function') renderLogs(); 
      if (typeof renderStock === 'function') renderStock(); 
      
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
    // ВЕТКА Б: СТАНДАРТНЫЙ РЕЖИМ ОБЫЧНОЙ ВЫДАЧИ ТОВАРОВ (СПИСАНИЕ СКЛ1 -> СКЛ2)
    // =========================================================================
    if (originalRowIndex !== -1 && window.inventoryData[originalRowIndex]) {
      let rem = enteredQty;
      let s1 = parseInt(window.inventoryData[originalRowIndex][6]) || 0;
      let s2 = parseInt(window.inventoryData[originalRowIndex][7]) || 0;

      if (s1 >= rem) {
        window.inventoryData[originalRowIndex][6] = s1 - rem;
      } else {
        window.inventoryData[originalRowIndex][6] = 0;
        rem -= s1;
        window.inventoryData[originalRowIndex][7] = Math.max(0, s2 - rem);
      }
      
      // Пересчитываем общее количество остатка (индекс 4 = скл.1 + скл.2)
      window.inventoryData[originalRowIndex][4] = window.inventoryData[originalRowIndex][6] + window.inventoryData[originalRowIndex][7];
    }

    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    const nextId = window.qrLogs.length > 0 
      ? Math.max(...window.qrLogs.filter(r => r && r.data && !isNaN(r.data[0])).map(r => parseInt(r.data[0]) || 0)) + 1 
      : 1;

    const newRowData = [
      nextId, p1, p2, p3, p4, enteredQty, currentWorker, author, targetDestination, time, day, month, year
    ];

    window.qrLogs.push({ data: newRowData, status: 'wait' });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));   
    
    if (typeof renderLogs === 'function') renderLogs(); 
    if (typeof renderStock === 'function') renderStock(); 
    closeModal();
    
    window.isSaving = false; 
    if (typeof sendUnsynced === 'function') sendUnsynced(); 
    
  } catch (e) { 
    console.error("Ошибка при сохранении:", e); 
    window.isSaving = false; 
  }
}
