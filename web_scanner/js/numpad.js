// Переменные состояния для даты
window.isEditingDate = false;
window.customDateStr = ""; // Будет хранить строку формата ДДММГГ

function openNumpadView() {
  if (!window.currentSelectedRowData || window.currentSelectedRowData.length === 0) return;

  const itemTitle = window.currentSelectedRowData.slice(0, 4).join(' ');
  const currentStock = window.currentSelectedRowData[4] || '0';

  document.getElementById('qr-data-display').innerText = `ТОВАР: ${itemTitle} (Ост: ${currentStock})`;
  
  // Сброс состояния
  window.currentQty = "0"; 
  window.currentUser = "Не указан"; 
  window.isEditingDate = false;
  window.customDateStr = "";
  
  // Получаем текущую системную дату для отображения по умолчанию
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString().slice(-2);
  
  if (typeof numDisplay !== 'undefined' && numDisplay) numDisplay.innerText = "0"; 
  if (typeof whoLabel !== 'undefined' && whoLabel) whoLabel.innerText = "...";
  if (typeof addBtn !== 'undefined' && addBtn) addBtn.innerText = "ДОБАВИТЬ 0";
  
  const dateBtn = document.getElementById('date-select-btn');
  if (dateBtn) dateBtn.innerText = `Дата: ${day}.${month}.${year}`;

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.remove('hidden');
}

function handleBackButton() {
  // Если мы в меню подтверждения возврата — закрываем модалку и сбрасываем режим возврата
  if (!document.getElementById('return-view').classList.contains('hidden')) {
    document.getElementById('return-view').classList.add('hidden');
    closeModal();
    if (typeof toggleReturnMode === 'function' && window.isReturnMode) {
      toggleReturnMode();
    }
    return;
  }
  // Если мы находимся в меню выбора пользователя, возвращаемся в нумпад
  if (!document.getElementById('user-view').classList.contains('hidden')) {
    closeUserMenu();
    return;
  }
  // Если мы в нумпаде, возвращаемся к таблице остатков
  if (!document.getElementById('numpad-view').classList.contains('hidden')) {
    document.getElementById('numpad-view').classList.add('hidden');
    document.getElementById('stock-view').classList.remove('hidden');
    return;
  }
  // В противном случае (мы в окне остатков) — закрываем модалку полностью
  closeModal();
}

function toggleDateMode() {
  window.isEditingDate = !window.isEditingDate;
  const dateBtn = document.getElementById('date-select-btn');
  
  if (window.isEditingDate) {
    if (dateBtn) dateBtn.style.borderColor = "#ff9800";
    if (window.customDateStr === "") {
      updateDateDisplay("______");
    }
  } else {
    if (dateBtn) dateBtn.style.borderColor = "#cbd5e1";
    if (window.customDateStr.length < 6) {
      window.customDateStr = "";
      const now = new Date();
      const day = now.getDate().toString().padStart(2, '0');
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const year = now.getFullYear().toString().slice(-2);
      if (dateBtn) dateBtn.innerText = `Дата: ${day}.${month}.${year}`;
    }
  }
}

function updateDateDisplay(str) {
  const d1 = str[0] || '_', d2 = str[1] || '_';
  const m1 = str[2] || '_', m2 = str[3] || '_';
  const y1 = str[4] || '_', y2 = str[5] || '_';
  const dateBtn = document.getElementById('date-select-btn');
  if (dateBtn) dateBtn.innerText = `Дата: ${d1}${d2}.${m1}${m2}.${y1}${y2}`;
}

function pressNum(n) {
  if (window.isEditingDate) {
    if (n === 'C') {
      if (window.customDateStr.length > 0) {
        window.customDateStr = window.customDateStr.slice(0, -1);
      }
    } else {
      if (window.customDateStr.length < 6) {
        window.customDateStr += String(n);
      }
    }
    
    let displayMask = window.customDateStr + "______".slice(window.customDateStr.length);
    updateDateDisplay(displayMask);
    
    if (window.customDateStr.length === 6) {
      window.isEditingDate = false;
      const dateBtn = document.getElementById('date-select-btn');
      if (dateBtn) dateBtn.style.borderColor = "#cbd5e1";
    }
  } else {
    if (n === 'C') {
      window.currentQty = "0";
    } else {
      window.currentQty = window.currentQty === "0" ? String(n) : window.currentQty + n;
    }
    
    if (typeof numDisplay !== 'undefined' && numDisplay) numDisplay.innerText = window.currentQty;
    if (typeof addBtn !== 'undefined' && addBtn) {
      addBtn.innerText = `ДОБАВИТЬ ${window.currentQty} (${window.currentUser || 'Не указан'})`;
    }
  }
}

function openUserMenu() {
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('user-view').classList.remove('hidden');
}

function closeUserMenu() {
  document.getElementById('user-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.remove('hidden');
}

function selectUser(name) {
  window.currentUser = name;
  if (typeof whoLabel !== 'undefined' && whoLabel) whoLabel.innerText = name;
  if (typeof addBtn !== 'undefined' && addBtn) {
    addBtn.innerText = `ДОБАВИТЬ ${window.currentQty} (${window.currentUser})`;
  }
  closeUserMenu();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  window.scanning = false;
  const camBtn = document.getElementById('start-camera');
  if (camBtn) camBtn.disabled = false;
}
