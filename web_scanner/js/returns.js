// js/returns.js — Модуль управления возвратами

// Глобальная переменная состояния режима возврата
window.isReturnMode = false;

// Глобальная переменная для хранения индекса строки лога, с которой мы сейчас работаем
window.currentReturnLogIndex = null;

/**
 * 1. Включение / выключение режима возврата по кнопке в шапке
 */
function toggleReturnMode() {
  window.isReturnMode = !window.isReturnMode;
  const btn = document.getElementById('return-mode-btn');
  
  if (window.isReturnMode) {
    if (btn) btn.classList.add('return-mode-active');
    // Если включили режим возврата — принудительно выключаем камеру
    if (typeof stopCamera === 'function') {
      stopCamera();
    }
  } else {
    if (btn) btn.classList.remove('return-mode-active');
  }
}

/**
 * 2. Обработка клика по строке в журнале выдачи на главном экране
 * @param {number} originalIndex - Индекс строки в глобальном массиве window.qrLogs
 */
function handleLogClick(originalIndex) {
  // Если режим возврата НЕ активирован — обычный клик ничего не делает
  if (!window.isReturnMode) return;
  
  const logItem = window.qrLogs[originalIndex];
  if (!logItem || !logItem.data) return;
  
  window.currentReturnLogIndex = originalIndex;
  const rowData = logItem.data;
  
  // Извлекаем необходимые данные по ТЗ:
  // Номер выдачи — 1-й столбец (индекс 0 в массиве JS)
  const id = rowData[0] !== undefined ? rowData[0] : '---';
  
  // Товар и количество из 4, 5 и 6 столбцов (индексы 3, 4 и 5 в массиве JS)
  const col4 = rowData[3] !== undefined ? rowData[3] : '';
  const col5 = rowData[4] !== undefined ? rowData[4] : '';
  const col6 = rowData[5] !== undefined ? rowData[5] : '0';
  
  // Компонуем текстовое описание для вывода в информационный блок модального окна
  const infoBadge = document.getElementById('return-info-badge');
  if (infoBadge) {
    infoBadge.innerHTML = `
      <strong>ВЫДАЧА №:</strong> ${id}<br>
      <strong>ТОВАР:</strong> ${col4} ${col5}<br>
      <strong>КОЛ-ВО В СТРОКЕ:</strong> ${col6} шт.
    `;
  }
  
  // Переключаем экраны модального окна: скрываем лишнее, показываем интерфейс управления возвратом
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  document.getElementById('return-view').classList.remove('hidden');
}

/**
 * 3. Обработка действий управления строкой выдачи
 * @param {string} actionType - Тип нажатой кнопки ('full', 'part', 'delete')
 */
function processReturn(actionType) {
  if (window.currentReturnLogIndex === null) {
    alert("Ошибка: Строка лога не выбрана.");
    return;
  }
  
  if (actionType === 'full') {
    alert(`Выбрано: Полный ВОЗВРАТ для строки с индексом ${window.currentReturnLogIndex}`);
    // Логика полного возврата будет написана в следующем шаге
  } else if (actionType === 'part') {
    alert(`Выбрано: ВЕРНУТЬ ЧАСТЬ для строки с индексом ${window.currentReturnLogIndex}`);
    // Логика частичного возврата будет написана в следующем шаге
  } else if (actionType === 'delete') {
    alert(`Выбрано: УДАЛИТЬ СТРОКУ для строки с индексом ${window.currentReturnLogIndex}`);
    // Логика удаления строки будет написана в следующем шаге
  }
}

