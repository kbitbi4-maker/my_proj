// js/numpad.js — Модуль цифровой клавиатуры и навигации

window.isEditingDate = false;
window.customDateStr = ""; 
window.currentWhere = "Не указан";

function openNumpadView() {
  if (!window.currentSelectedRowData || window.currentSelectedRowData.length === 0) return;

  const itemTitle = window.currentSelectedRowData.slice(0, 4).join(' ');
  const currentStock = window.currentSelectedRowData[4] || '0';

  document.getElementById('qr-data-display').innerText = `ТОВАР: ${itemTitle} (Ост: ${currentStock})`;
  
  window.currentQty = "0"; 
  window.currentUser = "Не указан"; 
  window.currentWhere = "Не указан";
  window.isEditingDate = false;
  window.customDateStr = "";
  
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear().toString().slice(-2);
  
  if (typeof numDisplay !== 'undefined' && numDisplay) numDisplay.innerText = "0"; 
  if (typeof whoLabel !== 'undefined' && whoLabel) whoLabel.innerText = "...";
  if (typeof whereLabel !== 'undefined' && whereLabel) whereLabel.innerText = "...";
  if (typeof addBtn !== 'undefined' && addBtn) addBtn.innerText = "ДОБАВИТЬ 0";
  
  const dateBtn = document.getElementById('date-select-btn');
  if (dateBtn) dateBtn.innerText = `Дата: ${day}.${month}.${year}`;

  const whereInputEl = document.getElementById('where-input');
  if (whereInputEl) whereInputEl.value = "";

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  if (document.getElementById('where-view')) document.getElementById('where-view').classList.add('hidden');
  if (document.getElementById('return-view')) document.getElementById('return-view').classList.add('hidden');
  if (document.getElementById('balance-view')) document.getElementById('balance-view').classList.add('hidden');
  if (document.getElementById('diff-table-view')) document.getElementById('diff-table-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.remove('hidden');
}

function handleBackButton() {
  const pasteContainer = document.getElementById('balance-paste-container');
  if (pasteContainer && !pasteContainer.classList.contains('hidden')) {
    if (typeof hideBalancePasteArea === 'function') {
      hideBalancePasteArea();
    }
    return;
  }

  const diffTableView = document.getElementById('diff-table-view');
  if (diffTableView && !diffTableView.classList.contains('hidden')) {
    diffTableView.classList.add('hidden');
    document.getElementById('balance-view').classList.remove('hidden');
    return;
  }

  const balanceView = document.getElementById('balance-view');
  if (balanceView && !balanceView.classList.contains('hidden')) {
    balanceView.classList.add('hidden');
    closeModal();
    return;
  }

  const returnView = document.getElementById('return-view');
  if (returnView && !returnView.classList.contains('hidden')) {
    returnView.classList.add('hidden');
    closeModal();
    if (typeof toggleReturnMode === 'function' && window.isReturnMode) {
      toggleReturnMode(); 
    }
    return;
  }

  if (!document.getElementById('user-view').classList.contains('hidden')) {
    closeUserMenu();
    return;
  }

  if (!document.getElementById('where-view').classList.contains('hidden')) {
    closeWhereMenu();
    return;
  }
  
  if (!document.getElementById('numpad-view').classList.contains('hidden')) {
     if (window.isPartialReturnInput) {
      window.isPartialReturnInput = false;
      const addBtnEl = document.getElementById('addBtn');
      if (addBtnEl) addBtnEl.style.background = "#22c55e";
      closeModal();
      return;
    }
    document.getElementById('numpad-view').classList.add('hidden');
    document.getElementById('stock-view').classList.remove('hidden');
    return;
  }
  
  if (!document.getElementById('stock-view').classList.contains('hidden')) {
    closeModal();
    return;
  }
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
      if (window.isPartialReturnInput) {
        addBtn.innerText = `ВЕРНУТЬ ЧАСТЬ: ${window.currentQty}`;
      } else {
        addBtn.innerText = `ДОБАВИТЬ ${window.currentQty}`;
      }
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
  closeUserMenu();
}

/* Новые изолированные функции для работы с подэкраном КУДА */
function openWhereMenu() {
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('where-view').classList.remove('hidden');
  const input = document.getElementById('where-input');
  if (input) {
    input.value = window.currentWhere === "Не указан" ? "" : window.currentWhere;
    setTimeout(() => input.focus(), 50);
  }
}

function closeWhereMenu() {
  document.getElementById('where-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.remove('hidden');
}

function saveWhereValue() {
  const input = document.getElementById('where-input');
  const val = input ? input.value.trim() : "";
  window.currentWhere = val !== "" ? val : "Не указан";
  
  const label = document.getElementById('whereLabel');
  if (label) {
    label.innerText = window.currentWhere;
  }
  closeWhereMenu();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  if (document.getElementById('where-view')) document.getElementById('where-view').classList.add('hidden');
  if (document.getElementById('return-view')) document.getElementById('return-view').classList.add('hidden');
  if (document.getElementById('balance-view')) document.getElementById('balance-view').classList.add('hidden');
  if (document.getElementById('diff-table-view')) document.getElementById('diff-table-view').classList.add('hidden');
  
  window.isPartialReturnInput = false;
  const addBtnEl = document.getElementById('addBtn');
  if (addBtnEl) addBtnEl.style.background = "#22c55e";

  window.scanning = false;
  const camBtn = document.getElementById('start-camera');
  if (camBtn) camBtn.disabled = false;
}
