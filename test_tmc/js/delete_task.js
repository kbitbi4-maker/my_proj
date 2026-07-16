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
  const targetId = rowData[0];             // Уникальный ID строки из 1-го столбца (индекс 0)
  const art = String(rowData[1]).trim().toLowerCase();    // Артикул из лога (2-й столбец, индекс 1)
  const param = String(rowData[2]).trim().toLowerCase();  // Параметр из лога (3-й столбец, индекс 2)
  const qty = parseInt(rowData[5]) || 0;    // Количество товара из лога (6-й столбец, индекс 5)

  if (!confirm(`Вы уверены, что хотите полностью стереть строку №${targetId} из Google Таблицы?`)) {
    return;
  }

  // 1. КОРРЕКТИРУЕМ ЛОКАЛЬНЫЙ СКЛАД (ЛИСТ 1 НА ТЕЛЕФОНЕ) — ТОЛЬКО ЕСЛИ КОЛИЧЕСТВО БЫЛО ПОЛОЖИТЕЛЬНЫМ (ВЫДАЧА)
  if (qty > 0) {
    let stockUpdated = false;
    window.inventoryData = window.inventoryData.map(row => {
      // КРИТИЧЕСКИЙ ФИКС: Сопоставляем ключи Листа 1 (Артикул - индекс 0, Параметр - индекс 1)
      if (row && String(row[0]).trim().toLowerCase() === art && String(row[1]).trim().toLowerCase() === param) {
        let currentSkl1 = parseInt(row[6]) || 0;
        let currentSkl2 = parseInt(row[7]) || 0;

        // Начисляем товар обратно на Склад 1 (индекс 6)
        row[6] = currentSkl1 + qty;
        // Пересчитываем Общий запас (индекс 4 = скл.1 + скл.2)
        row[4] = (currentSkl1 + qty) + currentSkl2;
        stockUpdated = true;
      }
      return row;
    });

    if (stockUpdated) {
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
    } else {
      console.warn("Внимание: Товар из удаляемой строки лога не найден в базе остатков склада на телефоне.");
    }
  } else {
    console.log("Удаление строки возврата (qty < 0): локальный остаток на складе не изменяется.");
  }

  // 2. УДАЛЯЕМ МГНОВЕННО СТРОКУ ИЗ ЛОКАЛЬНОГО ЖУРНАЛА ВЫДАЧИ НА ТЕЛЕФОНЕ
  window.qrLogs = window.qrLogs.filter((item, idx) => idx !== window.currentReturnLogIndex);
  localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

  // 3. ПЕРЕРИСОВЫВАЕМ ИНТЕРФЕЙС ГЛАВНОГО ЭКРАНА И ТАБЛИЦУ ОСТАТКОВ
  if (typeof renderLogs === 'function') renderLogs();
  if (typeof renderStock === 'function') renderStock();

  // 4. ЗАКРЫВАЕМ ОКНА НАВИГАЦИИ
  if (document.getElementById('return-view')) {
    document.getElementById('return-view').classList.add('hidden');
  }
  if (typeof closeModal === 'function') closeModal();
  if (typeof toggleReturnMode === 'function' && window.isReturnMode) toggleReturnMode();

  // 5. ПРЯМОЙ ИЗОЛИРОВАННЫЙ ТЕКСТОВЫЙ ПОСТ-ЗАПРОС НА УДАЛЕНИЕ В ОБЛАКО GOOGLE
  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const textPayload = `DELETE_ROW|${targetId}|${qty}|${art}|${param}`;

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: textPayload
      });
      
      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПОСЛЕ УДАЛЕНИЯ:\n\n" + serverText);

    } catch (e) {
      console.error("Сетевая ошибка при стирании строки:", e);
      alert("Локально строка удалена, но в облако произошла сетевая ошибка: " + e.message);
    }
  } else {
    alert("Вы работаете офлайн. Строка удалена только на вашем устройстве.");
  }
}
