// js/delete_task.js — Выделенный независимый скрипт удаления строк

/**
 * Изолированная функция физического удаления строки лога из облака и перерасчета остатков
 */
async function executePhysicalDeletion() {
  if (window.currentReturnLogIndex === null) {
    alert("Ошибка: Строка журнала не выбрана.");
    return;
  }

  const logItem = window.qrLogs[window.currentReturnLogIndex];
  if (!logItem || !logItem.data) {
    alert("Ошибка: Данные строки не найдены.");
    return;
  }

  const rowData = logItem.data;
  const targetId = rowData[0];           // Уникальный ID строки из 1-го столбца
  const art = String(rowData[1]).trim();  // Артикул (2-й столбец)
  const param = String(rowData[2]).trim(); // Параметр (3-й столбец)
  const qty = parseInt(rowData[5]) || 0;  // Количество товара (6-й столбец)

  if (!confirm(`Вы уверены, что хотите полностью стереть строку №${targetId} из Google Таблицы?`)) {
    return;
  }

  // 1. КОРРЕКТИРУЕМ ЛОКАЛЬНЫЙ СКЛАД (ЛИСТ 1 НА ТЕЛЕФОНЕ) — ТОЛЬКО ЕСЛИ КОЛИЧЕСТВО БЫЛО ПОЛОЖИТЕЛЬНЫМ (ВЫДАЧА)
  if (qty > 0) {
    window.inventoryData = window.inventoryData.map(row => {
      if (row && String(row[0]).trim() === art && String(row[1]).trim() === param) {
        row[4] = (parseInt(row[4]) || 0) + qty; // Возвращаем товар на склад
      }
      return row;
    });
    localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
  } else {
    console.log("Удаление строки возврата (qty < 0): локальный остаток на складе не изменяется.");
  }

  // 2. УДАЛЯЕМ МГНОВЕННО СТРОКУ ИЗ ЛОКАЛЬНОГО ЖУРНАЛА ВЫДАЧИ НА ТЕЛЕФОНЕ
  window.qrLogs = window.qrLogs.filter((item, idx) => idx !== window.currentReturnLogIndex);
  localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

  // 3. ПЕРЕРИСОВЫВАЕМ ИНТЕРФЕЙС ГЛАВНОГО ЭКРАНА
  if (typeof renderLogs === 'function') renderLogs();

  // 4. ЗАКРЫВАЕМ ОКНА НАВИГАЦИИ
  document.getElementById('return-view').classList.add('hidden');
  if (typeof closeModal === 'function') closeModal();
  if (typeof toggleReturnMode === 'function' && window.isReturnMode) toggleReturnMode();

  // 5. ПРЯМОЙ ИЗОЛИРОВАННЫЙ ТЕКСТОВЫЙ ПОСТ-ЗАПРОС НА УДАЛЕНИЕ В ОБЛАКО GOOGLE
  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      // Собираем данные в одну текстовую строку через разделитель "|"
      const textPayload = `DELETE_ROW|${targetId}|${qty}|${art}|${param}`;

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: textPayload
      });
      
      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE:\n\n" + serverText);

    } catch (e) {
      console.error("Сетевая ошибка при стирании строки:", e);
      alert("Локально строка удалена, но в облаке произошла сетевая ошибка: " + e.message);
    }
  } else {
    alert("Вы работаете офлайн. Строка удалена только на вашем устройстве.");
  }
}
