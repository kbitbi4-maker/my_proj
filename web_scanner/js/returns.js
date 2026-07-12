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
 * @param {number} originalIndex - Индекс строки в глобальном массиве window.qrLogs
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
 * @param {string} actionType - Тип нажатой кнопки ('full', 'part', 'delete')
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
    
    // 1. Изменяем локальную базу остатков (Приведение типов к String!)
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

    // 2. Рассчитываем новый ID
    const nextId = window.qrLogs.length > 1 
      ? Math.max(...window.qrLogs.filter(r => r.status === 'ok' || (r.data && !isNaN(r.data[0]))).map(r => parseInt(r.data[0]) || 0)) + 1 
      : 1;

    // 3. Формируем запись лога с отрицательным количеством
    const returnRowData = [nextId, ...itemKeys, -qty, worker, author, time, day, month, year];

    // 4. Пишем в локальный журнал выданных товаров
    window.qrLogs.push({ data: returnRowData, status: 'wait' });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

    if (typeof renderLogs === 'function') renderLogs();
    
    document.getElementById('return-view').classList.add('hidden');
    if (typeof closeModal === 'function') closeModal();
    toggleReturnMode();

    if (typeof sendUnsynced === 'function') sendUnsynced();

  } else if (actionType === 'delete') {
    // ---- ЛОГИКА 2: УДАЛИТЬ СТРОКУ ЧЕРЕЗ ФОНОВЫЙ БУФЕР ----
    if (!confirm(`Вы уверены, что хотите удалить строку №${targetId}? Товар вернется на склад локально.`)) return;

    // ШАГ 1: Корректируем локальный склад (Лист 1) с безопасным сравнением типов строк
    window.inventoryData = window.inventoryData.map(row => {
      if (row && 
          String(row[0]).trim() == String(itemKeys[0]).trim() && 
          String(row[1]).trim() == String(itemKeys[1]).trim() && 
          String(row[2]).trim() == String(itemKeys[2]).trim() && 
          String(row[3]).trim() == String(itemKeys[3]).trim()) {
        row[4] = (parseInt(row[4]) || 0) + qty; // Увеличиваем локальный остаток товара
      }
      return row;
    });
    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

    // ШАГ 2: Физически удаляем старую строку из локального массива логов
    window.qrLogs = window.qrLogs.filter((item, idx) => idx !== window.currentReturnLogIndex);

    // ШАГ 3: Добавляем в массив маркер удаления для фоновой отправки
    window.qrLogs.push({
      action: "delete",
      id: targetId,
      itemKeys: itemKeys,
      qty: qty,
      status: "wait"
    });
    localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

    // Мгновенно перерисовываем экран — строка исчезает, остаток обновлен
    if (typeof renderLogs === 'function') renderLogs();

    // Закрываем модальные окна
    document.getElementById('return-view').classList.add('hidden');
    if (typeof closeModal === 'function') closeModal();
    toggleReturnMode();

    // ШАГ 4: Запускаем автоматическую фоновую выгрузку изменений в Google
    if (typeof sendUnsynced === 'function') sendUnsynced();

  } else if (actionType === 'part') {
    alert("Режим 'Вернуть часть' настроим позже.");
  }
}
