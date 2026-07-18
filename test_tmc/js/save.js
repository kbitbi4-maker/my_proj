// js/save.js — Полный монолитный модуль сохранения данных выдачи и возвратов — ЧАСТЬ 1
// АВТОР: AI DEVELOPER
// ГАРАНТИЯ ТЕКСТОВЫХ МЕТОК СКЛАДОВ ПРИ ПАКЕТНОЙ И ОДИНОЧНОЙ ВЫДАЧЕ/ВОЗВРАТЕ ДЛЯ ОБЛАКА

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

    // =========================================================================
    // БЛОК ОПЕРАЦИЙ: СБОРНАЯ МНОЖЕСТВЕННАЯ ВЫДАЧА ТОВАРОВ ИЗ КОРЗИНЫ
    // =========================================================================
    if (!window.isPartialReturnInput && window.issuanceBasket && window.issuanceBasket.length > 0) {
      window.issuanceBasket.forEach(item => {
        let originalRowIndex = item.stockRowIndex;
        if (originalRowIndex === undefined || originalRowIndex === -1) {
          for (let i = 1; i < window.inventoryData.length; i++) {
            if (window.inventoryData[i] && 
                String(window.inventoryData[i][0]).toLowerCase() === String(item.p1).toLowerCase() && 
                String(window.inventoryData[i][1]).toLowerCase() === String(item.p2).toLowerCase()) {
              originalRowIndex = i;
              break;
            }
          }
        }

        if (originalRowIndex !== -1 && window.inventoryData[originalRowIndex]) {
          let s1 = parseInt(window.inventoryData[originalRowIndex][6]) || 0; 
          let s2 = parseInt(window.inventoryData[originalRowIndex][7]) || 0; 
          let rem = item.qty;

          if (item.wh === "скл.1") {
            if (s1 >= rem) { 
              window.inventoryData[originalRowIndex][6] = s1 - rem; 
            } else { 
              window.inventoryData[originalRowIndex][6] = 0; 
              rem -= s1; 
              window.inventoryData[originalRowIndex][7] = Math.max(0, s2 - rem); 
            }
          } else {
            if (s2 >= rem) { 
              window.inventoryData[originalRowIndex][7] = s2 - rem; 
            } else { 
              window.inventoryData[originalRowIndex][7] = 0; 
              rem -= s2; 
              window.inventoryData[originalRowIndex][6] = Math.max(0, s1 - rem); 
            }
          }
          window.inventoryData[originalRowIndex][4] = window.inventoryData[originalRowIndex][6] + window.inventoryData[originalRowIndex][7];
        }

        const nextId = window.qrLogs.length > 0 
          ? Math.max(...window.qrLogs.filter(r => r && r.data && !isNaN(r.data[0])).map(r => parseInt(r.data[0]) || 0)) + 1 
          : 1;

        const whMark = ` [${item.wh.toUpperCase()}]`;
        const logRowData = [
          nextId, item.p1, item.p2, item.p3, item.p4, item.qty, currentWorker, author, targetDestination + whMark, time, day, month, year
        ];
        window.qrLogs.push({ data: logRowData, status: 'wait' });
      });

      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));   
      
      if (typeof renderLogs === 'function') renderLogs(); 
      if (typeof renderStock === 'function') renderStock(); 
      
      window.issuanceBasket = [];
      closeModal(); 
      window.isSaving = false; 
      if (typeof sendUnsynced === 'function') sendUnsynced(); 
      return;
    }











  // js/save.js — Полный монолитный модуль сохранения данных выдачи и возвратов — ЧАСТЬ 2
// АВТОР: AI DEVELOPER
// ЧАСТИЧНЫЙ ВОЗВРАТ И ОДИНОЧНАЯ ВЫДАЧА С ФИКСАЦИЕЙ СКЛАДОВ БЕЗ БЛОКИРУЮЩИХ АЛЕРТОВ

    // Извлекаем ключи для одиночных операций (прямой ввод в нумпад)
    const p1 = window.currentSelectedRowData[0] || "";
    const p2 = window.currentSelectedRowData[1] || "";
    const p3 = window.currentSelectedRowData[2] || "";
    const p4 = window.currentSelectedRowData[3] || "";
    
    let originalRowIndex = -1;
    for (let i = 1; i < window.inventoryData.length; i++) {
      if (window.inventoryData[i] && 
          String(window.inventoryData[i][0]).trim().toLowerCase() === String(p1).trim().toLowerCase() && 
          String(window.inventoryData[i][1]).trim().toLowerCase() === String(p2).trim().toLowerCase()) {
        originalRowIndex = i;
        break;
      }
    }

    const enteredQty = parseInt(window.currentQty) || 0;
    if (enteredQty <= 0) { 
      alert("Ошибка: Количество должно быть больше 0!"); 
      window.isSaving = false; 
      return; 
    }

    // =========================================================================
    // УМНАЯ ВЕТКА А: ЧАСТИЧНЫЙ ВОЗВРАТ С АВТОМАТИЧЕСКИМ СКЛЕИВАНИЕМ МЕТКИ СКЛАДА
    // =========================================================================
    if (window.isPartialReturnInput) {
      const maxAvailableToReturn = parseInt(window.currentSelectedRowData[4]) || 0;
      const partTargetWh = window.currentSelectedRowData[5] || "скл.1";

      if (enteredQty > maxAvailableToReturn) {
        alert(`Ошибка: Нельзя вернуть больше, чем было выдано! (Максимум: ${maxAvailableToReturn} шт.)`);
        window.isSaving = false; return;
      }

      if (originalRowIndex !== -1 && window.inventoryData[originalRowIndex]) {
        let currentSkl1 = parseInt(window.inventoryData[originalRowIndex][6]) || 0;
        let currentSkl2 = parseInt(window.inventoryData[originalRowIndex][7]) || 0;
        
        if (partTargetWh === "скл.2") {
          window.inventoryData[originalRowIndex][7] = currentSkl2 + enteredQty;
        } else {
          window.inventoryData[originalRowIndex][6] = currentSkl1 + enteredQty;
        }
        window.inventoryData[originalRowIndex][4] = window.inventoryData[originalRowIndex][6] + window.inventoryData[originalRowIndex][7];
      }
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

      const nextId = window.qrLogs.length > 0 
        ? Math.max(...window.qrLogs.filter(r => r && r.data && !isNaN(r.data[0])).map(r => parseInt(r.data[0]) || 0)) + 1 
        : 1;

      // КРИТИЧЕСКИЙ ФИКС: Принудительно добавляем текстовую метку [СКЛ.1]/[СКЛ.2] в лог возврата части
      const whMark = ` [${partTargetWh.toUpperCase()}]`;
      const returnPartRowData = [
        nextId, p1, p2, p3, p4, -enteredQty, currentWorker, author, targetDestination + whMark, time, day, month, year
      ];
      
      window.qrLogs.push({ data: returnPartRowData, status: 'wait' });
      localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));   
      
      if (typeof renderLogs === 'function') renderLogs(); 
      if (typeof renderStock === 'function') renderStock(); 
      
      window.isPartialReturnInput = false;
      closeModal(); 
      window.isSaving = false; 
      if (typeof sendUnsynced === 'function') sendUnsynced(); 
      return; 
    }

    // =========================================================================
    // ВЕТКА Б: СТАНДАРТНАЯ ОДИНОЧНАЯ ВЫДАЧА (УЧИТЫВАЕТ ВЫБРАННЫЙ ТУМБЛЕР СКЛАДА)
    // =========================================================================
    if (originalRowIndex !== -1 && window.inventoryData[originalRowIndex]) {
      let rem = enteredQty;
      let s1 = parseInt(window.inventoryData[originalRowIndex][6]) || 0;
      let s2 = parseInt(window.inventoryData[originalRowIndex][7]) || 0;
      
      const currentSelectedWh = window.numpadSelectedWarehouse || "скл.1";

      if (currentSelectedWh === "скл.2") {
        if (s2 >= rem) { 
          window.inventoryData[originalRowIndex][7] = s2 - rem; 
        } else { 
          window.inventoryData[originalRowIndex][7] = 0; 
          rem -= s2; 
          window.inventoryData[originalRowIndex][6] = Math.max(0, s1 - rem); 
        }
      } else {
        if (s1 >= rem) { 
          window.inventoryData[originalRowIndex][6] = s1 - rem; 
        } else { 
          window.inventoryData[originalRowIndex][6] = 0; 
          rem -= s1; 
          window.inventoryData[originalRowIndex][7] = Math.max(0, s2 - rem); 
        }
      }
      window.inventoryData[originalRowIndex][4] = window.inventoryData[originalRowIndex][6] + window.inventoryData[originalRowIndex][7];
    }

    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    const nextId = window.qrLogs.length > 0 
      ? Math.max(...window.qrLogs.filter(r => r && r.data && !isNaN(r.data[0])).map(r => parseInt(r.data[0]) || 0)) + 1 
      : 1;

    // Принудительно маркируем склад для одиночной выдачи, чтобы сервер Apps Script списал его верно
    const whSingleMark = ` [${window.numpadSelectedWarehouse.toUpperCase()}]`;
    const newRowData = [
      nextId, p1, p2, p3, p4, enteredQty, currentWorker, author, targetDestination + whSingleMark, time, day, month, year
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
