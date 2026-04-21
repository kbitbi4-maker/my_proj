const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbz3KF13nR_sLT4TJF-XduOX-W7XS4F40LUTXXeGToZLOKLj6y093TF3O4fcWTNg12hoRQ/exec';
const video = document.getElementById('video');
const resultDiv = document.getElementById('result');
const startBtn = document.getElementById('start-camera');
const indicator = document.getElementById('indicator');
const whoLabel = document.getElementById('who-label');
const numDisplay = document.getElementById('numpad-display');
const addBtn = document.getElementById('add-btn');
const syncBtn = document.getElementById('sync-btn');

let qrLogs = JSON.parse(localStorage.getItem('qr_db_v7')) || [];
let selectedSet = new Set(); // Хранилище для выбранных строк
let stream = null, scanning = false, canvas = null, context = null;
let currentQR = "", currentQty = "0", lastHash = "", currentUser = "Не указан";

// --- ОТОБРАЖЕНИЕ И ВЫДЕЛЕНИЕ ---
function renderLogs() {
  if (!qrLogs.length) { 
    resultDiv.innerHTML = '<div class="log-title" style="text-align:center">Список пуст</div>'; 
    toggleDelMode(false);
    return; 
  }
  let html = '<div class="log-title">База данных:</div>';
  [...qrLogs].reverse().forEach((log, index) => {
    const originalIndex = qrLogs.length - 1 - index;
    const isSelected = selectedSet.has(originalIndex) ? 'selected' : '';
    html += `<div class="log-item ${isSelected}" onclick="toggleSelect(${originalIndex})">${log}</div>`;
  });
  resultDiv.innerHTML = html;
  toggleDelMode(selectedSet.size > 0);
}

function toggleSelect(idx) {
  if (selectedSet.has(idx)) selectedSet.delete(idx);
  else selectedSet.add(idx);
  renderLogs();
}

function toggleDelMode(show) {
  // Меняем иконку облака на надпись УДАЛИТЬ, если есть выделение
  if (show) {
    syncBtn.innerHTML = `<span style="font-size:0.7rem; font-weight:bold; color:#ff4b2b;">УДАЛИТЬ (${selectedSet.size})</span>`;
    syncBtn.onclick = deleteSelected;
  } else {
    syncBtn.innerHTML = "☁";
    syncBtn.onclick = syncFromGoogle;
  }
}

// --- УДАЛЕНИЕ (ЛОКАЛЬНО + ТАБЛИЦА) ---
async function deleteSelected() {
  if (!confirm(`Удалить выбранные записи (${selectedSet.size})?`)) return;
  
  const toDelete = Array.from(selectedSet).map(i => qrLogs[i]);
  
  // 1. Удаляем из памяти телефона
  qrLogs = qrLogs.filter((_, i) => !selectedSet.has(i));
  localStorage.setItem('qr_db_v7', JSON.stringify(qrLogs));
  selectedSet.clear();
  renderLogs();

  // 2. Удаляем из Google Таблицы (только если онлайн)
  if (navigator.onLine) {
    try {
      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        body: JSON.stringify({ action: 'delete', items: toDelete })
      });
    } catch (e) { console.log("Удалено локально"); }
  }
}

// --- СИНХРОНИЗАЦИЯ ---
async function syncFromGoogle() {
  if (!navigator.onLine) return;
  try {
    indicator.classList.add('net-online');
    const response = await fetch(SCRIPT_URL);
    const data = await response.json();
    const dataString = JSON.stringify(data);
    if (data && (dataString !== lastHash || qrLogs.length === 0)) {
      qrLogs = data;
      localStorage.setItem('qr_db_v7', JSON.stringify(qrLogs));
      lastHash = dataString;
      renderLogs();
    }
  } catch (e) { indicator.classList.remove('net-online'); }
}

// --- СКАНЕР И МОДАЛКА ---
async function toggleScanner() {
  if (scanning) stopCamera(); else startScanner();
}

async function startScanner() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    scanning = true;
    startBtn.textContent = "ВЫКЛЮЧИТЬ";
    startBtn.style.background = "#f44336";
    requestAnimationFrame(tick);
  } catch (e) { alert("Ошибка камеры"); }
}

function stopCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  scanning = false;
  startBtn.textContent = "Найти QR";
  startBtn.style.background = "transparent";
}

function tick() {
  if (video.readyState === video.HAVE_ENOUGH_DATA && scanning) {
    if (!canvas) { canvas = document.createElement('canvas'); context = canvas.getContext('2d'); }
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const code = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
    if (code && code.data) { currentQR = code.data; stopCamera(); openModal(); return; }
  }
  if (scanning) requestAnimationFrame(tick);
}

function openModal() {
  currentQty = "0"; numDisplay.innerText = "0"; addBtn.innerText = "ДОБАВИТЬ 0";
  document.getElementById('modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('modal').classList.add('hidden'); }

function pressNum(n) {
  if (n === 'C') currentQty = "0";
  else currentQty = currentQty === "0" ? String(n) : currentQty + n;
  numDisplay.innerText = currentQty;
  addBtn.innerText = `ДОБАВИТЬ ${currentQty}`;
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
  currentUser = name; whoLabel.innerText = name; closeUserMenu();
}

async function saveEntry() {
  const entry = `${currentQR} | Кол-во: ${currentQty} | Кому: ${currentUser} | ${new Date().toLocaleString()}`;
  qrLogs.push(entry);
  localStorage.setItem('qr_db_v7', JSON.stringify(qrLogs));
  renderLogs();
  closeModal();
  if (navigator.onLine) {
    try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ data: entry }) }); } catch(e) {}
  }
}

// Инициализация
function updateStatus() { indicator.classList.toggle('net-online', navigator.onLine); }
window.addEventListener('online', updateStatus);
window.addEventListener('offline', updateStatus);

updateStatus();
renderLogs();
syncFromGoogle();
setInterval(syncFromGoogle, 10000);
