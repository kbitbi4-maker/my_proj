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
  let localChangedCounter = 0;

  // АНАЛОГИЧНО СТАРЫМ МЕТОДАМ: Сканируем всю таблицу построчно
  for (let i = 1; i < currentData.length; i++) {
    const inputTotal = document.getElementById(`stock-input-${i}-4`);
    const inputSkl1 = document.getElementById(`stock-input-${i}-6`);
    const inputSkl2 = document.getElementById(`stock-input-${i}-7`);
    
    if (inputTotal && inputSkl1 && inputSkl2) {
      const valTotal = parseInt(String(inputTotal.value).replace(/\s+/g, ''));
      const val1 = parseInt(String(inputSkl1.value).replace(/\s+/g, ''));
      const val2 = parseInt(String(inputSkl2.value).replace(/\s+/g, ''));
      
      if (isNaN(valTotal) || valTotal < 0 || isNaN(val1) || val1 < 0 || isNaN(val2) || val2 < 0) {
        alert(`Ошибка: В строке №${i} указаны некорректные числа остатков.`);
        return;
      }
      
      // Сравниваем строго по ячейкам строки (Общий=индекс 4, скл1=индекс 6, скл2=индекс 7)
      if (valTotal !== (parseInt(currentData[i][4]) || 0) || 
          val1 !== (parseInt(currentData[i][6]) || 0) || 
          val2 !== (parseInt(currentData[i][7]) || 0)) {
            
        // Обновляем локальный кэш
        currentData[i][4] = valTotal;
        currentData[i][6] = val1;
        currentData[i][7] = val2;
        
        // Исправлено извлечение Артикула и Параметра как в старом коде
        const art = String(currentData[i][0]).trim();
        const param = String(currentData[i][1]).trim();
        
        updatePayloadParts.push(`${art}*${param}*${valTotal}*${val1}*${val2}`);
        localChangedCounter++;
      }
    }
  }

  if (updatePayloadParts.length === 0) {
    alert("Информация:\nВы не изменили ни одной ячейки остатков.");
    toggleStockEditMode(false);
    return;
  }

  // Записываем обновленный массив в локальную память телефона
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
    alert(`Изменения остатков (${localChangedCounter} поз.) применены локально офлайн.`);
  }
}
