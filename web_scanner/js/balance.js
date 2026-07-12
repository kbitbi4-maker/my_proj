// js/balance.js — Модуль импорта и обработки Сальдо (Лист 3)

// Инициализация третьей локальной базы данных
window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];

/**
 * Открытие диалогового окна Сальдо
 */
function openBalanceMenu() {
  // Выключаем камеру, если она активна
  if (typeof stopCamera === 'function') stopCamera();

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  if (document.getElementById('return-view')) document.getElementById('return-view').classList.add('hidden');
  
  document.getElementById('balance-view').classList.remove('hidden');
}

/**
 * Опция "СРАВНИТЬ" (Заглушка по ТЗ)
 */
function runCompareAlert() {
  alert("Опция 'Сравнить сальдо' находится в разработке.");
}

/**
 * Вызов системного окна выбора файлов смартфона/ПК
 */
function triggerExcelFileChoice() {
  const fileInput = document.getElementById('excel-file-input');
  if (fileInput) {
    fileInput.value = ""; // Очищаем старый выбор
    fileInput.click();
  }
}

/**
 * Обработчик чтения Excel файла и его импорта
 */
function handleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  alert("Файл успешно выбран. Начинается чтение структуры Excel...");

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // Берем самый первый лист из загруженного Excel файла
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Превращаем лист Excel в двумерный массив массивов [ [], [], [] ]
      // { header: 1 } гарантирует сохранение структуры строк и колонок
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!rawRows || rawRows.length === 0) {
        alert("Ошибка: Выбранный Excel файл пустой.");
        return;
      }

      // Очищаем пустые строки, если они есть
      const cleanRows = rawRows.filter(row => row && row.length > 0);

      // 1. ЗАПИСЫВАЕМ ДАННЫЕ В ТРЕТЬЮ ЛОКАЛЬНУЮ БАЗУ ДАННЫХ НА ТЕЛЕФОНЕ
      window.balanceData = cleanRows;
      localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

      alert(`Успешно импортировано локально: ${cleanRows.length} строк.\nНачинается выгрузка на Лист 3 в Google Таблицу...`);

      // 2. ВЫГРУЖАЕМ ДАННЫЕ В ГУГЛ ТАБЛИЦУ (ЛИСТ 3) МОНОЛИТНЫМ СЕТЕВЫМ ТЕКСТОВЫМ ПОСТ-ЗАПРОСОМ
      if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
        // Упаковываем массив массивов в текстовый payload через разделитель
        // Формат: "BALANCE_IMPORT|JSON_строка_массива"
        const textPayload = "BALANCE_IMPORT|" + JSON.stringify(cleanRows);

        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: textPayload
        });

        const serverText = await response.text();
        alert("ОТВЕТ СЕРВЕРА GOOGLE ПО САЛЬДО:\n\n" + serverText);
        
        // Закрываем модальное окно после успешного импорта
        if (typeof closeModal === 'function') closeModal();

      } else {
        alert("Внимание: Нет сети. Данные сохранены в третью базу только локально на телефоне.");
      }

    } catch (err) {
      console.error(err);
      alert("Ошибка при разборе Excel-файла: " + err.message);
    }
  };

  reader.readAsArrayBuffer(file);
}

