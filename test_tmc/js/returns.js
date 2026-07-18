// js/returns.js — Модуль управления возвратами — ЧАСТЬ 1

window.isReturnMode = false;
window.currentReturnLogIndex = null;
window.isPartialReturnInput = false;

function toggleReturnMode() {
  window.isReturnMode = !window.isReturnMode;
  const btn = document.getElementById('return-mode-btn');
  const badge = document.getElementById('status-text-badge');
  const titleText = document.getElementById('project-title-text');
  
  if (window.isReturnMode) {
    if (btn) btn.classList.add('return-mode-active');
    if (typeof stopCamera === 'function') stopCamera();
    
    if (titleText) titleText.classList.add('hidden');
    if (badge) {
      badge.innerText = "Активен режим возврата";
      badge.className = "status-badge badge-return-active";
    }
  } else {
    if (btn) btn.classList.remove('return-mode-active');
    if (badge) badge.className = "status-badge hidden";
    if (titleText) titleText.classList.remove('hidden');
  }
}

function handleLogClick(originalIndex) {
  if (!window.isReturnMode) return;
  const logItem = window.qrLogs[originalIndex];
  if (!logItem || !logItem.data || logItem.action === 'delete') return; 
  
  window.currentReturnLogIndex = originalIndex;
  const rowData = logItem.data;
  
  const id = rowData[0] !== undefined ? rowData[0] : '---';
  const col4 = rowData[4] !== undefined ? rowData[4] : '';
  const col5 = rowData[1] !== undefined ? rowData[1] : ''; 
  const col6 = rowData[5] !== undefined ? rowData[5] : '0';
  
  const infoBadge = document.getElementById('return-info-badge');
  if (infoBadge) {
    infoBadge.innerHTML = `
      <strong>ВЫДАЧА №:</strong> ${id}<br>
      <strong>ТОВАР:</strong> ${col4} (Арт: ${col5})<br>
      <strong>КОЛ-ВО В СТРОКЕ:</strong> ${col6} шт.
    `;
  }
  
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  if (document.getElementById('where-view')) document.getElementById('where-view').classList.add('hidden');
  document.getElementById('return-view').classList.remove('hidden');
}
// js/returns.js — Модуль управления возвратами — ЧАСТЬ 2

function processReturn(actionType) {
  if (window.currentReturnLogIndex === null) {
    alert("Ошибка: Строка лога не выбрана.");
    return;
  }
  const logItem = window.qrLogs[window.currentReturnLogIndex];
  if (!logItem || !logItem.data) return;

  const rowData = logItem.data;
  const qty = parseInt(rowData[5]) || 0; 
  const worker = rowData[6] || "Не указан";
  const destinationText = String(rowData[8] || ""); // Текст из столбца "Куда выдано"

  // АВТООПРЕДЕЛЕНИЕ СКЛАДА ИЗ ТЕКСТА СТРОКИ
  let targetWh = "скл.1"; 
  if (destinationText.toUpperCase().includes("[СКЛ.2]")) {
    targetWh = "скл.2";
  }

  const logArt = String(rowData[1]).trim().toLowerCase();
  const logParam = String(rowData[2]).trim().toLowerCase();

  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const time = "'" + hh + ":" + mm;
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString().slice(-2);
  const author = "Неугодникова"; 

  if (actionType === 'full') {
    if (qty <= 0) { alert("Ошибка: Данная строка уже является возвратом!"); return; }

    let stockUpdated = false;
    window.inventoryData = window.inventoryData.map(row => {
      if (row && String(row[0]).trim().toLowerCase() === logArt && String(row[1]).trim().toLowerCase() === logParam) {
        if (targetWh === "скл.2") {
          row[7] = (parseInt(row[7]) || 0) + qty; // Прибавляем на Склад 2
        } else {
          row[6] = (parseInt(row[6]) || 0) + qty; // Прибавляем на Склад 1
        }
        // Автопересчет Общего запаса
        row[4] = (parseInt(row[6]) || 0) + (parseInt(row[7]) || 0);
        stockUpdated = true;
      }
      return row;
    });

    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    const nextId = window.qrLogs.length > 0 
      ? Math.max(...window.qrLogs.filter(r => r && r.data && !isNaN(r.data[0])).map(r => parseInt(r.data[0]) || 0)) + 1 
      : 1;

    const itemKeys = rowData.slice(1, 5); 
    // Наследуем исходную метку склада в новое имя объекта, чтобы история не ломалась
    const returnRowData = [nextId, ...itemKeys, -qty, worker, author, destinationText, time, day, month, year];
    
    window.qrLogs.push({ data: returnRowData, status: 'wait' });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
    
    if (typeof renderLogs === 'function') renderLogs();
    if (typeof renderStock === 'function') renderStock();
    
    document.getElementById('return-view').classList.add('hidden');
    if (typeof closeModal === 'function') closeModal();
    toggleReturnMode();
    if (typeof sendUnsynced === 'function') sendUnsynced();

  } else if (actionType === 'part') {
    if (qty <= 0) { alert("Ошибка: Нельзя вернуть часть от строки возврата!"); return; }

    // Передаем в нумпад метаданные и принудительно прокидываем распознанный склад 5-м параметром
    window.currentSelectedRowData = [rowData[1], rowData[2], rowData[3], rowData[4], qty, targetWh]; 
    window.isPartialReturnInput = true; 

    document.getElementById('return-view').classList.add('hidden');
    
    if (typeof openNumpadView === 'function') {
      openNumpadView();
      // Фиксируем склад в тумблере нумпада для Ветки А
      window.numpadSelectedWarehouse = targetWh;
      const whBtn = document.getElementById('numpad-warehouse-btn');
      if (whBtn) whBtn.innerText = targetWh.toUpperCase();

      document.getElementById('qr-data-display').innerText = `ЧАСТИЧНЫЙ ВОЗВРАТ на ${targetWh.toUpperCase()}: ${rowData[4]} (Доступно: ${qty} шт.)`;
      const addBtn = document.getElementById('addBtn');
      if (addBtn) { addBtn.innerText = "ВЕРНУТЬ ЧАСТЬ: 0"; addBtn.style.background = "#eab308"; }
    }
  } else if (actionType === 'delete') {
    if (typeof executePhysicalDeletion === 'function') executePhysicalDeletion();
  }
}
