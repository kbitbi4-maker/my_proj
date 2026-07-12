// js/returns.js — Модуль управления возвратами

window.isReturnMode = false;
window.currentReturnLogIndex = null;

// Флаг, указывающий, что нумпад сейчас открыт в режиме частичного возврата
window.isPartialReturnInput = false;

function toggleReturnMode() {
  window.isReturnMode = !window.isReturnMode;
  const btn = document.getElementById('return-mode-btn');
  if (window.isReturnMode) {
    if (btn) btn.classList.add('return-mode-active');
    if (typeof stopCamera === 'function') stopCamera();
  } else {
    if (btn) btn.classList.remove('return-mode-active');
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
  const author = "Неугодников";

  if (actionType === 'full') {
    // ---- ЛОГИКА 1: ПОЛНЫЙ ВОЗВРАТ (ВАШ РАБОЧИЙ КОД) ----
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

    const returnRowData = [nextId, ...itemKeys, -qty, worker, author, time, day, month, year];
    window.qrLogs.push({ data: returnRowData, status: 'wait' });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));
    if (typeof renderLogs === 'function') renderLogs();
    
    document.getElementById('return-view').classList.add('hidden');
    if (typeof closeModal === 'function') closeModal();
    toggleReturnMode();
    if (typeof sendUnsynced === 'function') sendUnsynced();

  } else if (actionType === 'part') {
    // ---- ЛОГИКА 2: ВЕРНУТЬ ЧАСТЬ (ПОДГОТОВКА И ВВОД ЧЕРЕЗ НУМПАД) ----
    if (qty <= 0) {
      alert("Ошибка: Нельзя вернуть часть от строки возврата!");
      return;
    }

    // Передаем данные строки в буфер выбора товара, чтобы Нумпад понял, с чем работать
    window.currentSelectedRowData = [...rowData.slice(1, 5), qty]; 
    window.isPartialReturnInput = true; // Включаем режим перехвата кнопки сохранения

    // Закрываем меню возврата и открываем Нумпад
    document.getElementById('return-view').classList.add('hidden');
    
    if (typeof openNumpadView === 'function') {
      openNumpadView();
      
      // Сразу после открытия корректируем внешний вид Нумпада под возврат
      document.getElementById('qr-data-display').innerText = `ЧАСТИЧНЫЙ ВОЗВРАТ: ${itemKeys} ${itemKeys} (Доступно: ${qty} шт.)`;
      const addBtn = document.getElementById('addBtn');
      if (addBtn) {
        addBtn.innerText = "ВЕРНУТЬ ЧАСТЬ: 0";
        addBtn.style.background = "#eab308"; // Делаем кнопку оранжевой
      }
    }

  } else if (actionType === 'delete') {
    // Вызов изолированного внешнего скрипта удаления (js/delete_task.js)
    if (typeof executePhysicalDeletion === 'function') {
      executePhysicalDeletion();
    } else {
      alert("Ошибка: Скрипт удаления delete_task.js не подключен.");
    }
  }
}
