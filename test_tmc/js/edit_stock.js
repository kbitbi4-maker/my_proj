// js/edit_stock.js — Модуль точечной сериализации и отправки Dirty-кэша изменений в облако

function cancelStockChanges() {
  if (!confirm("Очистить локальный кэш измененных ячеек и сбросить выделение?")) return;
  window.stockChangesQueue = {};
  window.stockSelectedRange = { startRow: null, startCol: null, endRow: null, endCol: null };
  window.stockActiveCell = { row: null, col: null };
  renderStock();
}

async function saveStockChangesCloud() {
  const changesCount = Object.keys(window.stockChangesQueue).length;
  if (changesCount === 0) {
    alert("Нет измененных ячеек для отправки.");
    return;
  }

  // Преобразуем объект очереди в плоский массив транзакций
  const transactionsList = Object.values(window.stockChangesQueue);

  // Синхронизируем локальные изменения с массивом в оперативной памяти смартфона
  transactionsList.forEach(tx => {
    window.inventoryData[tx.row][tx.col] = tx.value;
  });

  // Записываем обновленные остатки склада в локальное хранилище телефона
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

  // Проверяем сеть и отправляем Delta-пакет в Google Apps Script
  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      // Формируем сжатый, точечный JSON для минимизации трафика
      const payloadData = {
        type: "DELTA_UPDATE",
        cells: transactionsList
      };

      const textPayload = "STOCK_UPDATE|" + JSON.stringify(payloadData);
      
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      
      const resultText = await response.text();

      // Подсвечиваем сохраненные ячейки зеленым флэш-эффектом
      transactionsList.forEach(tx => {
        const cellEl = document.getElementById(`ex-cell-${tx.row}-${tx.col}`);
        if (cellEl) {
          cellEl.classList.remove('cell-stock-dirty');
          cellEl.classList.add('cell-stock-saved-flash');
        }
      });

      // Очищаем кэш изменений после успешного ответа сервера
      window.stockChangesQueue = {};
      
      setTimeout(() => {
        renderStock();
        alert("Данные успешно сохранены в облаке!\n" + resultText);
      }, 800);

    } catch (e) {
      console.error("Сетевая ошибка при точечной отправке изменений:", e);
      alert("Ошибка сети. Изменения зафиксированы локально на устройстве, но не дошли до Google Таблицы.");
    }
  } else {
    alert("Устройство оффлайн. Изменения сохранены в локальный кэш смартфона.");
    renderStock();
  }
}
