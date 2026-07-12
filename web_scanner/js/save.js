/**
 * Функция сохранения записи (Выдача или Возврат)
 */
function saveEntry() {
  const numDisplay = document.getElementById("numDisplay");
  if (!numDisplay) return;

  // Получаем введенное на нумпаде количество
  let qty = parseInt(numDisplay.innerText, 10) || 0;
  if (qty <= 0) {
    alert("Введите количество больше 0");
    return;
  }

  // Проверяем, включен ли режим возврата (флаг проверяется по состоянию кнопки или глобальной переменной)
  const isReturnMode = window.isReturnActive === true;

  // Извлекаем текущие данные отсканированного QR-кода (переменные должны быть объявлены в вашем коде глобально)
  const id = Date.now(); // Генерируем уникальный ID операции
  const art = window.currentScannedArt || "Не указан";
  const param = window.currentScannedParam || "Не указан";
  const user = window.currentSelectedUser || "Не выбран";
  const dateStr = window.currentSelectedDate || new Date().toLocaleDateString("ru-RU");

  // Если включен режим возврата — силой делаем количество отрицательным
  const finalQty = isReturnMode ? -qty : qty;
  const statusText = isReturnMode ? "Возврат" : "Выдача";

  // Формируем массив из 12 колонок для отправки в Google Таблицу (Лист 2)
  // Индексы: 0=ID, 1=Артикул, 2=Параметр, 5=Количество (Индекс 5), 11=Статус (Индекс 11)
  const rowData = [
    id,          // 1. Порядковый номер / ID
    art,         // 2. Артикул
    param,       // 3. Параметр
    dateStr,     // 4. Дата
    user,        // 5. Сотрудник
    finalQty,    // 6. Количество (Сюда улетит минус, если это возврат!)
    "",          // 7. Пусто
    "",          // 8. Пусто
    "",          // 9. Пусто
    "",          // 10. Пусто
    "",          // 11. Пусто
    statusText   // 12. Маркер операции ("Выдача" или "Возврат")
  ];

  // Блокируем кнопку на время отправки
  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.disabled = true;

  // Вызываем функцию отправки POST-запроса (она обычно находится в api.js или network.js)
  if (typeof sendPostToGoogle === "function") {
    sendPostToGoogle(rowData)
      .then(response => {
        if (response === "Success") {
          // Сбрасываем нумпад и закрываем модальное окно
          if (typeof clearNumpad === "function") clearNumpad();
          handleBackButton();
          // Принудительно запускаем синхронизацию, чтобы обновить локальный журнал и остатки
          if (typeof syncFromGoogle === "function") syncFromGoogle();
        } else {
          alert("Ошибка сервера: " + response);
        }
      })
      .catch(err => {
        alert("Ошибка сети: " + err);
      })
      .finally(() => {
        if (addBtn) addBtn.disabled = false;
      });
  } else {
    // Резервный вариант, если функция отправки называется по-другому
    console.error("Функция отправки sendPostToGoogle не найдена");
    if (addBtn) addBtn.disabled = false;
  }
}

/**
 * Переключение режима возврата по кнопке в Хедере
 */
function toggleReturnMode() {
  if (window.isReturnActive === undefined) {
    window.isReturnActive = false;
  }
  
  window.isReturnActive = !window.isReturnActive;
  const btn = document.getElementById("return-mode-btn");
  const addBtn = document.getElementById("addBtn");

  if (window.isReturnActive) {
    btn.style.backgroundColor = "#FCE4D6"; // Подсвечиваем кнопку возврата
    btn.title = "Режим ВОЗВРАТА активен";
    if (addBtn) {
      addBtn.style.backgroundColor = "#d9534f";
      addBtn.innerText = "ВЕРНУТЬ 0";
    }
  } else {
    btn.style.backgroundColor = ""; // Возвращаем исходный стиль
    btn.title = "Режим выдачи";
    if (addBtn) {
      addBtn.style.backgroundColor = "";
      addBtn.innerText = "ДОБАВИТЬ 0";
    }
  }
}
