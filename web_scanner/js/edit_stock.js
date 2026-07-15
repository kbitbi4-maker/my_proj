// js/edit_stock.js — Модуль прямого редактирования остатков в таблице

window.isStockEditMode = false;

function toggleStockEditMode(activate) {
  window.isStockEditMode = activate;
  
  const badge = document.getElementById('stock-edit-badge');
  const triggerBtn = document.getElementById('stock-edit-trigger-btn');
  const actionsRow = document.getElementById('stock-edit-actions');
  
  if (window.isStockEditMode) {
    if (badge) badge.className = "stock-mode-badge";
    if (triggerBtn) triggerBtn.className = "btn-edit-trigger hidden";
    if (actionsRow) actionsRow.className = "stock-edit-actions-row";
  } else {
    if (badge) badge.className = "stock-mode-badge hidden";
    if (triggerBtn) triggerBtn.className = "btn-edit-trigger";
    if (actionsRow) actionsRow.className = "stock-edit-actions-row hidden";
  }
  
  if (typeof renderStock === 'function') {
    renderStock();
  }
}

function cancelStockChanges() {
  if (!confirm("Отменить все внесенные изменения остатков?")) return;
  toggleStockEditMode(false);
}

async function saveStockChangesCloud() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length <= 1) return;

  let updatePayloadParts = [];

  for (let i = 1; i < currentData.length; i++) {
    const inputSkl1 = document.getElementById(`stock-input-${i}-6`);
    const inputSkl2 = document.getElementById(`stock-input-${i}-7`);
    
    if (inputSkl1 && inputSkl2) {
      const val1 = parseInt(String(inputSkl1.value).replace(/\s+/g, ''));
      const val2 = parseInt(String(inputSkl2.value).replace(/\s+/g, ''));
      
      if (isNaN(val1) || val1 < 0 || isNaN(val2) || val2 < 0) {
        alert(`Ошибка: В строке №${i} указаны некорректные числа остатков.`);
        return;
      }
      
      // Обновляем ячейки хранения в массиве памяти телефона
      currentData[i][6] = val1;
      currentData[i][7] = val2;
      
      // Перерасчет общего количества запаса (столбец 5, индекс 4)
      currentData[i][4] = val1 + val2;
      
      const art = String(currentData[i][0]).trim();
      const param = String(currentData[i][1]).trim();
      
      // Собираем пакет данных: Артикул*Параметр*скл1*скл2
      updatePayloadParts.push(`${art}*${param}*${val1}*${val2}`);
    }
  }

  if (updatePayloadParts.length === 0) {
    toggleStockEditMode(false);
    return;
  }

  window.inventoryData = currentData;
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
  toggleStockEditMode(false);

  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const textPayload = "STOCK_UPDATE|" + updatePayloadParts.join("|");

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });

      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО СКЛАДУ:\n\n" + serverText);

    } catch (e) {
      console.error("Сетевая ошибка при обновлении остатков:", e);
      alert("Остатки изменены локально на устройстве, но в облаке произошла сетевая ошибка: " + e.message);
    }
  } else {
    alert("Вы работаете офлайн. Изменения остатков применены только локально на этом устройстве.");
  }
}
