function showBalancePasteArea() {
  document.getElementById('balance-menu-buttons').classList.add('hidden');
  
  // Инициализируем и отрисовываем Excel-грид из кэша памяти
  initExcelMatrixData();
  renderExcelGrid();
  
  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "ВНЕСТИ ИЗМЕНЕНИЯ";
    importBtn.disabled = false;
  }
  document.getElementById('balance-paste-container').classList.remove('hidden');
}

function hideBalancePasteArea() {
  document.getElementById('balance-paste-container').classList.add('hidden');
  document.getElementById('balance-menu-buttons').classList.remove('hidden');
}

/**
 * МОДЕРНИЗИРОВАННЫЙ ИМПОРТ ИЗ ИНТЕРАКТИВНОГО EXCEL-ГРИДА
 */
async function processTextTableImport() {
  // Фильтруем пустые строки матрицы с конца, чтобы не слать лишние 800 строк в облако
  let matrix = [];
  for (let r = 0; r < window.excelMatrix.length; r++) {
    const row = window.excelMatrix[r];
    // Строка считается не пустой, если хотя бы в одной ячейке есть текст
    const hasData = row.some(cell => cell && cell.trim() !== "");
    if (hasData) {
      // Обрезаем массив строки до реальной длины заполненных ячеек
      let cleanRow = [...row];
      matrix.push(cleanRow);
    }
  }

  if (matrix.length === 0) {
    alert("Ошибка: Таблица Excel пуста! Вставьте данные перед сохранением.");
    return;
  }

  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "⏳ Обработка ячеек...";
    importBtn.disabled = true;
  }

  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    // Сохраняем отфильтрованное сальдо локально в буфер устройства
    window.balanceData = matrix;
    localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

    // =========================================================================
    // ЛОКАЛЬНОЕ СОПОСТАВЛЕНИЕ И ПЕРЕНОС ДАННЫХ В СТОЛБЕЦ из.SUP (ИНДЕКС 5)
    // =========================================================================
    const stock = window.inventoryData;
    if (stock && stock.length > 1) {
      for (let i = 1; i < stock.length; i++) {
        const sRow = stock[i];
        if (!sRow || sRow.length < 3) continue;

        // Поиск по Артикулу (индекс 0) и Параметру (индекс 1)
        const sArt = String(sRow[0]).trim().toLowerCase();
        const sParam = String(sRow[1]).trim().toLowerCase();

        for (let j = 1; j < matrix.length; j++) {
          const bRow = matrix[j];
          if (!bRow || bRow.length < 5) continue;

          if (String(bRow[0]).trim().toLowerCase() === sArt && String(bRow[1]).trim().toLowerCase() === sParam) {
            const cleanVal = parseInt(String(bRow[4]).replace(/\s+/g, '')) || 0;
            sRow[5] = cleanVal; // Записываем остаток в 6-й столбец (из.SUP) локально
            break;
          }
        }
      }
      window.inventoryData = stock;
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
      if (typeof renderStock === 'function') renderStock();
    }

    if (importBtn) importBtn.innerText = "☁️ Отправка в облако Google...";
    await new Promise(resolve => setTimeout(resolve, 50));

    if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
      // Отправляем пакетную команду импорта сальдо с автообновлением Листа 1
      const textPayload = "BALANCE_WITH_SUP_IMPORT|" + JSON.stringify(matrix);
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО САЛЬДО С ОБНОВЛЕНИЕМ из.SUP:\n\n" + serverText);
      hideBalancePasteArea();
    } else {
      alert(`Импорт завершен локально! Столбец из.SUP обновлен на устройстве.\nВнимание: В облако данные не ушли, так как интернет отсутствует.`);
      hideBalancePasteArea();
    }
  } catch (err) {
    console.error(err);
    alert("Критическая ошибка обработки таблицы: " + err.message);
    if (importBtn) {
      importBtn.innerText = "ВНЕСТИ ИЗМЕНЕНИЯ";
      importBtn.disabled = false;
    }
  }
}
