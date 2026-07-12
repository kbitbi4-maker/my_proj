// js/edit_stock.js — Модуль прямого редактирования остатков в таблице

window.isStockEditMode = false;

function toggleStockEditMode(activate) {
  window.isStockEditMode = activate;
  
  const badge = document.getElementById('stock-edit-badge');
  const triggerBtn = document.getElementById('stock-edit-trigger-btn');
  const actionsRow = document.getElementById('stock-edit-actions');
  
  if (window.isStockEditMode) {
    if (badge) badge.classList.remove('hidden');
    if (triggerBtn) triggerBtn.classList.add('hidden');
    if (actionsRow) actionsRow.classList.remove('hidden');
  } else {
    if (badge) badge.classList.add('hidden');
    if (triggerBtn) triggerBtn.classList.remove('hidden');
    if (actionsRow) actionsRow.classList.add('hidden');
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
    const inputEl = document.getElementById(`stock-input-${i}`);
    if (inputEl) {
      // Безопасно очищаем от любых пробелов перед парсингом числа
      const cleanInputVal = String(inputEl.value).replace(/\s+/g, '');
      const newValue = parseInt(cleanInputVal);
      
      if (isNaN(newValue) || newValue < 0) {
        alert(`Ошибка: В строке №${i} указано некорректное число остатка.`);
        return;
      }
      
      currentData[i][4] = newValue;
      
      const art = String(currentData[i][0]).trim();
      const param = String(currentData[i][1]).trim();
      updatePayloadParts.push(`${art}*${param}*${newValue}`);
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
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
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
