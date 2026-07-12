// js/balance.js — Модуль импорта и обработки Сальдо (Лист 3)

// Инициализация третьей локальной базы данных
window.balanceData = JSON.parse(localStorage.getItem('qr_balance_v1')) || [];

/**
 * Открытие диалогового окна Сальдо
 */
function openBalanceMenu() {
  if (typeof stopCamera === 'function') stopCamera();

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  if (document.getElementById('return-view')) document.getElementById('return-view').classList.add('hidden');
  
  // Возвращаем кнопке загрузки сальдо её первоначальный текст на случай повторного открытия
  const loadBtn = document.getElementById('btn-load-balance-action');
  if (loadBtn) {
    loadBtn.innerText = "ЗАГРУЗИТЬ САЛЬДО";
    loadBtn.disabled = false;
  }

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

  const loadBtn = document.getElementById('btn-load-balance-action');
  if (loadBtn) {
    loadBtn.innerText = "⏳ Читаю Excel...";
    loadBtn.disabled = true;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });

      // Берем самый первый лист из загруженного Excel файла
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      // Превращаем лист Excel в двумерный массив массивов
      const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (!rawRows || rawRows.length === 0) {
        alert("Ошибка: Выбранный Excel файл пустой.");
        if (loadBtn) {
          loadBtn.innerText = "ЗАГРУЗИТЬ САЛЬДО";
          loadBtn.disabled = false;
        }
        return;
      }

      // Очищаем пустые строки
      const cleanRows = rawRows.filter(row => row && row.length > 0);

      // 1. ЗАПИСЫВАЕМ ДАННЫЕ В ТРЕТЬЮ ЛОКАЛЬНУЮ БАЗУ ДАННЫХ НА ТЕЛЕФОНЕ
      window.balanceData = cleanRows;
      localStorage.setItem('qr_balance_v1', JSON.stringify(window.balanceData));

      if (loadBtn) {
        loadBtn.innerText = "☁️ Отправляю в Google...";
      }

      // 2. ВЫГРУЖАЕМ ДАННЫЕ В ГУГЛ ТАБЛИЦУ (ЛИСТ 3)
      if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
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
        if (typeof closeModal === 'function') closeModal();
      }

    } catch (err) {
      console.error(err);
      alert("Ошибка при разборе Excel-файла: " + err.message);
      if (loadBtn) {
        loadBtn.innerText = "ЗАГРУЗИТЬ САЛЬДО";
        loadBtn.disabled = false;
      }
    }
  };

  reader.readAsArrayBuffer(file);
}
