// js/edit_stock.js — Модуль изменения остатков и полок на складе целиком

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
  let trackingCells = []; 

  for (let i = 1; i < currentData.length; i++) {
    const inputTotal = document.getElementById(`stock-input-${i}-4`);
    const inputSkl1 = document.getElementById(`stock-input-${i}-6`);
    const inputSkl2 = document.getElementById(`stock-input-${i}-8`); 
    const inputShelf = document.getElementById(`stock-input-${i}-10`); 
    
    if (inputTotal && inputSkl1 && inputSkl2 && inputShelf) {
      const valTotal = parseInt(String(inputTotal.value).replace(/\s+/g, ''));
      const val1 = parseInt(String(inputSkl1.value).replace(/\s+/g, ''));
      const val2 = parseInt(String(inputSkl2.value).replace(/\s+/g, ''));
      const valShelf = inputShelf.value.trim();
      
      if (isNaN(valTotal) || valTotal < 0 || isNaN(val1) || val1 < 0 || isNaN(val2) || val2 < 0) {
        alert(`Ошибка: В строке №${i} указаны некорректные числа остатков.`);
        return;
      }
      
      if (valTotal !== (parseInt(currentData[i][4]) || 0) || 
          val1 !== (parseInt(currentData[i][6]) || 0) || 
          val2 !== (parseInt(currentData[i][8]) || 0) ||
          valShelf !== String(currentData[i][10] || "").trim()) {
            
        currentData[i][4] = valTotal;
        currentData[i][6] = val1;
        currentData[i][8] = val2;
        currentData[i][10] = valShelf; 
        
        const art = String(currentData[i][0]).trim();
        const param = String(currentData[i][1]).trim();
        
        updatePayloadParts.push(`${art}*${param}*${valTotal}*${val1}*val2}*${valShelf}`);
        trackingCells.push(inputTotal, inputSkl1, inputSkl2, inputShelf);
      }
    }
  }

  if (updatePayloadParts.length === 0) {
    toggleStockEditMode(false);
    return;
  }

  window.inventoryData = currentData;
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const textPayload = "STOCK_UPDATE|" + updatePayloadParts.join("|");
      
      await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });

      trackingCells.forEach(input => {
        if (input) {
          input.classList.remove('cell-stock-dirty');
          input.classList.add('cell-stock-saved-flash');
        }
      });

      setTimeout(() => {
        toggleStockEditMode(false);
      }, 1000);

    } catch (e) {
      console.error("Сетевая ошибка при обновлении остатков в облаке:", e);
      alert("Ошибка сети. Данные сохранены на телефоне, но не дошли до Google Таблицы.");
    }
  } else {
    toggleStockEditMode(false);
  }
}
