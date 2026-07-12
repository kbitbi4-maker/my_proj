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
 * Функция сохранения записи
 */
function saveEntry() {
  const numDisplay = document.getElementById("numDisplay");
  if (!numDisplay) return;

  let qty = parseInt(numDisplay.innerText, 10) || 0;
  if (qty <= 0) {
    alert("Введите количество больше 0");
    return;
  }

  const id = Date.now(); 
  const art = window.currentScannedArt || "Не указан";
  const param = window.currentScannedParam || "Не указан";
  const user = window.currentSelectedUser || "Не выбран";
  const dateStr = window.currentSelectedDate || new Date().toLocaleDateString("ru-RU");

  // ОПРЕДЕЛЕНИЕ КОЛИЧЕСТВА: При возврате улетает знак МИНУС
  const isReturnMode = window.isReturnActive === true;
  const finalQty = isReturnMode ? -Math.abs(qty) : Math.abs(qty);
  const statusText = isReturnMode ? "Возврат" : "Выдача";

  // Сборка 12-колоночной строки
  const rowData = [
    id,          // 1. Порядковый номер операции
    art,         // 2. Артикул
    param,       // 3. Параметр
    dateStr,     // 4. Дата
    user,        // 5. Сотрудник
    finalQty,    // 6. Количество (содержит минус, если это возврат)
    "", "", "", "", "", // Технический резерв
    statusText   // 12. Статус операции
  ];

  const addBtn = document.getElementById("addBtn");
  if (addBtn) addBtn.disabled = true;

  if (typeof sendPostToGoogle === "function") {
    sendPostToGoogle(rowData)
      .then(response => {
        if (response === "Success") {
          numDisplay.innerText = "0";
          if (typeof clearNumpad === "function") clearNumpad();
          
          if (window.isReturnActive) toggleReturnMode();

          if (typeof handleBackButton === "function") handleBackButton();
          if (typeof syncFromGoogle === "function") syncFromGoogle();
        } else {
          alert("Ошибка сервера Google: " + response);
        }
      })
      .catch(err => {
        alert("Ошибка сети: " + err);
      })
      .finally(() => {
        if (addBtn) addBtn.disabled = false;
      });
  } else {
    alert("Ошибка: Функция sendPostToGoogle не найдена.");
    if (addBtn) addBtn.disabled = false;
  }
}
