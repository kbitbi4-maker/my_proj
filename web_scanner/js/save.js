// Инициализация глобального флага режима возврата, если он отсутствует
if (typeof window.isReturnActive === 'undefined') {
  window.isReturnActive = false;
}

/**
 * Переключение режима возврата по кнопке в Хедере
 * Меняет цвет элементов управления и обновляет текст главной кнопки
 */
function toggleReturnMode() {
  window.isReturnActive = !window.isReturnActive;
  
  const btn = document.getElementById("return-mode-btn");
  const addBtn = document.getElementById("addBtn");
  const numDisplay = document.getElementById("numDisplay");
  
  const currentQty = numDisplay ? (parseInt(numDisplay.innerText, 10) || 0) : 0;

  if (window.isReturnActive) {
    if (btn) {
      btn.style.backgroundColor = "#FCE4D6"; 
      btn.title = "Режим ВОЗВРАТА активен";
    }
    if (addBtn) {
      addBtn.style.backgroundColor = "#d9534f";
      addBtn.style.color = "#ffffff";
      addBtn.innerText = "ВЕРНУТЬ " + currentQty;
    }
  } else {
    if (btn) {
      btn.style.backgroundColor = ""; 
      btn.title = "Режим выдачи";
    }
    if (addBtn) {
      addBtn.style.backgroundColor = "";
      addBtn.style.color = "";
      addBtn.innerText = "ДОБАВИТЬ " + currentQty;
    }
  }
}

/**
 * Функция формирования строки данных и ее отправки в Google Таблицы
 */
function saveEntry() {
  const numDisplay = document.getElementById("numDisplay");
  if (!numDisplay) {
    alert("Критическая ошибка: Экран ввода количества не найден.");
    return;
  }

  // Получаем введенное на нумпаде количество товара
  let qty = parseInt(numDisplay.innerText, 10) || 0;
  if (qty <= 0) {
    alert("Введите количество больше 0");
    return;
  }

  // Сбор данных из глобального контекста вашего веб-сканера
  const id = Date.now(); 
  const art = window.currentScannedArt || "Не указан";
  const param = window.currentScannedParam || "Не указан";
  const user = window.currentSelectedUser || "Не выбран";
  const dateStr = window.currentSelectedDate || new Date().toLocaleDateString("ru-RU");

  // Если активирован режим возврата — силой превращаем число в ОТРИЦАТЕЛЬНОЕ
  const isReturnMode = window.isReturnActive === true;
  const finalQty = isReturnMode ? -Math.abs(qty) : Math.abs(qty);
  const statusText = isReturnMode ? "Возврат" : "Выдача";

  // Строго формируем структуру из 12 ячеек для отправки на Лист 2
  const rowData = [
    id,          // 1. Порядковый номер / ID (Колонка A)
    art,         // 2. Артикул (Колонка B)
    param,       // 3. Параметр (Колонка C)
    dateStr,     // 4. Дата (Колонка D)
    user,        // 5. Сотрудник (Колонка E)
    finalQty,    // 6. Количество (Колонка F -> улетит МИНУС, если это возврат!)
    "",          // 7. Резерв
    "",          // 8. Резерв
    "",          // 9. Резерв
    "",          // 10. Резерв
    "",          // 11. Резерв
    statusText   // 12. Текстовый маркер операции (Колонка L)
  ];

  // Защита кнопки от повторных случайных кликов в момент отправки
  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.disabled = true;

  // Вызов вашей глобальной функции отправки POST-запроса (в api.js)
  if (typeof sendPostToGoogle === "function") {
    sendPostToGoogle(rowData)
      .then(response => {
        if (response === "Success") {
          // Сброс экрана нумпада
          if (typeof clearNumpad === "function") {
            clearNumpad();
          } else {
            numDisplay.innerText = "0";
          }
          
          // Если был возврат — автоматически выключаем этот режим для следующей операции
          if (window.isReturnActive) {
            toggleReturnMode();
          }

          // Закрываем модальное окно нумпада
          if (typeof handleBackButton === "function") handleBackButton();

          // Вызов вашей функции обновления данных на фронтенде
          if (typeof syncFromGoogle === "function") syncFromGoogle();
        } else {
          alert("Ошибка сервера Google: " + response);
        }
      })
      .catch(err => {
        alert("Ошибка сети при передаче данных: " + err);
      })
      .finally(() => {
        if (addBtn) addBtn.disabled = false;
      });
  } else {
    alert("Ошибка архитектуры приложения: Функция sendPostToGoogle не найдена.");
    if (addBtn) addBtn.disabled = false;
  }
}
