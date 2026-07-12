// js/edit_stock.js — Модуль прямого редактирования остатков в таблице

window.isStockEditMode = false;

/**
 * Переключение интерфейса окна остатков в режим редактирования ячеек
 */
function toggleStockEditMode(activate) {
  window.isStockEditMode = activate;
  
  const badge = document.getElementById('stock-edit-badge');
  const triggerBtn = document.getElementById('stock-edit-trigger-btn');
  const actionsRow = document.getElementById('stock-edit-actions');
  
  if (window.isStockEditMode) {
    if (badge) badge.classList.remove('hidden');
    if (triggerBtn) triggerBtn.classList.add('hidden');
    if (actionsRow) actionsRow.classList.remove('hidden');
  } else {
    if (badge) badge.classList.add('hidden');
    if (triggerBtn) triggerBtn.classList.remove('hidden');
    if (actionsRow) actionsRow.classList.add('hidden');
  }
  
  // Принудительно перерисовываем таблицу, чтобы подставились инпуты ввода
  if (typeof renderStock === 'function') {
    renderStock();
  }
}

/**
 * Вызывается при нажатии кнопки "ОТМЕНА" в режиме редактирования остатков
 */
function cancelStockChanges() {
  if (!confirm("Отменить все внесенные изменения остатков?")) return;
  toggleStockEditMode(false);
}

/**
 * Вызывается при нажатии кнопки "СОХРАНИТЬ ИЗМЕНЕНИЯ"
 * Собирает измененные данные, пишет в localStorage и отправляет текстовый POST на сервер Google
 */
async function saveStockChangesCloud() {
  const currentData = window.inventoryData;
  if (!currentData || currentData.length <= 1) return;

  // Массив для хранения строк изменений в формате: "Артикул*Параметр*НовыйОстаток"
  let updatePayloadParts = [];

  // Бежим по строкам таблицы (пропускаем заголовок i=0)
  for (let i = 1; i < currentData.length; i++) {
    const inputEl = document.getElementById(`stock-input-${i}`);
    if (inputEl) {
      const newValue = parseInt(inputEl.value);
      if (isNaN(newValue) || newValue < 0) {
        alert(`Ошибка: В строке №${i} указано некорректное число остатка.`);
        return;
      }
      
      // Обновляем данные в локальной оперативной памяти телефона
      currentData[i][4] = newValue;
      
      // Собираем ключи (Артикул, Параметр) и новое количество для отправки в облако
      const art = String(currentData[i][0]).trim();
      const param = String(currentData[i][1]).trim();
      updatePayloadParts.push(`${art}*${param}*${newValue}`);
    }
  }

  if (updatePayloadParts.length === 0) {
    toggleStockEditMode(false);
    return;
  }

  // 1. МГНОВЕННО ФИКСИРУЕМ ОБНОВЛЕННЫЕ ДАННЫЕ В ЛОКАЛЬНОЙ ПАМЯТИ ТЕЛЕФОНА
  window.inventoryData = currentData;
  localStorage.setItem('qr_inventory_v2', JSON.stringify(window.inventoryData));

  // Выключаем режим редактирования и перерисовываем чистую таблицу
  toggleStockEditMode(false);

  // 2. ОТПРАВЛЯЕМ ИЗОЛИРОВАННУЮ СТРОКУ ИЗМЕНЕНИЙ В GOOGLE ТАБЛИЦУ (ЛИСТ 1)
  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      // Формируем монолитную текстовую строку, где записи разделены знаком "|"
      // Формат: "STOCK_UPDATE|Арт1*Парам1*Кол1|Арт2*Парам2*Кол2|..."
      const textPayload = "STOCK_UPDATE|" + updatePayloadParts.join("|");

      // Отправляем чистым текстом text/plain для гарантированного обхода CORS-защиты Google
      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: textPayload
      });

      const serverText = await response.text();
      alert("ОТВЕТ СЕРВЕРА GOOGLE ПО СКЛАДУ:\n\n" + serverText);

    } catch (e) {
      console.error("Сетевая ошибка при обновлении остатков:", e);
      alert("Остатки изменены локально на устройстве, но в облаке произошла сетевая ошибка: " + e.message);
    }
  } else {
    alert("Вы работаете офлайн. Изменения остатков применены только локально на этом устройстве.");
  }
}

