// js/balance.js — Модуль импорта и обработки Сальдо (Лист 3) через прямую вставку

window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];

/**
 * Открытие стартового диалогового окна Сальдо
 */
function openBalanceMenu() {
  if (typeof stopCamera === 'function') stopCamera();

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  if (document.getElementById('return-view')) document.getElementById('return-view').classList.add('hidden');
  
  // Возвращаем исходный вид меню
  document.getElementById('balance-menu-buttons').classList.remove('hidden');
  document.getElementById('balance-paste-container').classList.add('hidden');
  document.getElementById('balance-view').classList.remove('hidden');
}

/**
 * Переключение интерфейса на окно ввода текста таблицы
 */
function showBalancePasteArea() {
  document.getElementById('balance-menu-buttons').classList.add('hidden');
  
  const textArea = document.getElementById('balance-text-area');
  if (textArea) textArea.value = ""; // Очищаем старый текст
  
  const importBtn = document.getElementById('btn-confirm-balance-import');
  if (importBtn) {
    importBtn.innerText = "ПОДТВЕРДИТЬ ИМПОРТ";
    importBtn.disabled = false;
  }

  document.getElementById('balance-paste-container').classList.remove('hidden');
}

/**
 * Возврат из окна ввода текста к главным кнопкам Сальдо
 */
function hideBalancePasteArea() {
  document.getElementById('balance-paste-container').classList.add('hidden');
  document.getElementById('balance-menu-buttons').classList.remove('hidden');
}

/**
 * Опция "СРАВНИТЬ" (Заглушка по ТЗ)
 */
function runCompareAlert() {
  alert("Опция 'Сравнить сальдо' находится в разработке.");
}

/**
 * ВЫСОКОПРОИЗВОДИТЕЛЬНЫЙ ПАРСЕР И ТЕКСТОВЫЙ ИМПОРТ ТАБЛИЦЫ ИЗ БУФЕРА ОБМЕНА
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

  // Даем браузеру 50мс на перерисовку текста кнопки перед тяжелым расчетом
  await new Promise(resolve => setTimeout(resolve, 50));

  try {
    const rawText = textArea.value;
    
    // Разделяем монолитный текст по строкам (поддерживаем \r\n из Windows и чистый \n)
    const lines = rawText.split(/\r?\n/);
    
    let matrix = [];
    
    // Бежим по строкам и разбиваем каждую строку по знаку табуляции (\t)
    for (let i = 0; i < lines.length; i++) {
      const lineStr = lines[i];
      if (lineStr && lineStr.trim() !== "") {
        const cells = lineStr.split('\t'); // Разделение ячеек Excel в строке
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

    // 1. СОХРАНЯЕМ МАТРИЦУ ЯЧЕЕК В ТРЕТЬЮ ЛОКАЛЬНУЮ БАЗУ ДАННЫХ
    window.balanceData = matrix;
    localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

    if (importBtn) {
      importBtn.innerText = "☁️ Отправка в облако Google...";
    }
    await new Promise(resolve => setTimeout(resolve, 50));

    // 2. ОТПРАВЛЯЕМ СФОРМИРОВАННЫЙ ТЕКСТ В ГУГЛ ТАБЛИЦУ (ЛИСТ 3)
    if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
      const textPayload = "BALANCE_IMPORT|" + JSON.stringify(matrix);

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: textPayload
      });

      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО САЛЬДО:\n\n" + serverText);
      
      if (typeof closeModal === 'function') closeModal();

    } else {
      alert(`Импорт завершен локально! В третью базу записано: ${matrix.length} строк.\nВнимание: Данные ушли только в память телефона, так как интернет отсутствует.`);
      if (typeof closeModal === 'function') closeModal();
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
