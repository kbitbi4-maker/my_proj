// URL вашего Google Apps Script (берем из старого проекта)
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxWWliIxyk0BxXNE8VriVtLaUbQB31VY8WoAl0hCIoR7fKK_98a70q6C6ioFLlgEofUDw/exec';

let qrLogs = JSON.parse(localStorage.getItem('pro_logs_v10')) || [];
let inventoryData = JSON.parse(localStorage.getItem('pro_inventory_v10')) || [];

function parseQR(qrText) {
    if (!qrText) return [];
    // Новый разделитель восклицательный знак
    return qrText.split('!');
}

async function syncFromGoogle() {
    if (!navigator.onLine) { alert("Нет сети!"); return; }
    
    const syncBtn = document.getElementById('sync-btn');
    if (syncBtn) syncBtn.style.animation = "spin 1s linear infinite";

    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        
        // Перезаписываем журнал выданных товаров из Google Таблицы
        if (data.logs) {
            qrLogs = data.logs.map(row => ({ data: row, status: 'ok' }));
            localStorage.setItem('pro_logs_v10', JSON.stringify(qrLogs));
        }
        
        // Перезаписываем остатки склада из Google Таблицы
        if (data.stock) {
            inventoryData = data.stock;
            localStorage.setItem('pro_inventory_v10', JSON.stringify(inventoryData));
        }

        if (typeof renderLogs === 'function') renderLogs();
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
                if (typeof renderLogs === 'function') renderLogs();
            } catch (e) {
                qrLogs[i].status = 'wait';
                localStorage.setItem('pro_logs_v10', JSON.stringify(qrLogs));
                break;
            }
        }
    }
}

// Заглушка для будущей кнопки "Остатки", чтобы не было ошибок при нажатии на 📋
function showStock() {
    if (!inventoryData || inventoryData.length === 0) { 
        alert("Склад пуст. Сначала нажмите ☁ для загрузки баз!"); 
        return; 
    }
    alert("База остатков загружена локально (" + inventoryData.length + " строк). Скоро мы выведем её в отдельное окно.");
}
