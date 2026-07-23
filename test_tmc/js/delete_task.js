// js/delete_task.js — Полный монолитный скрипт удаления строк с пересчетом "не проведено в SUP"

async function executePhysicalDeletion() {
  if (window.currentReturnLogIndex === null) {
    alert("Ошибка: Строка журнала не выбрана.");
    return;
  }

  const logItem = window.qrLogs[window.currentReturnLogIndex];
  if (!logItem || !logItem.data) {
    alert("Ошибка: Данные строки не найдены.");
    return;
  }

  const rowData = logItem.data;
  const targetId = rowData[0];             
  const art = String(rowData[1]).trim().toLowerCase();    
  const param = String(rowData[2]).trim().toLowerCase();  
  const qty = parseInt(rowData[5]) || 0;    
  const destinationText = String(rowData[8] || "").toUpperCase();

  let deleteTargetWh = "скл.1";
  if (destinationText.indexOf("[СКЛ.2]") !== -1) {
    deleteTargetWh = "скл.2";
  }

  if (!confirm(`Вы уверены, что хотите полностью стереть строку №${targetId} из Google Таблицы?`)) {
    return;
  }

  if (qty > 0) {
    let stockUpdated = false;
    window.inventoryData = window.inventoryData.map(row => {
      if (row && String(row[0]).trim().toLowerCase() === art && String(row[1]).trim().toLowerCase() === param) {
        let currentSkl1 = parseInt(row[6]) || 0;
        let currentSkl2 = parseInt(row[8]) || 0; 

        if (deleteTargetWh === "скл.2") {
          row[8] = currentSkl2 + qty; 
        } else {
          row[6] = currentSkl1 + qty;
        }
        row[4] = (parseInt(row[6]) || 0) + (parseInt(row[8]) || 0); 
        stockUpdated = true;
      }
      return row;
    });

    if (stockUpdated) {
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
    }
  }

  // Удаляем строку из памяти смартфона
  window.qrLogs = window.qrLogs.filter((item, idx) => idx !== window.currentReturnLogIndex);
  localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

  // ИНТЕГРАЦИЯ: Пересчитываем столбец "не проведено в SUP" сразу после удаления записи
  if (typeof recalculateUnprocessedSup === 'function') {
    recalculateUnprocessedSup();
  }

  if (typeof renderLogs === 'function') renderLogs();
  if (typeof renderStock === 'function') renderStock();

  if (document.getElementById('return-view')) {
    document.getElementById('return-view').classList.add('hidden');
  }
  if (typeof closeModal === 'function') closeModal();
  if (typeof toggleReturnMode === 'function' && window.isReturnMode) toggleReturnMode();

  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const textPayload = `DELETE_ROW|${targetId}|${qty}|${art}|${param}`;
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
    } catch (e) {
      console.error("Сетевая ошибка при стирании строки:", e);
    }
  }
}











// js/save.js — Полный монолитный модуль сохранения данных выдачи и возвратов — ЧАСТЬ 1

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
          let s2 = parseInt(window.inventoryData[originalRowIndex][8]) || 0; 
          let rem = item.qty;

          if (item.wh === "скл.1") {
            if (s1 >= rem) { 
              window.inventoryData[originalRowIndex][6] = s1 - rem; 
            } else { 
              window.inventoryData[originalRowIndex][6] = 0; 
              rem -= s1; 
              window.inventoryData[originalRowIndex][8] = Math.max(0, s2 - rem); 
            }
          } else {
            if (s2 >= rem) { 
              window.inventoryData[originalRowIndex][8] = s2 - rem; 
            } else { 
              window.inventoryData[originalRowIndex][8] = 0; 
              rem -= s2; 
              window.inventoryData[originalRowIndex][6] = Math.max(0, s1 - rem); 
            }
          }
          window.inventoryData[originalRowIndex][4] = window.inventoryData[originalRowIndex][6] + window.inventoryData[originalRowIndex][8];
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

      // ИНТЕГРАЦИЯ: Пересчитываем SUP на основе обновленной корзины перед фиксацией кэша
      if (typeof recalculateUnprocessedSup === 'function') {
        recalculateUnprocessedSup();
      }

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
