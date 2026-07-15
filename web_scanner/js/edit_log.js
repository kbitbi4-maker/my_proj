// js/edit_log.js — Модуль прямого изменения ячейки КУДА в журнале выдачи

window.activeEditLogIndex = null;

/**
 * Переводит ячейку "Куда" конкретной строки журнала в режим редактирования при клике
 */
function enableLogCellEdit(event, logIndex) {
  event.stopPropagation();
  
  if (window.activeEditLogIndex !== null) {
    window.activeEditLogIndex = null;
    renderLogs();
  }

  window.activeEditLogIndex = logIndex;
  
  const targetTd = event.currentTarget;
  if (!targetTd) return;

  const currentVal = targetTd.innerText.trim();

  // При активации временно перекрываем прозрачность белым матовым фоном ячейки для удобства ввода
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

  const inputEl = document.getElementById(`log-edit-input-${logIndex}`);
  if (inputEl) inputEl.focus();
}

function changeLogTextValue(logIndex, type) {
  const inputEl = document.getElementById(`log-edit-input-${logIndex}`);
  if (!inputEl) return;
  
  if (type === 'объект') inputEl.value = "Объект";
  if (type === 'склад') inputEl.value = "Склад";
}

async function saveLogCellChangesCloud(event, logIndex) {
  event.stopPropagation();

  const inputEl = document.getElementById(`log-edit-input-${logIndex}`);
  if (!inputEl) return;

  const newValue = inputEl.value.trim() !== "" ? inputEl.value.trim() : "Не указан";
  const logItem = window.qrLogs[logIndex];
  
  if (!logItem || !logItem.data) return;

  const targetId = logItem.data[0]; 

  logItem.data[8] = newValue; // Запись в 9-й столбец массива памяти телефона
  localStorage.setItem('qr_db_v9', JSON.stringify(window.qrLogs));

  const inputContainer = inputEl.parentNode;
  const parentTd = inputContainer.parentNode;
  parentTd.style.background = "#ffffff";
  parentTd.innerHTML = `<span style="color: #64748b; font-style: italic; font-size: 1.2vh;">⏳ Отправка...</span>`;

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
