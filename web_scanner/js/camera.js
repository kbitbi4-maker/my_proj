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
            currentQR = code.data; 
            stopCamera(); 
            
            // Выводим всплывающее окно с расшифровкой QR-кода
            alert("QR-код успешно считан!\n\nРасшифровка:\n" + currentQR); 
            return; 
        }
    }
    if (scanning) {
        requestAnimationFrame(tick);
    }
}
