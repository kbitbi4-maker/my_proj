// js/numpad.js — Модуль цифровой клавиатуры и навигации — ЧАСТЬ 1

window.isEditingDate = false;
window.customDateStr = ""; 
window.currentWhere = "Не указан";

window.numpadSelectedWarehouse = "скл.1"; // Хранит выбранный склад списания на нумпаде
window.issuanceBasket = []; // Глобальная корзина для хранения множественной выдачи материалов

function openNumpadView() {
  if (!window.currentSelectedRowData || window.currentSelectedRowData.length === 0) return;

  const itemTitle = window.currentSelectedRowData.slice(0, 4).join(' ');
  const currentStock = window.currentSelectedRowData[4] || '0';

  document.getElementById('qr-data-display').innerText = `ТОВАР: ${itemTitle} (Ост: ${currentStock})`;
  
  window.currentQty = "0"; 
  window.isEditingDate = false;
  
  // КРИТИЧЕСКИЙ СБРОС ИЛИ СОХРАНЕНИЕ: Если корзина пуста, инициализируем метаданные, иначе сохраняем набранные
  if (window.issuanceBasket.length === 0) {
    window.currentUser = "Не указан"; 
    window.currentWhere = "Не указан";
    window.customDateStr = "";
    window.numpadSelectedWarehouse = "скл.1";
    
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear().toString().slice(-2);
    
    const dateBtn = document.getElementById('date-select-btn');
    if (dateBtn) dateBtn.innerText = `Дата: ${day}.${month}.${year}`;
  }
  
  if (typeof numDisplay !== 'undefined' && numDisplay) numDisplay.innerText = "0"; 
  
  // Синхронизируем отображение лейблов с текущим состоянием памяти (чтобы данные не затирались при добавлении 2-го товара)
  if (typeof whoLabel !== 'undefined' && whoLabel) whoLabel.innerText = window.currentUser === "Не указан" ? "..." : window.currentUser;
  if (typeof whereLabel !== 'undefined' && whereLabel) whereLabel.innerText = window.currentWhere === "Не указан" ? "..." : window.currentWhere;
  
  const addBtnEl = document.getElementById('addBtn');
  if (addBtnEl) {
    if (window.isPartialReturnInput) {
      addBtnEl.innerText = "ВЕРНУТЬ ЧАСТЬ: 0";
    } else {
      addBtnEl.innerText = "ЗАФИКСИРОВАТЬ ТОВАР: 0";
    }
  }
  
  const whBtn = document.getElementById('numpad-warehouse-btn');
  if (whBtn) whBtn.innerText = window.numpadSelectedWarehouse.toUpperCase();

  const whereInputEl = document.getElementById('where-input');
  if (whereInputEl) whereInputEl.value = window.currentWhere === "Не указан" ? "" : window.currentWhere;

  updateNumpadBasketDisplayVisuals();

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
  document.getElementById('user-view').classList.add('hidden');
  if (document.getElementById('where-view')) document.getElementById('where-view').classList.add('hidden');
  if (document.getElementById('return-view')) document.getElementById('return-view').classList.add('hidden');
  if (document.getElementById('balance-view')) document.getElementById('balance-view').classList.add('hidden');
  if (document.getElementById('diff-table-view')) document.getElementById('diff-table-view').classList.add('hidden');
  document.getElementById('numpad-view').classList.remove('hidden');
}

/**
 * ОПЦИЯ 2: Кнопка Добавить еще. Закрывает нумпад и открывает Лист 1 остатков, сохраняя метаданные
 */
function addMoreMaterialsToOrder() {
  if (window.isPartialReturnInput) {
    alert("Внимание: В режиме возврата нельзя собирать пакет материалов.");
    return;
  }
  // Просто прячем нумпад и возвращаем пользователя к таблице остатков
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
}
// js/numpad.js — Модуль цифровой клавиатуры и навигации — ЧАСТЬ 2

function handleBackButton() {
  const pasteContainer = document.getElementById('balance-paste-container');
  if (pasteContainer && !pasteContainer.classList.contains('hidden')) {
    if (typeof hideBalancePasteArea === 'function') hideBalancePasteArea();
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
    if (typeof toggleReturnMode === 'function' && window.isReturnMode) toggleReturnMode(); 
    return;
  }

  if (!document.getElementById('user-view').classList.contains('hidden')) { closeUserMenu(); return; }
  if (!document.getElementById('where-view').classList.contains('hidden')) { closeWhereMenu(); return; }
  
  if (!document.getElementById('numpad-view').classList.contains('hidden')) {
    window.isPartialReturnInput = false;
    window.issuanceBasket = []; // Сбрасываем пакет при принудительной отмене назад
    closeModal();
    return;
  }
  
  if (!document.getElementById('stock-view').classList.contains('hidden')) { closeModal(); return; }
}

function toggleNumpadWarehouse() {
  window.numpadSelectedWarehouse = window.numpadSelectedWarehouse === "скл.1" ? "скл.2" : "скл.1";
  const whBtn = document.getElementById('numpad-warehouse-btn');
  if (whBtn) whBtn.innerText = window.numpadSelectedWarehouse.toUpperCase();
}

function pressNum(n) {
  if (window.isEditingDate) {
    if (n === 'C') {
      if (window.customDateStr.length > 0) window.customDateStr = window.customDateStr.slice(0, -1);
    } else {
      if (window.customDateStr.length < 6) window.customDateStr += String(n);
    }
    let displayMask = window.customDateStr + "______".slice(window.customDateStr.length);
    updateDateDisplay(displayMask);
    if (window.customDateStr.length === 6) {
      window.isEditingDate = false;
      const dateBtn = document.getElementById('date-select-btn');
      if (dateBtn) dateBtn.style.borderColor = "#cbd5e1";
    }
  } else {
    if (n === 'C') { window.currentQty = "0"; } 
    else { window.currentQty = window.currentQty === "0" ? String(n) : window.currentQty + n; }
    
    if (typeof numDisplay !== 'undefined' && numDisplay) numDisplay.innerText = window.currentQty;
    
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
      if (window.isPartialReturnInput) addBtn.innerText = `ВЕРНУТЬ ЧАСТЬ: ${window.currentQty}`;
      else addBtn.innerText = `ЗАФИКСИРОВАТЬ ТОВАР: ${window.currentQty}`;
    }
  }
}

function updateNumpadBasketDisplayVisuals() {
  const displayEl = document.getElementById('numpad-basket-display');
  const finalBtn = document.getElementById('final-submit-basket-btn');
  if (!displayEl) return;

  if (!window.issuanceBasket || window.issuanceBasket.length === 0) {
    displayEl.innerText = "Корзина пуста. Добавьте первый товар...";
    if (finalBtn) finalBtn.classList.add('hidden');
    return;
  }

  let text = "";
  window.issuanceBasket.forEach((item, index) => {
    text += `${index + 1}. ${item.title}\n Кол-во: ${item.qty} шт. [${item.wh.toUpperCase()}]\n\n`;
  });
  displayEl.innerText = text;

  if (finalBtn) {
    finalBtn.innerText = `ПОДТВЕРДИТЬ ВЫДАЧУ ПАКЕТА (${window.issuanceBasket.length})`;
    finalBtn.classList.remove('hidden');
  }
}

function pushCurrentToBasket() {
  const qty = parseInt(window.currentQty) || 0;
  if (qty <= 0) { alert("Ошибка: Количество должно быть больше 0!"); return; }

  // Если это режим частичного возврата, то проводим его сразу без корзины по старой логике
  if (window.isPartialReturnInput) {
    saveEntry();
    return;
  }

  const p1 = window.currentSelectedRowData[0] || "";
  const p2 = window.currentSelectedRowData[1] || "";
  const p3 = window.currentSelectedRowData[2] || "";
  const p4 = window.currentSelectedRowData[3] || "";
  const itemIndex = window.currentSelectedRowData[5];

  window.issuanceBasket.push({
    title: `${p1} ${p2} ${p3}`,
    p1: p1, p2: p2, p3: p3, p4: p4,
    qty: qty,
    wh: window.numpadSelectedWarehouse,
    stockRowIndex: itemIndex
  });

  window.currentQty = "0";
  if (typeof numDisplay !== 'undefined' && numDisplay) numDisplay.innerText = "0";
  const addBtn = document.getElementById('addBtn');
  if (addBtn) addBtn.innerText = "ЗАФИКСИРОВАТЬ ТОВАР: 0";

  updateNumpadBasketDisplayVisuals();
}

function clearIssuanceBasket() {
  window.issuanceBasket = [];
  updateNumpadBasketDisplayVisuals();
}

function openUserMenu() { document.getElementById('numpad-view').classList.add('hidden'); document.getElementById('user-view').classList.remove('hidden'); }
function closeUserMenu() { document.getElementById('user-view').classList.add('hidden'); document.getElementById('numpad-view').classList.remove('hidden'); }
function selectUser(name) { window.currentUser = name; if (typeof whoLabel !== 'undefined' && whoLabel) whoLabel.innerText = name; closeUserMenu(); }
function openWhereMenu() { document.getElementById('numpad-view').classList.add('hidden'); document.getElementById('where-view').classList.remove('hidden'); const input = document.getElementById('where-input'); if (input) { input.value = window.currentWhere === "Не указан" ? "" : window.currentWhere; setTimeout(() => input.focus(), 50); } }
function closeWhereMenu() { document.getElementById('where-view').classList.add('hidden'); document.getElementById('numpad-view').classList.remove('hidden'); }
function saveWhereValue() { const input = document.getElementById('where-input'); const val = input ? input.value.trim() : ""; window.currentWhere = val !== "" ? val : "Не указан"; const label = document.getElementById('whereLabel'); if (label) label.innerText = window.currentWhere; closeWhereMenu(); }
function closeModal() { document.getElementById('modal').classList.add('hidden'); document.getElementById('stock-view').classList.add('hidden'); document.getElementById('numpad-view').classList.add('hidden'); document.getElementById('user-view').classList.add('hidden'); if (document.getElementById('where-view')) document.getElementById('where-view').classList.add('hidden'); if (document.getElementById('return-view')) document.getElementById('return-view').classList.add('hidden'); if (document.getElementById('balance-view')) document.getElementById('balance-view').classList.add('hidden'); if (document.getElementById('diff-table-view')) document.getElementById('diff-table-view').classList.add('hidden'); window.isPartialReturnInput = false; const addBtnEl = document.getElementById('addBtn'); if (addBtnEl) addBtnEl.style.background = "#22c55e"; window.scanning = false; const camBtn = document.getElementById('start-camera'); if (camBtn) camBtn.disabled = false; window.issuanceBasket = []; }
function toggleDateMode() { window.isEditingDate = !window.isEditingDate; const dateBtn = document.getElementById('date-select-btn'); if (window.isEditingDate) { if (dateBtn) dateBtn.style.borderColor = "#ff9800"; if (window.customDateStr === "") updateDateDisplay("______"); } else { if (dateBtn) dateBtn.style.borderColor = "#cbd5e1"; if (window.customDateStr.length < 6) { window.customDateStr = ""; const now = new Date(); const day = now.getDate().toString().padStart(2, '0'); const month = (now.getMonth() + 1).toString().padStart(2, '0'); const year = now.getFullYear().toString().slice(-2); if (dateBtn) dateBtn.innerText = `Дата: ${day}.${month}.${year}`; } } }
function updateDateDisplay(str) { const d1 = str[0] || '_', d2 = str[1] || '_', m1 = str[2] || '_', m2 = str[3] || '_', y1 = str[4] || '_', y2 = str[5] || '_'; const dateBtn = document.getElementById('date-select-btn'); if (dateBtn) dateBtn.innerText = `Дата: ${d1}${d2}.${m1}${m2}.${y1}${y2}`; }
