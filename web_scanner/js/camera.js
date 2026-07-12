let stream = null;
let scanning = false;
let canvas = null;
let context = null;
let currentQR = "";

// Привязываем элементы только после полной загрузки страницы
let video = null;
let sBtn = null;

window.addEventListener('DOMContentLoaded', () => {
    video = document.getElementById('video');
    sBtn = document.getElementById('start-camera');
});

function toggleCamera() {
    if (scanning) { 
        stopCamera(); 
    } else { 
        startScanner(); 
    }
}

function stopCamera() {
    scanning = false;
    if (stream) { 
        stream.getTracks().forEach(track => track.stop()); 
        stream = null;
    }
    if (video) { video.srcObject = null; }
    if (sBtn) { sBtn.innerText = "Найти QR"; }
}

async function startScanner() {
    if (scanning) return;
    try {
        // Запрашиваем доступ к камере
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (video) { video.srcObject = stream; }
        scanning = true;
        if (sBtn) { sBtn.innerText = "ВЫКЛ КАМЕРУ"; }
        requestAnimationFrame(tick);
    } catch (e) { 
        alert("Ошибка камеры: " + e.message); 
    }
}

function tick() {
    if (!video || !scanning) return;
    
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!canvas) { 
            canvas = document.createElement('canvas'); 
            context = canvas.getContext('2d'); 
        }
        
        // Подстраиваем размеры холста под реальное видео
        canvas.width = video.videoWidth; 
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Извлекаем массив пикселей кадра
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        // Вызываем библиотеку и передаем обязательные параметры: данные, ширину, высоту
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) { 
            currentQR = code.data.trim(); 
            stopCamera(); 
            
            // Обработка QR-кода: разбиваем по знаку "!"
            const parts = currentQR.split('!');
            if (parts.length < 2) {
                alert("Ошибка: Неверный формат QR-кода (отсутствует разделитель '!')");
                return;
            }
            
            const param1 = parts[0].trim().toLowerCase();
            const param2 = parts[1].trim().toLowerCase();
            
            const currentData = window.inventoryData;
            if (!currentData || currentData.length <= 1) {
                alert("Ошибка: База данных остатков пуста. Синхронизируйте приложение ☁");
                return;
            }
            
            // Ищем строку в базе остатков по совпадению первых двух параметров
            let foundIndex = -1;
            for (let i = 1; i < currentData.length; i++) {
                const row = currentData[i];
                if (row && row[0] && row[1]) {
                    const cell1 = String(row[0]).trim().toLowerCase();
                    const cell2 = String(row[1]).trim().toLowerCase();
                    
                    if (cell1 === param1 && cell2 === param2) {
                        foundIndex = i;
                        break;
                    }
                }
            }
            
            if (foundIndex !== -1) {
                // Товар найден — копируем строку данных
                window.currentSelectedRowData = [...currentData[foundIndex]];
                
                // Переключаем интерфейс на ввод количества (нумпад)
                if (typeof openNumpadView === 'function') {
                    openNumpadView();
                } else {
                    alert("Ошибка: Модуль нумпада (js/numpad.js) не подключен.");
                }
            } else {
                alert(`Товар не найден в остатках!\nПараметр 1: ${parts[0]}\nПараметр 2: ${parts[1]}`);
            }
            return; 
        }
    }
    if (scanning) {
        requestAnimationFrame(tick);
    }
}
