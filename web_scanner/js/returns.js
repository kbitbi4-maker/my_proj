// js/returns.js — Модуль управления возвратами

// Глобальная переменная состояния режима возврата
window.isReturnMode = false;

// Глобальная переменная для хранения индекса строки лога, с которой мы сейчас работаем
window.currentReturnLogIndex = null;

/**
 * 1. Включение / выключение режима возврата по кнопке в шапке
 */
function toggleReturnMode() {
  window.isReturnMode = !window.isReturnMode;
  const btn = document.getElementById('return-mode-btn');
  
  if (window.isReturnMode) {
    if (btn) btn.classList.add('return-mode-active');
    if (typeof stopCamera === 'function') {
      stopCamera();
    }
  } else {
    if (btn) btn.classList.remove('return-mode-active');
  }
}

/**
 * 2. Обработка клика по строке в журнале выдачи на главном экране
 */
function handleLogClick(originalIndex) {
  if (!window.isReturnMode) return;
  
  const logItem = window.qrLogs[originalIndex];
  if (!logItem || !logItem.data || logItem.action === 'delete') return; 
  
  window.currentReturnLogIndex = originalIndex;
  const rowData = logItem.data;
  
  const id = rowData[0] !== undefined ? rowData[0] : '---';
  const col4 = rowData[3] !== undefined ? rowData[3] : '';
  const col5 = rowData[4] !== undefined ? rowData[4] : '';
  const col6 = rowData[5] !== undefined ? rowData[5] : '0';
  
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

/**
 * 3. Обработка действий управления строкой выдачи
 */
function processReturn(actionType) {
  if (window.currentReturnLogIndex === null) {
    alert("Ошибка: Строка лога не выбрана.");
    return;
  }

  const logItem = window.qrLogs[window.currentReturnLogIndex];
  if (!logItem || !logItem.data) return;

  const rowData = logItem.data;
  const targetId = rowData[0]; // ID строки (1-й столбец)
  const itemKeys = rowData.slice(1, 5); // 4 ключа товара (столбцы 2, 3, 4, 5)
  const qty = parseInt(rowData[5]) || 0; // Количество (6-й столбец)
  const worker = rowData[6] || "Не указан";

  // Время и дата для новой записи возврата
  const now = new Date();
  const hh = now.getHours().toString().padStart(2, '0');
  const mm = now.getMinutes().toString().padStart(2, '0');
  const time = "'" + hh + ":" + mm;
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString().slice(-2);
  const author = "Неугодников";

  if (actionType === 'full') {
    // ---- ЛОГИКА 1: ПОЛНЫЙ ВОЗВРАТ ----
    window.inventoryData = window.inventoryData.map(row => {
      if (row && 
          String(row[0]).trim() == String(itemKeys[0]).trim() && 
          String(row[1]).trim() == String(itemKeys[1]).trim() && 
          String(row[2]).trim() == String(itemKeys[2]).trim() && 
          String(row[3]).trim() == String(itemKeys[3]).trim()) {
        row[4] = (parseInt(row[4]) || 0) + qty; 
      }
      return row;
    });
    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    const nextId = window.qrLogs.length > 1 
      ? Math.max(...window.qrLogs.filter(r => r.status === 'ok' || (r.data && !isNaN(r.data[0]))).map(r => parseInt(r.data[0]) || 0)) + 1 
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
    // ---- ЛОГИКА 2: УДАЛИТЬ СТРОКУ ЧЕРЕЗ ФОНОВЫЙ БУФЕР ----
    
    // ВРЕМЕННЫЙ ТЕСТ: Выводим ключи, которые мы пытаемся найти в базе остатков
    alert("ДИАГНОСТИКА.\nИщем товар по ключам:\n" + JSON.stringify(itemKeys) + "\nКоличество для возврата: " + qty);

    let isProductFound = false;

    // ШАГ 1: Корректируем локальный склад (Лист 1)
    window.inventoryData = window.inventoryData.map(row => {
      if (row && 
          String(row[0]).trim() == String(itemKeys[0]).trim() && 
          String(row[1]).trim() == String(itemKeys[1]).trim() && 
          String(row[2]).trim() == String(itemKeys[2]).trim() && 
          String(row[3]).trim() == String(itemKeys[3]).trim()) {
        
        const oldStock = parseInt(row[4]) || 0;
        row[4] = oldStock + qty; // Увеличиваем локальный остаток
        isProductFound = true;
        
        alert("УСПЕХ! Товар найден в базе остатков.\nСтарый остаток: " + oldStock + "\nНовый остаток: " + row[4]);
      }
      return row;
    });

    if (!isProductFound) {
      // Если это сработает, значит индексы в rowData[1..5] или в структуре остатков не совпадают!
      alert("ВНИМАНИЕ: Товар НЕ был найден в базе локальных остатков. Проверьте первую строку таблицы остатков в консоли.");
    }

    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    // ШАГ 2: Удаляем старую строку из локального массива видимых логов
    window.qrLogs = window.qrLogs.filter((item, idx) => idx !== window.currentReturnLogIndex);

    // ШАГ 3: Добавляем маркер удаления
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

    // ШАГ 4: Выгрузка в Google
    if (typeof sendUnsynced === 'function') sendUnsynced();

  } else if (actionType === 'part') {
    alert("Режим 'Вернуть часть' настроим позже.");
  }
}
