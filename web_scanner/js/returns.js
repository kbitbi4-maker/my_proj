// js/returns.js — Модуль управления возвратами

window.isReturnMode = false;
window.currentReturnLogIndex = null;

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
  const targetId = rowData; // ID строки (1-й столбец)
  const itemKeys = rowData.slice(1, 5); // 4 ключа товара (столбцы 2, 3, 4, 5)
  const qty = parseInt(rowData) || 0; // Количество (6-й столбец)
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

  } else if (actionType === 'delete') {
    if (!confirm(`Вы уверены, что хотите полностью удалить строку №${targetId}? Товар вернется на склад локально, команда уйдет в облако.`)) return;

    // ШАГ 1: Корректируем локальный склад (Лист 1)
    window.inventoryData = window.inventoryData.map(row => {
      if (row && 
          String(row).trim() == String(itemKeys).trim() && 
          String(row).trim() == String(itemKeys).trim() && 
          String(row).trim() == String(itemKeys).trim() && 
          String(row).trim() == String(itemKeys).trim()) {
        row = (parseInt(row) || 0) + qty; // Локальный перерасчет
      }
      return row;
    });
    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    // ШАГ 2: Удаляем старую строку из локального массива видимых логов смартфона
    window.qrLogs = window.qrLogs.filter((item, idx) => idx !== window.currentReturnLogIndex);

    // ШАГ 3: Добавляем маркер удаления для текстовой отправки sendUnsynced()
    window.qrLogs.push({
      action: "delete",
      id: targetId,
      itemKeys: itemKeys,
      qty: qty,
      status: "wait"
    });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

    if (typeof renderLogs === 'function') renderLogs();
    
    document.getElementById('return-view').classList.add('hidden');
    if (typeof closeModal === 'function') closeModal();
    toggleReturnMode();

    if (typeof sendUnsynced === 'function') sendUnsynced();
  } else if (actionType === 'part') {
    alert("Режим 'Вернуть часть' настроим позже.");
  }
}
