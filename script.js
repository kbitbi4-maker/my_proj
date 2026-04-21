const SCRIPT_URL = 'https://google.com';

const video = document.getElementById('video');
const startBtn = document.getElementById('start-camera');
const cameraBox = document.getElementById('camera-box');
const resultList = document.getElementById('result-list');
const delBtn = document.getElementById('del-btn');
const syncBtn = document.getElementById('sync-btn');
const indicator = document.getElementById('indicator');

let qrLogs = JSON.parse(localStorage.getItem('qr_db_v7')) || [];
let selectedIndices = new Set();
let stream = null;
let scanning = false;
let canvas = document.createElement('canvas');
let context = canvas.getContext('2d');
let lastHash = "";

function render() {
    if (qrLogs.length === 0) {
        resultList.innerHTML = '<p style="text-align:center">Список пуст</p>';
        updateDelUI();
        return;
    }
    let html = '';
    [...qrLogs].reverse().forEach((log, index) => {
        const realIdx = qrLogs.length - 1 - index;
        const selClass = selectedIndices.has(realIdx) ? 'selected' : '';
        html += `<div class="log-item ${selClass}" onclick="toggleSelect(${realIdx})">${log}</div>`;
      });
    resultList.innerHTML = html;
    updateDelUI();
}

function toggleSelect(idx) {
    if (selectedIndices.has(idx)) selectedIndices.delete(idx);
    else selectedIndices.add(idx);
    render();
}

function updateDelUI() {
    const hasSelection = selectedIndices.size > 0;
    delBtn.style.display = hasSelection ? 'block' : 'none';
    syncBtn.style.display = hasSelection ? 'none' : 'block';
    if (hasSelection) delBtn.innerText = `УДАЛИТЬ (${selectedIndices.size})`;
}

async function syncFromGoogle() {
    if (!navigator.onLine) return;
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        const dataString = JSON.stringify(data);
        if (data && (dataString !== lastHash || qrLogs.length === 0)) {
            qrLogs = data;
            localStorage.setItem('qr_db_v7', JSON.stringify(qrLogs));
            lastHash = dataString;
            indicator.classList.add('net-online');
            render();
        }
    } catch (e) { indicator.classList.remove('net-online'); }
}

async function deleteSelected() {
    if (!confirm(`Удалить выбранные?`)) return;
    const itemsToDelete = Array.from(selectedIndices).map(i => qrLogs[i]);
    qrLogs = qrLogs.filter((_, i) => !selectedIndices.has(i));
    localStorage.setItem('qr_db_v7', JSON.stringify(qrLogs));
    selectedIndices.clear();
    render();

    if (navigator.onLine) {
        try {
            await fetch(SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                body: JSON.stringify({ action: 'delete', items: itemsToDelete })
            });
        } catch (e) {}
    }
}

startBtn.addEventListener('click', async () => {
    if (!scanning) {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            video.srcObject = stream;
            cameraBox.style.display = 'block';
            startBtn.textContent = "СТОП";
            startBtn.style.background = "#f44336";
            scanning = true;
            scanLoop();
        } catch (err) { alert("Ошибка камеры"); }
    } else {
        stopScanner();
    }
});

function stopScanner() {
    scanning = false;
    if (stream) stream.getTracks().forEach(t => t.stop());
    video.srcObject = null;
    cameraBox.style.display = 'none';
    startBtn.textContent = "Найти QR";
    startBtn.style.background = "transparent";
}

function scanLoop() {
    if (!scanning) return;
    if (video.videoWidth > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const code = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
        if (code) {
            const entry = `${code.data} | ${new Date().toLocaleString()}`;
            saveEntry(entry);
            stopScanner();
            return;
        }
    }
    setTimeout(scanLoop, 250);
}

async function saveEntry(entry) {
    qrLogs.push(entry);
    localStorage.setItem('qr_db_v7', JSON.stringify(qrLogs));
    render();
    if (navigator.onLine) {
        try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ data: entry }) }); } catch (e) {}
    }
}

syncBtn.addEventListener('click', syncFromGoogle);
delBtn.addEventListener('click', deleteSelected);

render();
syncFromGoogle();
setInterval(() => { indicator.classList.toggle('net-online', navigator.onLine); }, 3000);
