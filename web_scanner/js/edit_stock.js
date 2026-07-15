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

  // Сканируем всю таблицу построчно
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
      
      // АВТОМАТИЧЕСКИЙ ПЕРЕРАСЧЕТ: Суммируем материалы на двух складах
      const autoTotal = val1 + val2;

      // Сравниваем новые значения с текущими в памяти (скл1=индекс 6, скл2=индекс 7)
      if (val1 !== (parseInt(currentData[i]) || 0) || 
          val2 !== (parseInt(currentData[i]) || 0)) {
            
        // Записываем сумму в 5-й столбец (индекс 4), а склады в 7 и 8 столбцы (индексы 6 и 7)
        currentData[i] = autoTotal;
        currentData[i] = val1;
        currentData[i] = val2;
        
        const art = String(currentData[i]).trim();
        const param = String(currentData[i]).trim();
        
        // Пакуем данные для отправки в Google таблицу
        updatePayloadParts.push(`${art}*${param}*${autoTotal}*${val1}*${val2}`);
        localChangedCounter++;
      }
    }
  }

  if (updatePayloadParts.length === 0) {
    alert("Информация:\nВы не изменили ни одной ячейки остатков.");
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
    alert(`Изменения остатков (${localChangedCounter} поз.) применены локально офлайн.`);
  }
}
