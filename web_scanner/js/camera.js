// Сохраняем оригинальные рабочие переменные состояния в чистом виде
let stream = null;
let scanning = false;
let canvas = null;
let context = null;

// Привязываем функции управления к глобальному объекту Camera, чтобы кнопка из index.html могла их вызвать
window.Camera = {
    toggle() {
        if (scanning) { stopCamera(); } 
        else { startScanner(); }
    }
};

function stopCamera() {
    scanning = false;
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    // Используем явный поиск элемента, чтобы избежать сбоев в разных браузерах
    const videoElement = document.getElementById('video');
    if (videoElement) videoElement.srcObject = null;
    
    const sBtn = document.getElementById('start-camera');
    if (sBtn) {
        sBtn.innerText = "Найти QR";
        sBtn.disabled = false;
    }
}

async function startScanner() {
    if (scanning) return;
    const videoElement = document.getElementById('video');
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoElement) videoElement.srcObject = stream;
        scanning = true;
        
        const sBtn = document.getElementById('start-camera');
        if (sBtn) {
            sBtn.innerText = "ВЫКЛ КАМЕРУ";
            sBtn.disabled = false;
        }
        requestAnimationFrame(tick);
    } catch (e) { 
        alert("Ошибка камеры"); 
    }
}

function tick() {
    const videoElement = document.getElementById('video');
    
    if (videoElement && videoElement.readyState === videoElement.HAVE_ENOUGH_DATA && scanning) {
        if (!canvas) { canvas = document.createElement('canvas'); context = canvas.getContext('2d'); }
        canvas.width = videoElement.videoWidth; canvas.height = videoElement.videoHeight;
        context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        const code = jsQR(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
        
        if (code) { 
            // 1. Записываем данные в наше новое единое состояние приложения
            AppConfig.state.currentQR = code.data; 
            
            // 2. Гасим камеру оригинальным рабочим методом
            stopCamera(); 
            
            // 3. Открываем новый нумпад (флаг false означает, что товар пришел с камеры)
            Numpad.open(false); 
            return; 
        }
    }
    if (scanning) requestAnimationFrame(tick);
}
