// js/save.js — Модуль сохранения данных выдачи и возвратов

async function saveEntry() {
  if (window.isSaving) return; 
  window.isSaving = true;

  try {
    const now = new Date(),
          hh = now.getHours().toString().padStart(2, '0'),
          mm = now.getMinutes().toString().padStart(2, '0'),
          time = "'" + hh + ":" + mm; // Форматируем время апострофом для Excel
          
    let day, month, year;

    // Проверяем, вводил ли пользователь кастомную дату на нумпаде
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

    // Извлекаем первые 4 параметра из строки остатков склада
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

      // 1. Возвращаем указанную часть товара на локальный склад на телефоне
      window.inventoryData = window.inventoryData.map(row => {
        if (row && 
            String(row[0]).trim() == String(p1).trim() && 
            String(row[1]).trim() == String(p2).trim() && 
            String(row[2]).trim() == String(p3).trim() && 
            String(row[3]).trim() == String(p4).trim()) {
          row[4] = (parseInt(row[4]) || 0) + enteredQty;
        }
        return row;
      });
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

      // 2. Считаем новый уникальный ID для лога возврата части
      const nextId = window.qrLogs.length > 1 
        ? Math.max(...window.qrLogs.filter(r => r.status === 'ok' || (r.data && !isNaN(r.data[0]))).map(r => parseInt(r.data[0]) || 0)) + 1 
        : 1;

      // 3. Формируем запись: строго 13 элементов (4 ячейки даты/времени в конце)
      const returnPartRowData = [
        nextId,             // 1. ID (index 0)
        p1,                 // 2. Артикул / Парам 1 (index 1)
        p2,                 // 3. Парам 2 (index 2)
        p3,                 // 4. Парам 3 (index 3)
        p4,                 // 5. Наименование / Парам 4 (index 4)
        -enteredQty,        // 6. Кол-во со знаком МИНУС (index 5)
        currentWorker,      // 7. Сотрудник (index 6)
        author,             // 8. Автор (index 7)
        targetDestination,  // 9. КУДА ВЫДАНО (index 8)
        time,               // 10. Время (index 9)
        day,                // 11. День (index 10)
        month,              // 12. Месяц (index 11)
        year                // 13. Год (index 12)
      ];

      // 4. Сохраняем в локальный буфер
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
    // ВЕТКА Б: СТАНДАРТНЫЙ РЕЖИМ ОБЫЧНОЙ ВЫДАЧИ ТОВАРОВ
    // =========================================================================
    window.inventoryData = window.inventoryData.map(row => {
      if (row && row[0] === p1 && row[1] === p2 && row[2] === p3 && row[3] === p4) {
        row[4] = (parseInt(row[4]) || 0) - enteredQty;
      }
      return row;
    });

    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    const nextId = window.qrLogs.length > 1 
      ? Math.max(...window.qrLogs.filter(r => r.status === 'ok' || (r.data && !isNaN(r.data[0]))).map(r => parseInt(r.data[0]) || 0)) + 1 
      : 1;

    // Формируем чистую 13-столбцовую строку обычной выдачи
    const newRowData = [
      nextId,             // 1. ID
      p1,                 // 2. Артикул
      p2,                 // 3. Парам 1
      p3,                 // 4. Парам 2
      p4,                 // 5. Наименование
      enteredQty,         // 6. Кол-во
      currentWorker,      // 7. Сотрудник
      author,             // 8. Автор
      targetDestination,  // 9. КУДА ВЫДАНО (Строгий индекс 8!)
      time,               // 10. Время
      day,                // 11. День
      month,              // 12. Месяц
      year                // 13. Год
    ];

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
