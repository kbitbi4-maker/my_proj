// js/numpad.js — Модуль нумпада и прямой выдачи материала (до 100 строк)

function openNumpadView() {
  // Первые 4 столбца — это чистые данные товара (например: Артикул, Название, Тип, Параметр)
  const itemTitle = currentSelectedRowData.slice(0, 4).join(' ');
  // 5-й столбец (индекс 4) — актуальный остаток на складе
  const currentStock = currentSelectedRowData[4] || '0';

  document.getElementById('qr-data-display').innerText = `ТОВАР: ${itemTitle} (Ост: ${currentStock})`;
  
  // Сброс состояния ввода
  currentQty = "0"; 
  numDisplay.innerText = "0"; 
  currentUser = "Не указан"; 
  whoLabel.innerText = "...";
  addBtn.innerText = "ДОБАВИТЬ 0";
  
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.remove('hidden');
}

function pressNum(n) {
  if (n === 'C') {
    currentQty = "0";
  } else {
    currentQty = currentQty === "0" ? String(n) : currentQty + n;
  }
  numDisplay.innerText = currentQty;
  addBtn.innerText = `ДОБАВИТЬ ${currentQty} (${currentUser})`;
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
  currentUser = name;
  whoLabel.innerText = name;
  addBtn.innerText = `ДОБАВИТЬ ${currentQty} (${currentUser})`;
  closeUserMenu();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  if (typeof scanning !== 'undefined') scanning = false;
  const camBtn = document.getElementById('start-camera');
  if (camBtn) camBtn.disabled = false;
}

