// js/balance.js — Модуль импорта Сальдо (Лист 3) и Сравнения остатков (Лист 4)

window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];
window.diffData = JSON.parse(localStorage.getItem('qr_diff_v1')) || [];

/**
 * ЧИСТАЯ И ОПТИМИЗИРОВАННАЯ СВЕРКА СОВПАДАЮЩИХ ПО СТРУКТУРЕ ЛОКАЛЬНЫХ БАЗ (ОСТАТКИ И САЛЬДО)
 */
async function executeDatabaseComparison() {
  const stock = window.inventoryData; 
  const balance = window.balanceData;  

  if (!stock || stock.length <= 1) { alert("Ошибка: База остатков пуста. Синхронизируйте облачко ☁"); return; }
  if (!balance || balance.length <= 1) { alert("Ошибка: Сначала загрузите сальдо из Excel через меню!"); return; }

  let diffMatrix = [];
  diffMatrix.push(["Партия", "Материал", "КрТекстМатериала", "Базисная ЕИ", "Разница остатка"]); 

  for (let i = 1; i < stock.length; i++) {
    const sRow = stock[i];
    if (!sRow || sRow.length < 5) continue;

    // Считываем ключи и количество строго по одинаковым индексам (0, 1 и 4)
    const sPart = String(sRow[0]).trim().toLowerCase(); // Партия
    const sArt = String(sRow[1]).trim().toLowerCase();  // Материал (Артикул)
    const sQty = parseInt(String(sRow[4]).replace(/\s+/g, '')) || 0; // Готовое количество запаса (индекс 4)

    let foundInBalance = false;
    let bQty = 0;

    for (let j = 1; j < balance.length; j++) {
      const bRow = balance[j];
      if (!bRow || bRow.length < 5) continue;

      // Полное совпадение по уникальной связке Артикула и Партии
      if (String(bRow[1]).trim().toLowerCase() === sArt && String(bRow[0]).trim().toLowerCase() === sPart) {
        foundInBalance = true;
        // Забираем сальдо из той же 5-й колонки (индекс 4)
        bQty = parseInt(String(bRow[4]).replace(/\s+/g, '')) || 0; 
        break;
      }
    }

    const difference = sQty - bQty;
    if (difference === 0) continue; 

    // Записываем структуру строки Листа 4
    let newDiffRow = [sRow[0] || "---", sRow[1], sRow[2], sRow[3] || "шт", ""]; 
    newDiffRow[4] = difference > 0 ? "+" + difference : String(difference);
    diffMatrix.push(newDiffRow);
  }

  window.diffData = diffMatrix;
  localStorage.setItem('qr_diff_v1', JSON.stringify(window.diffData));
  alert(`Сверка завершена!\nОбнаружено расхождений: ${diffMatrix.length - 1} позиций.\nОтправляем отчет в облако...`);

  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const textPayload = "COMPARE_EXPORT|" + JSON.stringify(diffMatrix);
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: textPayload
      });
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО СВЕРКЕ:\n\n" + await response.text());
    } catch (e) { alert("Ошибка отправки в облако: " + e.message); }
  } else { alert("Нет сети. Результаты сохранены локально."); }
}

/**
 * ВЫСОКОПРОИЗВОДИТЕЛЬНЫЙ ТЕКСТОВЫЙ ИМПОРТ САЛЬДО ИЗ БУФЕРА EXCEL С КОРРЕКТИРОВКОЙ из.SUP
 */
async function processTextTableImport() {
  const textArea = document.getElementById('balance-text-area');
  if (!textArea || textArea.value.trim() === "") { alert("Ошибка: Поле ввода пустое!"); return; }
  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) { importBtn.innerText = "⏳ Обработка..."; importBtn.disabled = true; }
  await new Promise(r => setTimeout(r, 50));

  try {
    const rawText = textArea.value;
    const lines = rawText.split(/\r?\n/);
    let matrix = [];
    for (let i = 0; i < lines.length; i++) {
      if (lines[i] && lines[i].trim() !== "") matrix.push(lines[i].split('\t'));
    }
    if (matrix.length === 0) { alert("Ошибка парсинга таблицы."); if (importBtn) importBtn.disabled = false; return; }

    window.balanceData = matrix;
    localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

    const stock = window.inventoryData;
    if (stock && stock.length > 1) {
      for (let i = 1; i < stock.length; i++) {
        if (!stock[i] || stock[i].length < 5) continue;
        const sPart = String(stock[i][0]).trim().toLowerCase();
        const sArt = String(stock[i][1]).trim().toLowerCase();
        
        for (let j = 1; j < matrix.length; j++) {
          if (!matrix[j] || matrix[j].length < 5) continue;
          if (String(matrix[j][1]).trim().toLowerCase() === sArt && String(matrix[j][0]).trim().toLowerCase() === sPart) {
            const cleanVal = parseInt(String(matrix[j][4]).replace(/\s+/g, '')) || 0;
            // КРИТИЧЕСКИЙ ФИКС: Пишем значение строго в 6-й столбец (из.SUP - индекс 5), НЕ ломая структуру строки!
            stock[i][5] = cleanVal; 
            break;
          }
        }
      }
      window.inventoryData = stock;
      localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));
      if (typeof renderStock === 'function') renderStock();
    }

    if (importBtn) importBtn.innerText = "☁️ Отправка в облако...";
    if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: "BALANCE_WITH_SUP_IMPORT|" + JSON.stringify(matrix)
      });
      alert("ОТВЕТ СЕРВЕРА GOOGLE:\n\n" + await response.text());
      if (typeof hideBalancePasteArea === 'function') hideBalancePasteArea();
    } else { alert("Импорт завершен локально!"); if (typeof hideBalancePasteArea === 'function') hideBalancePasteArea(); }
  } catch (err) { alert("Ошибка: " + err.message); if (importBtn) importBtn.disabled = false; }
}
