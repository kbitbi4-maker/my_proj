// 1. ПЕРЕМЕННЫЕ И НАСТРОЙКИ
const video = document.getElementById('video');
const resultDiv = document.getElementById('result');
const startBtn = document.getElementById('start-camera');
const whoLabel = document.getElementById('who-label');
const numDisplay = document.getElementById('numpad-display');
const addBtn = document.getElementById('add-btn');

let qrLogs = JSON.parse(localStorage.getItem('qr_db_v7')) || [];
let stream = null, scanning = false, canvas = null, context = null;
let currentQR = "", currentQty = "0", currentUser = "Не указан";

// --- 1. РАБОТА С КАМЕРОЙ И СКАНЕРОМ ---
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
    if (code && code.data) { 
      currentQR = code.data; 
      stopCamera(); 
      openModal(); 
      return; 
    }
  }
  if (scanning) requestAnimationFrame(tick);
}

// --- 2. МЕНЮ ВЫБОРА (КОЛИЧЕСТВО И ИСПОЛНИТЕЛЬ) ---
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
  currentUser = name; 
  whoLabel.innerText = name; 
  closeUserMenu();
}

// --- 3. ЗАПИСЬ В LOCAL STORAGE ---
function renderLogs() {
  if (!qrLogs.length) { 
    resultDiv.innerHTML = '<div class="log-title" style="text-align:center">Список пуст</div>'; 
    return; 
  }
  let html = '<div class="log-title">База данных (Локально):</div>';
  [...qrLogs].reverse().forEach(log => {
    html += `<div class="log-item">${log}</div>`;
  });
  resultDiv.innerHTML = html;
}

function saveEntry() {
  const entry = `${currentQR} | Кол-во: ${currentQty} | Кому: ${currentUser} | ${new Date().toLocaleString()}`;
  
  // Сохраняем массив в память телефона
  qrLogs.push(entry);
  localStorage.setItem('qr_db_v7', JSON.stringify(qrLogs));
  
  renderLogs();
  closeModal();
}

// Запуск отображения при открытии
renderLogs();
