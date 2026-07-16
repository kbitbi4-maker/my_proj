// js/balance_logic.js — Модуль импорта Сальдо и Автоматической сверки

window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
window.diffData = JSON.parse(localStorage.getItem('qr_diff_v1')) || [];

/**
 * ОРИГИНАЛЬНОЕ СРАВНЕНИЕ БАЗ ДАННЫХ ПО ЖЕСТКИМ ИНДЕКСАМ (0, 1 и 4)
 */
async function executeDatabaseComparison() {
  const stock = window.inventoryData; 
  const balance = window.balanceData;  

  if (!stock || stock.length <= 1) {
    alert("Ошибка: База остатков пуста. Синхронизируйте облачко ☁");
    return;
  }
  if (!balance || balance.length <= 1) {
    alert("Ошибка: Сначала загрузите сальдо из Excel через кнопку выше!");
    return;
  }

  let diffMatrix = [];
  diffMatrix.push([...stock[0].slice(0, 5)]); 

  for (let i = 1; i < stock.length; i++) {
    const sRow = stock[i];
    if (!sRow || sRow.length < 5) continue;

    const sArt = String(sRow[0]).trim();
    const sParam = String(sRow[1]).trim();
    
    const cleanStockStr = String(sRow[4]).replace(/\s+/g, '');
    const sQty = parseInt(cleanStockStr) || 0; 

    let foundInBalance = false;
    let bQty = 0;

    for (let j = 1; j < balance.length; j++) {
      const bRow = balance[j];
      if (!bRow || bRow.length < 5) continue;

      if (String(bRow[0]).trim() === sArt && String(bRow[1]).trim() === sParam) {
        foundInBalance = true;
        const cleanBalanceStr = String(bRow[4]).replace(/\s+/g, '');
        bQty = parseInt(cleanBalanceStr) || 0; 
        break;
      }
    }

    const difference = sQty - bQty;
    if (difference === 0) continue;

    let newDiffRow = [...sRow.slice(0, 5)];
    if (difference > 0) {
      newDiffRow[4] = "+" + difference;
    } else {
      newDiffRow[4] = String(difference); 
    }
    diffMatrix.push(newDiffRow);
  }

  window.diffData = diffMatrix;
  localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));

  alert(`Сверка завершена!\nОбнаружено расхождений: ${diffMatrix.length - 1} позиций.\nОтправляем отчет на Лист 4 в облако...`);

  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const textPayload = "COMPARE_EXPORT|" + JSON.stringify(diffMatrix);
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО СВЕРКЕ:\n\n" + serverText);
    } catch (e) {
      console.error(e);
      alert("Отчет сохранен на устройстве, но произошла ошибка отправки в облако: " + e.message);
    }
  } else {
    alert("Нет сети. Результаты сравнения сохранены локально в четвертую базу данных.");
  }
}

/**
 * ОРИГИНАЛЬНЫЙ ТЕКСТОВЫЙ ИМПОРТ ТАБЛИЦЫ С КОРРЕКТНЫМ РАСПРЕДЕЛЕНИЕМ
 */
async function processTextTableImport() {
  const textArea = document.getElementById('balance-text-area');
  if (!textArea || textArea.value.trim() === "") {
    alert("Ошибка: Поле ввода пустое! Сначала скопируйте ячейки в Excel и вставьте их сюда.");
    return;
  }

  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "⏳ Обработка ячеек...";
    importBtn.disabled = true;
  }

  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const rawText = textArea.value;
    const lines = rawText.split(/\r?\n/);
    let matrix = [];
    
    for (let i = 0; i < lines.length; i++) {
      const lineStr = lines[i];
      if (lineStr && lineStr.trim() !== "") {
        const cells = lineStr.split('\t'); 
        matrix.push(cells);
      }
    }

    if (matrix.length === 0) {
      alert("Ошибка: Не удалось распознать строки таблицы.");
      if (importBtn) {
        importBtn.innerText = "ПОДТВЕРДИТЬ ИМПОРТ";
        importBtn.disabled = false;
      }
      return;
    }

    window.balanceData = matrix;
    localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

    if (importBtn) importBtn.innerText = "☁️ Отправка в облако Google...";
    await new Promise(resolve => setTimeout(resolve, 50));

    if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
      const textPayload = "BALANCE_IMPORT|" + JSON.stringify(matrix);
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО САЛЬДО:\n\n" + serverText);
      if (typeof hideBalancePasteArea === 'function') hideBalancePasteArea();
    } else {
      alert(`Импорт завершен локально! В третью базу записано: ${matrix.length} строк.\nВнимание: Данные ушли только в память телефона, так как интернет отсутствует.`);
      if (typeof hideBalancePasteArea === 'function') hideBalancePasteArea();
    }
  } catch (err) {
    console.error(err);
    alert("Критическая ошибка парсинга текста: " + err.message);
    if (importBtn) {
      importBtn.innerText = "ПОДТВЕРДИТЬ ИМПОРТ";
      importBtn.disabled = false;
    }
  }
}
