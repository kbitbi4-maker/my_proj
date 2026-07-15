// js/edit_log.js — Модуль прямого изменения ячейки КУДА в журнале выдачи

window.activeEditLogIndex = null;

/**
 * Переводит ячейку "Куда" конкретной строки журнала в режим редактирования при клике
 */
function enableLogCellEdit(event, logIndex) {
  event.stopPropagation();
  
  // Если уже есть открытая для редактирования ячейка — сбрасываем её перед переключением
  if (window.activeEditLogIndex !== null) {
    window.activeEditLogIndex = null;
    renderLogs();
  }

  window.activeEditLogIndex = logIndex;
  
  const targetTd = event.currentTarget;
  if (!targetTd) return;

  const currentVal = targetTd.innerText.trim();

  // Делаем фон БЕЛЫМ только на время редактирования
  targetTd.style.background = "#ffffff";
  targetTd.style.padding = "2px";
  
  targetTd.innerHTML = `
    <div style="display: flex; align-items: center; gap: 4px; width: 100%; box-sizing: border-box;" onclick="event.stopPropagation();">
      <input type="text" id="log-edit-input-${logIndex}" value="${currentVal === 'Не указан' ? '' : currentVal}" 
             style="flex-grow: 1; font-family: inherit; font-size: 1.3vh; padding: 4px; border: 1px solid #3b82f6; border-radius: 4px; outline: none; background: #fff; color: #000;" autocomplete="off">
      
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <button onclick="changeLogTextValue(${logIndex}, 'объект')" style="padding: 1px 4px; font-size: 1vh; font-weight: bold; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 3px; cursor: pointer; color: #000;">Объект</button>
        <button onclick="changeLogTextValue(${logIndex}, 'склад')" style="padding: 1px 4px; font-size: 1vh; font-weight: bold; background: #e2e8f0; border: 1px solid #cbd5e1; border-radius: 3px; cursor: pointer; color: #000;">Склад</button>
      </div>

      <button onclick="saveLogCellChangesCloud(event, ${logIndex})" 
              style="padding: 5px 8px; font-size: 1.3vh; font-weight: bold; background: #22c55e; color: white; border: none; border-radius: 4px; cursor: pointer;">
        💾
      </button>
      <button onclick="event.stopPropagation(); window.activeEditLogIndex = null; renderLogs();" 
              style="padding: 5px 8px; font-size: 1.3vh; font-weight: bold; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
        ✖
      </button>
    </div>
  `;

  // Устанавливаем фокус в поле ввода
  const inputEl = document.getElementById(`log-edit-input-${logIndex}`);
  if (inputEl) inputEl.focus();
}

/**
 * Быстрая подстановка пресетов текста ("Объект" / "Склад")
 */
function changeLogTextValue(logIndex, type) {
  const inputEl = document.getElementById(`log-edit-input-${logIndex}`);
  if (!inputEl) return;
  
  if (type === 'объект') inputEl.value = "Объект";
  if (type === 'склад') inputEl.value = "Склад";
}

/**
 * Отправляет изменения в облако и оставляет ячейку белой до ответа сервера
 */
async function saveLogCellChangesCloud(event, logIndex) {
  event.stopPropagation();

  const inputEl = document.getElementById(`log-edit-input-${logIndex}`);
  if (!inputEl) return;

  const newValue = inputEl.value.trim() !== "" ? inputEl.value.trim() : "Не указан";
  const logItem = window.qrLogs[logIndex];
  
  if (!logItem || !logItem.data) return;

  // ИСПРАВЛЕНО: Берем точный уникальный ID строки из первого элемента массива данных (индекс 0)
  const targetId = logItem.data[0]; 

  // Обновляем данные локально в памяти телефона (Куда выдано — это 9-й столбец, индекс 8 в массиве)
  logItem.data[8] = newValue;
  localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

  // Находим контейнер ячейки и фиксируем белый цвет на время отправки
  const inputContainer = inputEl.parentNode;
  const parentTd = inputContainer.parentNode;
  parentTd.style.background = "#ffffff";
  parentTd.innerHTML = `<span style="color: #64748b; font-style: italic; font-size: 1.2vh;">⏳ Отправка...</span>`;

  // Сбрасываем индекс редактирования, чтобы открыть доступ к другим кликам
  window.activeEditLogIndex = null;

  if (navigator.onLine && typeof SCRIPT_URL !== 'undefined') {
    try {
      const textPayload = `LOG_CELL_UPDATE|${targetId}|${newValue}`;

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: textPayload
      });

      const serverText = await response.text();
      console.log("Сервер ответил:", serverText);
      
      // Возвращаем стандартный цвет строки лога (зеленый/светло-зеленый)
      renderLogs();

    } catch (e) {
      console.error("Сетевая ошибка обновления лога:", e);
      alert("Ошибка сети. Данные сохранены на телефоне, но не дошли до Гугл Диска.");
      renderLogs();
    }
  } else {
    alert("Вы работаете офлайн. Изменение зафиксировано локально.");
    renderLogs();
  }
}
