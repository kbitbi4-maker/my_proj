// js/delete_task.js — Модернизированный фронтенд-скрипт физического удаления строк

async function executePhysicalDeletion() {
  if (window.currentReturnLogIndex === null) { alert("Ошибка: Строка журнала не выбрана."); return; }
  const logItem = window.qrLogs[window.currentReturnLogIndex];
  if (!logItem || !logItem.data) { alert("Ошибка: Данные строки не найдены."); return; }

  const rowData = logItem.data;
  const targetId = rowData[0];             
  const art = String(rowData[1]).trim().toLowerCase();    
  const param = String(rowData[2]).trim().toLowerCase();  
  const qty = parseInt(rowData[5]) || 0;    
  const destinationText = String(rowData[8] || "").toUpperCase();

  // УМНОЕ ОПРЕДЕЛЕНИЕ СКЛАДА НА СТОРОНЕ ТЕЛЕФОНА ПРИ УДАЛЕНИИ СТРОКИ ВЫДАЧИ
  let deleteTargetWh = "скл.1";
  if (destinationText.indexOf("[СКЛ.2]") !== -1) { deleteTargetWh = "скл.2"; }

  if (!confirm(`Вы уверены, что хотите полностью стереть строку №${targetId} из Google Таблицы?`)) { return; }

  // 1. КОРРЕКТИРУЕМ ЛОКАЛЬНЫЙ СКЛАД НА ТЕЛЕФОНЕ НА ПРАВИЛЬНЫЙ СКЛАД
  if (qty > 0) {
    let stockUpdated = false;
    window.inventoryData = window.inventoryData.map(row => {
      if (row && String(row[0]).trim().toLowerCase() === art && String(row[1]).trim().toLowerCase() === param) {
        let currentSkl1 = parseInt(row[6]) || 0;
        let currentSkl2 = parseInt(row[7]) || 0;

        if (deleteTargetWh === "скл.2") {
          row[7] = currentSkl2 + qty;
        } else {
          row[6] = currentSkl1 + qty;
        }
        row[4] = (parseInt(row[6]) || 0) + (parseInt(row[7]) || 0);
        stockUpdated = true;
      }
      return row;
    });
    if (stockUpdated) { localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData)); }
  }

  // 2. УДАЛЯЕМ МГНОВЕННО СТРОКУ ИЗ ЛОКАЛЬНОГО ЖУРНАЛА ВЫДАЧИ НА ТЕЛЕФОНЕ
  window.qrLogs = window.qrLogs.filter((item, idx) => idx !== window.currentReturnLogIndex);
  localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

  if (typeof renderLogs === 'function') renderLogs();
  if (typeof renderStock === 'function') renderStock();
  if (document.getElementById('return-view')) { document.getElementById('return-view').classList.add('hidden'); }
  if (typeof closeModal === 'function') closeModal();
  if (typeof toggleReturnMode === 'function' && window.isReturnMode) toggleReturnMode();

  // 3. ОТПРАВКА СЕТЕВОГО ЗАПРОСА В ОБЛАКО GOOGLE ТАБЛИЦ
  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const textPayload = `DELETE_ROW|${targetId}|${qty}|${art}|${param}`;
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПОСЛЕ УДАЛЕНИЯ:\n\n" + serverText);
    } catch (e) { alert("Локально строка удалена, но в облаке произошла ошибка: " + e.message); }
  } else { alert("Вы работаете офлайн. Строка удалена только на вашем устройстве."); }
}
