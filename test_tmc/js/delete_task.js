// js/delete_task.js — Полный монолитный скрипт удаления строк с учетом 21 столбца

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
        let currentSkl2 = parseInt(row[8]) || 0; // КОРРЕКТИРОВКА: Смена индекса 7 на 8 (скл.2)

        if (deleteTargetWh === "скл.2") {
          row[8] = currentSkl2 + qty; // КОРРЕКТИРОВКА: Смена индекса 7 на 8 (скл.2)
        } else {
          row[6] = currentSkl1 + qty;
        }
        // Пересчитываем общее количество на основе новых координат складов
        row[4] = (parseInt(row[6]) || 0) + (parseInt(row[8]) || 0); 
        stockUpdated = true;
      }
      return row;
    });

    if (stockUpdated) {
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
    }
  }

  window.qrLogs = window.qrLogs.filter((item, idx) => idx !== window.currentReturnLogIndex);
  localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

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
