// Инициализация глобального флага режима возврата (0 - выдача, 1 - возврат)
if (typeof window.isReturnActive === 'undefined') {
  window.isReturnActive = false;
}

/**
 * Переключение режима возврата по кнопке в Хедере
 */
function toggleReturnMode() {
  window.isReturnActive = !window.isReturnActive;
  
  const btn = document.getElementById("return-mode-btn");
  const addBtn = document.getElementById("addBtn");
  const numDisplay = document.getElementById("numDisplay");
  
  const currentQty = numDisplay ? (parseInt(numDisplay.innerText, 10) || 0) : 0;

  if (window.isReturnActive) {
    if (btn) btn.style.backgroundColor = "#FCE4D6"; 
    if (addBtn) {
      addBtn.style.backgroundColor = "#d9534f";
      addBtn.style.color = "#ffffff";
      addBtn.innerText = "ВЕРНУТЬ " + currentQty;
    }
  } else {
    if (btn) btn.style.backgroundColor = ""; 
    if (addBtn) {
      addBtn.style.backgroundColor = "";
      addBtn.style.color = "";
      addBtn.innerText = "ДОБАВИТЬ " + currentQty;
    }
  }
}

/**
 * Функция сохранения записи и отправки пакета данных в Google Таблицу
 */
function saveEntry() {
  const numDisplay = document.getElementById("numDisplay");
  if (!numDisplay) return;

  let qty = parseInt(numDisplay.innerText, 10) || 0;
  if (qty <= 0) {
    alert("Введите количество больше 0");
    return;
  }

  // Подготавливаем данные для отправки в Google Таблицы
  const id = Date.now(); 
  
  // Берем артикул и параметр, которые были вытащены через разделитель "!" в файле camera.js
  const art = window.currentScannedArt || "Не указан";
  const param = window.currentScannedParam || "Не указан";
  
  const user = window.currentSelectedUser || "Не выбран";
  const dateStr = window.currentSelectedDate || new Date().toLocaleDateString("ru-RU");

  // ОПРЕДЕЛЕНИЕ РЕЖИМА: Если кнопка возврата нажата — делаем число ОТРИЦАТЕЛЬНЫМ
  const isReturnMode = window.isReturnActive === true;
  const finalQty = isReturnMode ? -Math.abs(qty) : Math.abs(qty);
  const statusText = isReturnMode ? "Возврат" : "Выдача";

  // Строго собираем 12 ячеек строки для Листа 2 Google Таблицы
  const rowData = [
    id,          // 1. Порядковый номер транзакции (Колонка A)
    art,         // 2. Выделенный артикул (Колонка B)
    param,       // 3. Выделенный параметр (Колонка C)
    dateStr,     // 4. Дата проведения (Колонка D)
    user,        // 5. Выбравший сотрудник (Колонка E)
    finalQty,    // 6. КОЛИЧЕСТВО (Колонка F -> Сюда пишется МИНУС при возврате!)
    "",          // 7. Пустая ячейка
    "",          // 8. Пустая ячейка
    "",          // 9. Пустая ячейка
    "",          // 10. Пустая ячейка
    "",          // 11. Пустая ячейка
    statusText   // 12. Текстовый статус операции (Колонка L)
  ];

  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.disabled = true;

  // Отправляем сформированный массив в вашу функцию POST-запроса из api.js
  if (typeof sendPostToGoogle === "function") {
    sendPostToGoogle(rowData)
      .then(response => {
        if (response === "Success") {
          // Очищаем экран ввода нумпада
          numDisplay.innerText = "0";
          if (typeof clearNumpad === "function") clearNumpad();
          
          // Если мы находились в режиме возврата — выключаем его для следующего сканирования
          if (window.isReturnActive) {
            toggleReturnMode();
          }

          // Закрываем модальное окно нумпада
          if (typeof handleBackButton === "function") handleBackButton();

          // Вызываем облачную синхронизацию данных для обновления интерфейса
          if (typeof syncFromGoogle === "function") syncFromGoogle();
        } else {
          alert("Ответ сервера Google: " + response);
        }
      })
      .catch(err => {
        alert("Ошибка сети при сохранении: " + err);
      })
      .finally(() => {
        if (addBtn) addBtn.disabled = false;
      });
  } else {
    alert("Критическая ошибка фронтенда: Функция sendPostToGoogle не найдена.");
    if (addBtn) addBtn.disabled = false;
  }
}
