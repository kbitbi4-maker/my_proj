// js/edit_stock.js — Модуль прямого редактирования остатков в таблице

window.isStockEditMode = false;
// Массив для хранения индексов строк, которые были отредактированы пользователем
window.editedStockRows = [];

function toggleStockEditMode(activate) {
  window.isStockEditMode = activate;
  
  const badge = document.getElementById('stock-edit-badge');
  const triggerBtn = document.getElementById('stock-edit-trigger-btn');
  const actionsRow = document.getElementById('stock-edit-actions');
  
  if (window.isStockEditMode) {
    window.editedStockRows = []; // Очищаем массив измененных строк при старте режима
    if (badge) badge.classList.remove('hidden');
    if (triggerBtn) triggerBtn.classList.add('hidden');
    if (actionsRow) actionsRow.classList.remove('hidden');
  } else {
    if (badge) badge.classList.add('hidden');
    if (triggerBtn) triggerBtn.classList.remove('hidden');
    if (actionsRow) actionsRow.classList.remove('hidden');
  }
  
  if (typeof renderStock === 'function') {
    renderStock();
  }
}

/**
 * ГЛОБАЛЬНЫЙ ТРИГГЕР: явно привязываем функцию к window, чтобы HTML её видел
 */
window.markStockRowAsEdited = function(rowIndex) {
  const idx = parseInt(rowIndex);
  if (!isNaN(idx) && !window.editedStockRows.includes(idx)) {
    window.editedStockRows.push(idx);
  }
};

function cancelStockChanges() {
  if (!confirm("Отменить все внесенные изменения остатков?")) return;
  window.editedStockRows = [];
  toggleStockEditMode(false);
}

async function saveStockChangesCloud() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length <= 1) return;

  // ПОДСТРАХОВКА: Если массив пуст, делаем быструю сверку по всем строкам с кэшем,
  // чтобы обнаружить изменения, даже если событие oninput не сработало
  if (window.editedStockRows.length === 0) {
    for (let i = 1; i < currentData.length; i++) {
      const inputTotal = document.getElementById(`stock-input-${i}-4`);
      const inputSkl1 = document.getElementById(`stock-input-${i}-6`);
      const inputSkl2 = document.getElementById(`stock-input-${i}-7`);
      
      if (inputTotal && inputSkl1 && inputSkl2) {
        const tVal = parseInt(inputTotal.value) || 0;
        const s1Val = parseInt(inputSkl1.value) || 0;
        const s2Val = parseInt(inputSkl2.value) || 0;
        
        if (tVal !== parseInt(currentData[i]) || 
            s1Val !== parseInt(currentData[i]) || 
            s2Val !== parseInt(currentData[i])) {
          if (!window.editedStockRows.includes(i)) {
            window.editedStockRows.push(i);
          }
        }
      }
    }
  }

  // Если изменений действительно нет — просто выходим
  if (window.editedStockRows.length === 0) {
    alert("Информация:\nВы не изменили ни одной ячейки остатков.");
    toggleStockEditMode(false);
    return;
  }

  let updatePayloadParts = [];

  // Перебираем СТРОГО только те индексы строк, которые были изменены вручную
  for (let k = 0; k < window.editedStockRows.length; k++) {
    const i = window.editedStockRows[k];
    
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
      
      // Обновляем ячейки в локальном массиве памяти устройства
      currentData[i] = valTotal;
      currentData[i] = val1;
      currentData[i] = val2;
      
      const art = String(currentData[i]).trim();
      const param = String(currentData[i]).trim();
      
      // Собираем расширенный пакет данных: Артикул*Параметр*ОбщийЗапас*скл1*скл2
      updatePayloadParts.push(`${art}*${param}*${valTotal}*${val1}*${val2}`);
    }
  }

  window.inventoryData = currentData;
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
  
  window.editedStockRows = [];
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
