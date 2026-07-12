// js/numpad.js — Модуль нумпада и прямой выдачи материала целиком

function openNumpadView() {
  if (!currentSelectedRowData || currentSelectedRowData.length === 0) return;

  // Первые 4 столбца — это чистые данные товара (Артикул, Название, Тип, Параметр)
  const itemTitle = currentSelectedRowData.slice(0, 4).join(' ');
  // 5-й столбец (индекс 4) — актуальный остаток на складе
  const currentStock = currentSelectedRowData[4] || '0';

  document.getElementById('qr-data-display').innerText = `ТОВАР: ${itemTitle} (Ост: ${currentStock})`;
  
  // Сброс глобального состояния ввода количества и пользователя
  window.currentQty = "0"; 
  window.currentUser = "Не указан"; 
  
  if (typeof numDisplay !== 'undefined' && numDisplay) numDisplay.innerText = "0"; 
  if (typeof whoLabel !== 'undefined' && whoLabel) whoLabel.innerText = "...";
  if (typeof addBtn !== 'undefined' && addBtn) addBtn.innerText = "ДОБАВИТЬ 0";
  
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.remove('hidden');
}

function pressNum(n) {
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
