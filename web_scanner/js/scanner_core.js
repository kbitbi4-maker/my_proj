// Переменные состояния (инициализируются при загрузке)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWWliIxyk0BxXNE8VriVtLaUbQB31VY8WoAl0hCIoR7fKK_98a70q6C6ioFLlgEofUDw/exec';
// Проверяем авторизацию сотрудника из localStorage (если пусто — ставим значение по умолчанию)
window.authUser = localStorage.getItem('qr_auth_user') || "Неугодникова"; 
window.isSaving = false;
window.scanning = false; // Глобальный флаг состояния для js/camera.js

// Инициализация ссылок на элементы интерфейса и API

window.video = document.getElementById('video');
const indicator = document.getElementById('indicator');
const whoLabel = document.getElementById('who-label');
const numDisplay = document.getElementById('numpad-display');
const addBtn = document.getElementById('add-btn');

let qrLogs = JSON.parse(localStorage.getItem('qr_db_v9')) || [];
let inventoryData = JSON.parse(localStorage.getItem('qr_inventory_v2')) || [];

window.currentQR = "";
let currentQty = "0";
let currentUser = "Не указан";

function renderLogs() {
  const head = document.getElementById('logs-head');
  const body = document.getElementById('logs-body');
  if (!qrLogs.length) { body.innerHTML = '<tr><td colspan="11">Пусто</td></tr>'; return; }

  head.innerHTML = qrLogs.data.map(h => `<th>${h}</th>`).join('');

  body.innerHTML = qrLogs.slice(1).reverse().map(item => {
    const isSynced = item.status === 'ok';
    const bg = isSynced ? 'style="background:#d4edda;"' : '';
    return `<tr ${bg}>${item.data.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
  }).join('');
}

function showStock() {
  if (!inventoryData || inventoryData.length === 0) { alert("Сначала нажмите ☁"); return; }
  
  const searchInput = document.getElementById('stock-search');
  if (searchInput) searchInput.value = "";

  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.add('hidden');
  document.getElementById('stock-view').classList.remove('hidden');
  
  renderStock();
}

function renderStock() {
  const head = document.getElementById('stock-head');
  const body = document.getElementById('stock-body');
  const searchInput = document.getElementById('stock-search');
  const term = searchInput ? searchInput.value.toLowerCase() : "";
  
  head.innerHTML = inventoryData.map(h => `<th>${h}</th>`).join('');
  
  const filtered = inventoryData.slice(1).filter(row => 
    row.some(cell => String(cell).toLowerCase().includes(term))
  );
  
  body.innerHTML = filtered.map(row => {
    const fullCode = `${row}/${row}/${row}/${row}`; 
    return `<tr onclick="selectFromStock('${fullCode}')">${row.map(c => `<td>${c}</td>`).join('')}</tr>`;
  }).join('');
  
  if (filtered.length === 0) {
    body.innerHTML = '<tr><td colspan="11">Ничего не найдено</td></tr>';
  }
}

function selectFromStock(code) { window.currentQR = code; closeModal(); openModal(); }

function openModal() {
  const qrParts = window.currentQR.split('/');
  const qrArt = qrParts; 
  const qrParam = qrParts; 

  const foundRow = inventoryData.find(r => 
    String(r) === String(qrArt) && String(r) === String(qrParam)
  );

  const stock = foundRow ? ` (Ост: ${foundRow || '0'})` : " (Ост: ?)";

  document.getElementById('qr-data-display').innerText = "ТОВАР: " + window.currentQR + stock;
  
  currentQty = "0"; numDisplay.innerText = "0"; currentUser = "Не указан"; whoLabel.innerText = "...";
  addBtn.innerText = "ДОБАВИТЬ 0";
  document.getElementById('modal').classList.remove('hidden');
  document.getElementById('numpad-view').classList.remove('hidden');
  document.getElementById('stock-view').classList.add('hidden');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); document.getElementById('start-camera').disabled = false; window.scanning = false; }
function openUserMenu() { document.getElementById('numpad-view').classList.add('hidden'); document.getElementById('user-view').classList.remove('hidden'); }
function closeUserMenu() { document.getElementById('user-view').classList.add('hidden'); document.getElementById('numpad-view').classList.remove('hidden'); }
function selectUser(name) { currentUser = name; whoLabel.innerText = name; addBtn.innerText = `ДОБАВИТЬ ${currentQty} (${currentUser})`; closeUserMenu(); }

function pressNum(n) { 
  if (n==='C') currentQty="0"; 
  else currentQty=currentQty==="0"?String(n):currentQty+n; 
  numDisplay.innerText=currentQty; 
  addBtn.innerText=`ДОБАВИТЬ ${currentQty} (${currentUser})`; 
}

async function saveEntry() {
  if (window.isSaving) return; 
  window.isSaving = true;

  try {
    const now = new Date(),
          hh = now.getHours().toString().padStart(2,'0'),
          mm = now.getMinutes().toString().padStart(2,'0'),
          time = "'" + hh + ":" + mm,
          day = now.getDate().toString().padStart(2,'0'),
          month = (now.getMonth()+1).toString().padStart(2,'0'),
          year = now.getFullYear().toString().slice(-2);
    
    const qrParts = window.currentQR.split('/');
    const nextId = qrLogs.length > 1 ? Math.max(...qrLogs.filter(r => r.status === 'ok' || !isNaN(r.data)).map(r => parseInt(r.data) || 0)) + 1 : 1;

    const newRowData = [nextId, ...qrParts, currentQty, currentUser, window.authUser, time, day, month, year];

    const qty = parseInt(currentQty) || 0;
    inventoryData = inventoryData.map(r => {
      if (String(r) === String(qrParts) && String(r) === String(qrParts)) {
        r = (parseInt(r) || 0) - qty;
      }
      return r;
    });

    localStorage.setItem('qr_inventory_v2', JSON.stringify(inventoryData));
    qrLogs.push({ data: newRowData, status: 'wait' });
    localStorage.setItem('qr_db_v9', JSON.stringify(qrLogs));   
    
    renderLogs(); closeModal();
    window.isSaving = false; sendUnsynced(); 
    
  } catch (e) { console.error(e); window.isSaving = false; }
}

async function sendUnsynced() {
  if (!navigator.onLine) return;
  for (let i = 0; i < qrLogs.length; i++) {
    if (qrLogs[i].status === 'wait') {
      qrLogs[i].status = 'syncing'; 
      try {
        await fetch(SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          body: JSON.stringify({ row: qrLogs[i].data })
        });
        qrLogs[i].status = 'ok';
        localStorage.setItem('qr_db_v9', JSON.stringify(qrLogs));
        renderLogs();
      } catch (e) {
        qrLogs[i].status = 'wait'; 
        localStorage.setItem('qr_db_v9', JSON.stringify(qrLogs));
        break; 
      }
    }
  }
}

async function syncFromGoogle() {
  if (!navigator.onLine) return;
  try {
    const res = await fetch(SCRIPT_URL);
    const data = await res.json();
    
    if (data.logs) {
      qrLogs = data.logs.map(row => ({ data: row, status: 'ok' }));
      localStorage.setItem('qr_db_v9', JSON.stringify(qrLogs));
    }
    if (data.stock) {
      inventoryData = data.stock;
      localStorage.setItem('qr_inventory_v2', JSON.stringify(inventoryData));
    }
    renderLogs();
  } catch (e) { alert("Ошибка"); }
}
      
function updateStatus() { 
  if (indicator) indicator.classList.toggle('net-online', navigator.onLine); 
}

window.addEventListener('online', () => {
  updateStatus();
  sendUnsynced(); 
});

window.addEventListener('offline', updateStatus);

// Автоматический старт логики при загрузке ядра
updateStatus(); 
renderLogs();
sendUnsynced();
