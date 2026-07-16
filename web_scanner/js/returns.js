// js/returns.js — Модуль управления возвратами

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
    
    // Скрываем оригинальное название "PRO_26" и зажигаем красную плашку возврата
    if (titleText) titleText.classList.add('hidden');
    if (badge) {
      badge.innerText = "Активен режим возврата";
      badge.className = "status-badge badge-return-active";
    }
  } else {
    if (btn) btn.classList.remove('return-mode-active');
    
    // Убираем плашку возврата и возвращаем название проекта обратно на экран
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
  
  const id = rowData !== undefined ? rowData : '---';
  const col4 = rowData !== undefined ? rowData : '';
  const col5 = rowData !== undefined ? rowData : '';
  const col6 = rowData !== undefined ? rowData : '0';
  
  const infoBadge = document.getElementById('return-info-badge');
  if (infoBadge) {
    infoBadge.innerHTML = `
      <strong>ВЫДАЧА №:</strong> ${id}<br>
      <strong>ТОВАР:</strong> ${col4} ${col5}<br>
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

function processReturn(actionType) {
  if (window.currentReturnLogIndex === null) {
    alert("Ошибка: Строка лога не выбрана.");
    return;
  }
  const logItem = window.qrLogs[window.currentReturnLogIndex];
  if (!logItem || !logItem.data) return;

  const rowData = logItem.data;
  const targetId = rowData; 
  const itemKeys = rowData.slice(1, 5); 
  const qty = parseInt(rowData) || 0; 
  const worker = rowData || "Не указан";

  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const time = "'" + hh + ":" + mm;
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString().slice(-2);
  
  const author = "Неугодникова"; 

  if (actionType === 'full') {
    window.inventoryData = window.inventoryData.map(row => {
      if (row && 
          String(row).trim() == String(itemKeys).trim() && 
          String(row).trim() == String(itemKeys).trim() && 
          String(row).trim() == String(itemKeys).trim() && 
          String(row).trim() == String(itemKeys).trim()) {
        row = (parseInt(row) || 0) + qty; 
      }
      return row;
    });
    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    const nextId = window.qrLogs.length > 1 
      ? Math.max(...window.qrLogs.filter(r => r.status === 'ok' || (r.data && !isNaN(r.data))).map(r => parseInt(r.data) || 0)) + 1 
      : 1;

    const returnRowData = [nextId, ...itemKeys, -qty, worker, author, "Полный возврат", time, day, month, year];
    window.qrLogs.push({ data: returnRowData, status: 'wait' });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
    if (typeof renderLogs === 'function') renderLogs();
    
    document.getElementById('return-view').classList.add('hidden');
    if (typeof closeModal === 'function') closeModal();
    toggleReturnMode();
    if (typeof sendUnsynced === 'function') sendUnsynced();

  } else if (actionType === 'part') {
    if (qty <= 0) {
      alert("Ошибка: Нельзя вернуть часть от строки возврата!");
      return;
    }

    window.currentSelectedRowData = [...rowData.slice(1, 5), qty]; 
    window.isPartialReturnInput = true; 

    document.getElementById('return-view').classList.add('hidden');
    
    if (typeof openNumpadView === 'function') {
      openNumpadView();
      document.getElementById('qr-data-display').innerText = `ЧАСТИЧНЫЙ ВОЗВРАТ: ${itemKeys} ${itemKeys} (Доступно: ${qty} шт.)`;
      const addBtn = document.getElementById('addBtn');
      if (addBtn) {
        addBtn.innerText = "ВЕРНУТЬ ЧАСТЬ: 0";
        addBtn.style.background = "#eab308"; 
      }
    }

  } else if (actionType === 'delete') {
    if (typeof executePhysicalDeletion === 'function') {
      executePhysicalDeletion();
    } else {
      alert("Ошибка: Скрипт удаления delete_task.js не подключен.");
    }
  }
}
