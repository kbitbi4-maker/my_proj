// URL вашего Google Apps Script (берем из старого проекта)
const SCRIPT_URL = 'https://google.com';

// Инициализация двух баз данных в локальном хранилище (v10 — новая версия для ВЕБ-СКАНЕР PRO)
let qrLogs = JSON.parse(localStorage.getItem('pro_logs_v10')) || [];
let inventoryData = JSON.parse(localStorage.getItem('pro_inventory_v10')) || [];

// Функция разбора QR-кода по новому разделителю "!"
function parseQR(qrText) {
    if (!qrText) return [];
    // Разбиваем строку по знаку "!" вместо старого "/"
    return qrText.split('!');
}

// Функция фоновой отправки неотправленных строк (группой/массивом ячеек)
async function sendUnsynced() {
    if (!navigator.onLine) return;
    
    for (let i = 0; i < qrLogs.length; i++) {
        if (qrLogs[i].status === 'wait') {
            qrLogs[i].status = 'syncing';
            try {
                // Отправляем чистый плоский массив ячеек (как строку Excel)
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
                break; // Прерываем цикл при ошибке сети
            }
        }
    }
}

