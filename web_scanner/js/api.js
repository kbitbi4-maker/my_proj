// URL вашего Google Apps Script (берем из старого проекта)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWWliIxyk0BxXNE8VriVtLaUbQB31VY8WoAl0hCIoR7fKK_98a70q6C6ioFLlgEofUDw/exec';

let qrLogs = JSON.parse(localStorage.getItem('pro_logs_v10')) || [];
let inventoryData = JSON.parse(localStorage.getItem('pro_inventory_v10')) || [];

// Инициализация отображения таблицы сразу при открытии приложения
window.addEventListener('DOMContentLoaded', () => {
    renderLogs();
});

function parseQR(qrText) {
    if (!qrText) return [];
    return qrText.split('!');
}

function renderLogs() {
    const head = document.getElementById('logs-head');
    const body = document.getElementById('logs-body');
    if (!head || !body) return;

    if (!qrLogs.length) { 
        body.innerHTML = '<tr><td colspan="12" style="color:#777; padding:15px;">Журнал пуст. Нажмите ☁ для загрузки.</td></tr>'; 
        return; 
    }

    // В новой структуре qrLogs хранит объекты: { data: [ячейка1, ячейка2, ...], status: 'ok' }
    // 1. Из первой строки (индекс 0) вытаскиваем массив названий колонок Excel
    head.innerHTML = qrLogs[0].data.map(h => `<th>${h}</th>`).join('');

    // 2. Все остальные строки переворачиваем, чтобы новые записи были вверху
    body.innerHTML = qrLogs.slice(1).reverse().map(item => {
        const bg = item.status === 'ok' ? 'style="background:#d4edda;"' : '';
        return `<tr ${bg}>${item.data.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    }).join('');
}

async function syncFromGoogle() {
    if (!navigator.onLine) { alert("Нет сети!"); return; }
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) syncBtn.style.animation = "spin 1s linear infinite";

    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        
        if (data.logs) {
            qrLogs = data.logs.map(row => ({ data: row, status: 'ok' }));
            localStorage.setItem('pro_logs_v10', JSON.stringify(qrLogs));
        }
        if (data.stock) {
            inventoryData = data.stock;
            localStorage.setItem('pro_inventory_v10', JSON.stringify(inventoryData));
        }

        renderLogs();
        if (typeof renderStock === 'function') renderStock();
        alert("Синхронизация успешна!");
    } catch (e) {
        alert("Ошибка загрузки данных: " + e.message);
    } finally {
        if (syncBtn) syncBtn.style.animation = "";
    }
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
                localStorage.setItem('pro_logs_v10', JSON.stringify(qrLogs));
                renderLogs();
            } catch (e) {
                qrLogs[i].status = 'wait';
                localStorage.setItem('pro_logs_v10', JSON.stringify(qrLogs));
                break;
            }
        }
    }
}

function showStock() {
    if (!inventoryData || inventoryData.length === 0) { 
        alert("Склад пуст. Сначала нажмите ☁ для загрузки баз!"); 
        return; 
    }
    alert("База остатков загружена локально (" + inventoryData.length + " строк).");
}
